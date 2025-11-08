# Technical Research & Decisions
# Feature 003: Parcours de Réservation Complet

**Date:** 2025-11-07
**Status:** Approved
**Branch:** `003-booking-flow`

---

## 1. Service Catalog & Address Management (FR-001 to FR-009)

### Context
Clients must browse services and select/enter an address where the service will be provided:
- Default address auto-populated from client profile
- Ability to change to another saved address
- Add new address with Google Places autocomplete
- Validate address is within service zone
- Optional save new address for future use

### Decision: **Google Places Autocomplete API + Client-Side Address Management**

### Rationale
**Why Google Places Autocomplete:**
- Industry-standard solution with excellent UX
- Real-time suggestions after 3 characters
- Returns structured address data (street, city, postal code, coordinates)
- Built-in validation and formatting
- Supports French addresses with accents

**Why Not Custom Address Database:**
- Expensive to maintain and update
- Inferior user experience
- No automatic validation of real addresses
- Would still need geocoding for coordinates

### Implementation Pattern

```typescript
// Hook: useAddressAutocomplete.ts
import { useMemo, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'] as const;

export function useAddressAutocomplete() {
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const autocompleteOptions = useMemo(
    () => ({
      componentRestrictions: { country: 'fr' },
      fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
      types: ['address'],
    }),
    []
  );

  return { isLoaded, selectedPlace, setSelectedPlace, autocompleteOptions };
}
```

```typescript
// Component: AddressSelector.tsx
export function AddressSelector({ clientId, onAddressSelected }) {
  const { data: savedAddresses } = useQuery({
    queryKey: ['client-addresses', clientId],
    queryFn: () => fetchClientAddresses(clientId),
  });

  const defaultAddress = savedAddresses?.find(addr => addr.is_default);

  // Auto-populate default address on mount
  useEffect(() => {
    if (defaultAddress && !selectedAddress) {
      onAddressSelected(defaultAddress);
    }
  }, [defaultAddress]);

  return (
    <div>
      {/* Current address display */}
      <AddressDisplay address={selectedAddress || defaultAddress} />

      {/* Change address button */}
      <Button onClick={() => setShowAddressSelector(true)}>
        Changer d'adresse
      </Button>

      {/* Address selector dialog */}
      {showAddressSelector && (
        <AddressSelectorDialog
          savedAddresses={savedAddresses}
          onSelectSaved={handleSelectSaved}
          onAddNew={handleAddNew}
        />
      )}
    </div>
  );
}
```

### Service Zone Validation

```typescript
// utils/service-zone-validator.ts
import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

export async function validateServiceZone(
  lat: number,
  lng: number
): Promise<{ isValid: boolean; zoneName?: string; message?: string }> {
  // Fetch service zones from database
  const { data: zones } = await supabase
    .from('service_zones')
    .select('*')
    .eq('is_active', true);

  const testPoint = point([lng, lat]);

  for (const zone of zones) {
    const zonePolygon = polygon(zone.boundary_coordinates);
    if (booleanPointInPolygon(testPoint, zonePolygon)) {
      return { isValid: true, zoneName: zone.name };
    }
  }

  return {
    isValid: false,
    message: 'Cette adresse est hors de notre zone de service actuellement.',
  };
}
```

---

## 2. Time Slot Selection & Availability Calculation (FR-010 to FR-013)

### Context
Display available time slots for the selected service, address, and date:
- Depends on spec 002 (availability algorithm)
- Must load in <3 seconds
- Interactive calendar with 30-day horizon
- Real-time availability verification before payment

### Decision: **Server-Side Availability Calculation + Client-Side Calendar UI**

### Alternatives Considered

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Client-Side Calculation** | Fast UI updates, no network latency | Complex logic duplication, security risk | ❌ |
| **Server-Side (Edge Function)** | Single source of truth, secure, consistent | Network latency, higher cost | ✅ **CHOSEN** |
| **Pre-computed Slots (Cron)** | Very fast reads, no compute on-demand | Stale data, complex invalidation | ❌ Overkill for MVP |

### Rationale
- **Spec 002 Integration:** Availability algorithm already exists server-side
- **Security:** Prevent client manipulation of available slots
- **Consistency:** All clients see same availability in real-time
- **Performance:** Edge Functions are fast enough (<1s response time)

### Implementation Pattern

```typescript
// Edge Function: get-available-slots.ts
export async function getAvailableSlots(
  serviceId: number,
  addressLat: number,
  addressLng: number,
  startDate: string,
  endDate: string,
  contractorId?: number // Optional: filter by contractor for slug booking
) {
  // 1. Get service details (duration, buffer time)
  const service = await getService(serviceId);

  // 2. Get contractors offering this service in the area
  const contractors = contractorId
    ? [await getContractor(contractorId)]
    : await getContractorsForService(serviceId, addressLat, addressLng);

  // 3. For each contractor, calculate available slots (spec 002 algorithm)
  const allSlots = [];
  for (const contractor of contractors) {
    const slots = await calculateContractorAvailability(
      contractor.id,
      service.duration_minutes,
      addressLat,
      addressLng,
      startDate,
      endDate
    );
    allSlots.push(...slots);
  }

  // 4. Deduplicate and sort by date/time
  return deduplicateAndSortSlots(allSlots);
}
```

```typescript
// Client Component: SlotPicker.tsx
export function SlotPicker({ serviceId, address, onSlotSelected }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: slots, isLoading } = useQuery({
    queryKey: ['available-slots', serviceId, address.lat, address.lng, selectedDate],
    queryFn: () => fetchAvailableSlots(serviceId, address, selectedDate),
    staleTime: 60000, // Cache for 1 minute
  });

  return (
    <div>
      {/* Date navigation */}
      <Calendar
        selected={selectedDate}
        onSelect={setSelectedDate}
        minDate={new Date()}
        maxDate={addDays(new Date(), 30)}
      />

      {/* Time slots for selected date */}
      {isLoading ? (
        <Skeleton count={6} />
      ) : (
        <TimeSlotGrid
          slots={slots}
          onSelect={onSlotSelected}
        />
      )}
    </div>
  );
}
```

### Pre-Payment Availability Verification

```typescript
// Before capturing payment, verify slot still available
export async function verifySlotAvailability(
  slotId: string,
  contractorId: number,
  scheduledTime: string
): Promise<boolean> {
  const { data: conflicts } = await supabase
    .from('appointment_bookings')
    .select('id')
    .eq('contractor_id', contractorId)
    .gte('scheduled_start', scheduledTime)
    .lt('scheduled_start', addMinutes(scheduledTime, 60))
    .in('status', ['confirmed', 'in_progress']);

  return conflicts.length === 0;
}
```

---

## 3. Contractor Assignment & Selection (FR-014 to FR-016)

### Context
System must automatically assign the best contractor for a slot:
- Based on proximity, specialties, workload, ratings
- Client can optionally view and select alternative contractors
- Smart algorithm balances contractor workload

### Decision: **Weighted Scoring Algorithm + Optional Client Override**

### Rationale
**Why Weighted Scoring:**
- Transparent and debuggable
- Easy to adjust weights based on business priorities
- Balances multiple factors (distance, ratings, availability)
- Can be optimized incrementally

**Why Not Machine Learning:**
- MVP doesn't have enough data to train model
- Weighted algorithm is sufficient and explainable
- Can evolve to ML later when data accumulates

### Implementation Pattern

```typescript
// utils/contractor-assignment.ts
interface ContractorScore {
  contractorId: number;
  score: number;
  factors: {
    distance: number;
    rating: number;
    completedBookings: number;
    workloadBalance: number;
    specialtyMatch: number;
  };
}

export async function assignBestContractor(
  serviceId: number,
  addressLat: number,
  addressLng: number,
  scheduledTime: string
): Promise<number> {
  // 1. Get all contractors available for this slot
  const availableContractors = await getAvailableContractors(
    serviceId,
    scheduledTime
  );

  // 2. Score each contractor
  const scores: ContractorScore[] = await Promise.all(
    availableContractors.map(async (contractor) => {
      const distance = calculateDistance(
        addressLat,
        addressLng,
        contractor.lat,
        contractor.lng
      );

      const workload = await getContractorWorkload(contractor.id, scheduledTime);
      const specialtyMatch = hasSpecialty(contractor, serviceId);

      // Weighted scoring
      const score =
        (1 / (distance + 1)) * 0.4 + // Closer is better
        contractor.rating * 0.3 + // Higher rating is better
        (100 - workload) * 0.2 + // Lower workload is better
        (specialtyMatch ? 20 : 0) * 0.1; // Specialty match bonus

      return {
        contractorId: contractor.id,
        score,
        factors: {
          distance,
          rating: contractor.rating,
          completedBookings: contractor.completed_bookings_count,
          workloadBalance: 100 - workload,
          specialtyMatch: specialtyMatch ? 1 : 0,
        },
      };
    })
  );

  // 3. Return contractor with highest score
  const bestContractor = scores.sort((a, b) => b.score - a.score)[0];
  return bestContractor.contractorId;
}
```

```typescript
// Component: ContractorAssignment.tsx
export function ContractorAssignment({ assignedContractorId, slot, onContractorChange }) {
  const { data: assignedContractor } = useQuery({
    queryKey: ['contractor', assignedContractorId],
    queryFn: () => fetchContractor(assignedContractorId),
  });

  const { data: alternatives } = useQuery({
    queryKey: ['alternative-contractors', slot],
    queryFn: () => fetchAlternativeContractors(slot),
    enabled: showAlternatives,
  });

  return (
    <div>
      {/* Assigned contractor card */}
      <ContractorCard contractor={assignedContractor} isAssigned />

      {/* Show alternatives button */}
      <Button onClick={() => setShowAlternatives(true)}>
        Voir d'autres prestataires disponibles
      </Button>

      {/* Alternative contractors */}
      {showAlternatives && (
        <div>
          {alternatives?.map((contractor) => (
            <ContractorCard
              key={contractor.id}
              contractor={contractor}
              onSelect={() => onContractorChange(contractor.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 4. Promo Codes & Gift Cards (FR-019 to FR-022)

### Context
Clients can apply:
- Promo codes (percentage or fixed discount, conditions)
- Gift cards (deduct from balance)
- Order of application: promo first, then gift card
- Validation rules (minimum purchase, expiration, usage limits)

### Decision: **Database-Backed Validation + Edge Function for Complex Logic**

### Alternatives Considered

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Client-Side Only** | Fast feedback | Insecure, easy to manipulate | ❌ |
| **Edge Function Only** | Secure, flexible | Network latency on every check | ✅ PARTIALLY |
| **Database Rules + Function** | Balance of speed and security | - | ✅ **CHOSEN** |

### Rationale
- **Security:** Critical to prevent discount manipulation
- **Flexibility:** Promo code rules change frequently
- **Auditability:** All discount applications logged
- **User Experience:** Client-side pre-validation for UX, server-side for truth

### Implementation Pattern

```sql
-- Table: promo_codes
CREATE TABLE promo_codes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL,

  -- Conditions
  minimum_purchase_amount DECIMAL(10, 2),
  maximum_discount_amount DECIMAL(10, 2),
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  -- Usage limits
  usage_limit INT, -- NULL = unlimited
  usage_count INT DEFAULT 0,
  usage_limit_per_user INT DEFAULT 1,

  -- Applicability
  service_ids BIGINT[], -- NULL = all services
  first_booking_only BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE promo_codes IS 'Codes promotionnels avec conditions et limites d''utilisation';
COMMENT ON COLUMN promo_codes.discount_type IS 'Type de réduction: percentage (ex: 10%) ou fixed_amount (ex: 5€)';
COMMENT ON COLUMN promo_codes.minimum_purchase_amount IS 'Montant minimum d''achat pour activer le code (NULL = pas de minimum)';
COMMENT ON COLUMN promo_codes.usage_limit IS 'Nombre total d''utilisations autorisées (NULL = illimité)';
COMMENT ON COLUMN promo_codes.usage_limit_per_user IS 'Nombre d''utilisations par client (défaut: 1)';
```

```sql
-- Table: gift_cards
CREATE TABLE gift_cards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code VARCHAR(50) UNIQUE NOT NULL,
  initial_balance DECIMAL(10, 2) NOT NULL,
  current_balance DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Validity
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  -- Ownership
  purchased_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id), -- Can be gifted

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE gift_cards IS 'Cartes cadeaux avec solde utilisable sur la plateforme';
COMMENT ON COLUMN gift_cards.current_balance IS 'Solde restant après utilisation partielle';
COMMENT ON COLUMN gift_cards.assigned_to IS 'Utilisateur à qui la carte est destinée (peut être différent de l''acheteur)';
```

```typescript
// Edge Function: validate-promo-code.ts
export async function validatePromoCode(
  code: string,
  userId: string,
  cartTotal: number,
  serviceIds: number[]
): Promise<{ valid: boolean; discount: number; message?: string }> {
  // 1. Check if code exists and is active
  const { data: promo, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !promo) {
    return { valid: false, discount: 0, message: 'Code promo invalide' };
  }

  // 2. Check validity dates
  const now = new Date();
  if (promo.valid_until && new Date(promo.valid_until) < now) {
    return { valid: false, discount: 0, message: 'Ce code promo a expiré' };
  }

  // 3. Check minimum purchase amount
  if (promo.minimum_purchase_amount && cartTotal < promo.minimum_purchase_amount) {
    const remaining = promo.minimum_purchase_amount - cartTotal;
    return {
      valid: false,
      discount: 0,
      message: `Il manque ${remaining.toFixed(2)}€ pour activer ce code promo`,
    };
  }

  // 4. Check usage limits
  if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
    return { valid: false, discount: 0, message: 'Ce code promo a atteint sa limite d\'utilisation' };
  }

  // 5. Check per-user limit
  const { count: userUsageCount } = await supabase
    .from('promo_code_usage')
    .select('*', { count: 'exact', head: true })
    .eq('promo_code_id', promo.id)
    .eq('user_id', userId);

  if (promo.usage_limit_per_user && userUsageCount >= promo.usage_limit_per_user) {
    return { valid: false, discount: 0, message: 'Vous avez déjà utilisé ce code promo' };
  }

  // 6. Check service applicability
  if (promo.service_ids && promo.service_ids.length > 0) {
    const hasApplicableService = serviceIds.some((id) => promo.service_ids.includes(id));
    if (!hasApplicableService) {
      return { valid: false, discount: 0, message: 'Ce code promo ne s\'applique pas à ce service' };
    }
  }

  // 7. Calculate discount
  let discount = 0;
  if (promo.discount_type === 'percentage') {
    discount = (cartTotal * promo.discount_value) / 100;
  } else {
    discount = promo.discount_value;
  }

  // Apply maximum discount limit if set
  if (promo.maximum_discount_amount) {
    discount = Math.min(discount, promo.maximum_discount_amount);
  }

  return { valid: true, discount, message: `Réduction de ${discount.toFixed(2)}€ appliquée` };
}
```

### Order of Application

```typescript
// utils/pricing-calculator.ts
export function calculateFinalPrice(
  basePrice: number,
  promoDiscount: number,
  giftCardBalance: number
): { finalPrice: number; breakdown: PriceBreakdown } {
  // Step 1: Apply promo code discount
  const afterPromo = basePrice - promoDiscount;

  // Step 2: Apply gift card balance
  const giftCardUsed = Math.min(afterPromo, giftCardBalance);
  const finalPrice = Math.max(afterPromo - giftCardUsed, 0);

  return {
    finalPrice,
    breakdown: {
      basePrice,
      promoDiscount,
      subtotalAfterPromo: afterPromo,
      giftCardUsed,
      finalPrice,
    },
  };
}
```

---

## 5. Stripe Payment Pre-Authorization (FR-024 to FR-026)

### Context
Payment flow must:
- Pre-authorize (not capture) amount on client card
- Verify slot availability immediately before payment
- Create booking with status "pending" after pre-auth
- Capture payment later when service confirmed/completed

### Decision: **Stripe PaymentIntent with capture_method: manual**

### Rationale
**Why Pre-Authorization:**
- Guarantees funds without immediate charge
- Allows cancellations with automatic refund
- Standard practice for services rendered later
- Reduces fraud risk (funds held, not captured)

**Why Not Immediate Capture:**
- Service not yet confirmed by contractor
- Client should only be charged when service guaranteed
- Easier refund process if cancelled early

### Implementation Pattern

```typescript
// Edge Function: create-booking-payment.ts
export async function createBookingPayment(
  bookingData: BookingData,
  clientId: string
): Promise<{ paymentIntentId: string; clientSecret: string }> {
  // 1. Final price calculation
  const finalPrice = calculateFinalPrice(
    bookingData.basePrice,
    bookingData.promoDiscount,
    bookingData.giftCardAmount
  );

  // 2. Create Stripe PaymentIntent with manual capture
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(finalPrice * 100), // Convert to cents
    currency: 'eur',
    customer: await getOrCreateStripeCustomer(clientId),
    capture_method: 'manual', // Pre-authorize, don't capture
    metadata: {
      booking_id: bookingData.id,
      service_id: bookingData.serviceId,
      contractor_id: bookingData.contractorId,
      client_id: clientId,
    },
    description: `Réservation: ${bookingData.serviceName}`,
  });

  // 3. Store PaymentIntent ID with booking
  await supabase
    .from('appointment_bookings')
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      payment_status: 'authorized',
    })
    .eq('id', bookingData.id);

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
  };
}
```

```typescript
// Client: Payment form with Stripe Elements
export function PaymentForm({ bookingId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // 1. Verify slot still available (race condition check)
      const { available } = await fetch('/api/verify-slot-availability', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      }).then((r) => r.json());

      if (!available) {
        alert('Désolé, ce créneau vient d\'être réservé. Veuillez en choisir un autre.');
        return;
      }

      // 2. Confirm payment (pre-authorization)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation`,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw error;
      }

      // 3. Booking confirmed, notify user
      if (paymentIntent.status === 'requires_capture') {
        onSuccess(bookingId);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" disabled={isProcessing || !stripe}>
        {isProcessing ? 'Traitement...' : `Payer ${amount.toFixed(2)}€`}
      </Button>
    </form>
  );
}
```

### Payment Capture Flow

```typescript
// Webhook: stripe-webhook.ts
// Capture payment when contractor confirms or service completed
if (event.type === 'payment_intent.requires_action') {
  // Handle additional authentication if needed
}

// Later: Manual capture via Edge Function
export async function captureBookingPayment(bookingId: number) {
  const { data: booking } = await supabase
    .from('appointment_bookings')
    .select('stripe_payment_intent_id')
    .eq('id', bookingId)
    .single();

  // Capture the pre-authorized payment
  await stripe.paymentIntents.capture(booking.stripe_payment_intent_id);

  // Update booking
  await supabase
    .from('appointment_bookings')
    .update({ payment_status: 'captured' })
    .eq('id', bookingId);
}
```

---

## 6. Contractor Slug Booking Flow (FR-029 to FR-043)

### Context
Clients can book directly with a specific contractor via personalized URL:
- Route: `/book/:contractor_slug`
- Display contractor profile, filtered services, availability
- Track analytics (visits, conversions)
- Handle slug changes with 30-day redirects
- Store contractor_id in session (not slug) for continuity

### Decision: **Next.js Dynamic Routes + Session Storage + contractor_slug_analytics Table from Spec 007**

### Rationale
**Why Dynamic Routes:**
- SEO-friendly URLs
- Shareable links for marketing
- Native Next.js support

**Why Session Storage for contractor_id:**
- Prevents issues if contractor changes slug mid-booking
- contractor_id is immutable
- Session expires after 30 minutes of inactivity

**Why Analytics Table (from Spec 007):**
- Track marketing effectiveness
- Calculate conversion rates per contractor
- Identify high-performing referral sources

### Implementation Pattern

```typescript
// app/book/[slug]/page.tsx
export default async function ContractorBookingPage({
  params,
}: {
  params: { slug: string };
}) {
  // 1. Check for slug redirect (from spec 007: contractor_slug_history)
  const redirect = await checkSlugRedirect(params.slug);
  if (redirect) {
    return permanentRedirect(`/book/${redirect.newSlug}`);
  }

  // 2. Get contractor by slug
  const contractor = await getContractorBySlug(params.slug);

  if (!contractor) {
    return notFound(); // 404 page with helpful message
  }

  // 3. Check contractor status
  if (!contractor.is_active || contractor.status === 'suspended') {
    return (
      <ContractorUnavailablePage
        message="Ce prestataire n'est pas disponible actuellement"
      />
    );
  }

  // 4. Track analytics (spec 007: contractor_slug_analytics)
  await trackSlugVisit({
    contractorId: contractor.id,
    slug: params.slug,
    referrer: headers().get('referer'),
    userAgent: headers().get('user-agent'),
  });

  // 5. Get services offered by this contractor (spec 007: contractor_services)
  const services = await getContractorServices(contractor.id);

  // 6. Pre-select service if provided in query string
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get('service');

  return (
    <ContractorBookingFlow
      contractor={contractor}
      services={services}
      preselectedService={preselectedService}
    />
  );
}
```

```typescript
// Component: ContractorBookingFlow.tsx
export function ContractorBookingFlow({ contractor, services, preselectedService }) {
  // Store contractor_id in session (not slug) for stability
  useEffect(() => {
    sessionStorage.setItem('booking_contractor_id', contractor.id.toString());
    sessionStorage.setItem('booking_contractor_slug_locked', 'true');
  }, [contractor.id]);

  const [step, setStep] = useState<'service' | 'address' | 'slot' | 'payment'>('service');

  return (
    <div>
      {/* Contractor profile header */}
      <ContractorProfileHeader
        contractor={contractor}
        rating={contractor.rating}
        completedBookings={contractor.completed_bookings_count}
      />

      {/* Booking flow steps */}
      {step === 'service' && (
        <ServiceSelector
          services={services}
          preselected={preselectedService}
          onSelect={(service) => {
            setSelectedService(service);
            setStep('address');
          }}
        />
      )}

      {step === 'address' && (
        <AddressSelector
          onAddressSelected={(address) => {
            setAddress(address);
            setStep('slot');
          }}
        />
      )}

      {step === 'slot' && (
        <SlotPicker
          serviceId={selectedService.id}
          contractorId={contractor.id} // LOCKED to this contractor
          address={address}
          onSlotSelected={(slot) => {
            setSlot(slot);
            setStep('payment');
          }}
        />
      )}

      {step === 'payment' && (
        <PaymentForm
          booking={bookingData}
          onSuccess={async (bookingId) => {
            // Mark conversion in analytics (spec 007)
            await markSlugConversion(sessionStorage.getItem('session_id'), bookingId);
            router.push('/booking/confirmation');
          }}
        />
      )}
    </div>
  );
}
```

### Slug Redirect Handling

```typescript
// utils/slug-redirect.ts (from spec 007)
export async function checkSlugRedirect(slug: string): Promise<{ newSlug: string } | null> {
  const { data: history } = await supabase
    .from('contractor_slug_history')
    .select('new_slug')
    .eq('old_slug', slug)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single();

  return history ? { newSlug: history.new_slug } : null;
}
```

### Custom 404 for Expired Slugs

```typescript
// app/book/[slug]/not-found.tsx
export default function ContractorNotFound() {
  return (
    <div className="container mx-auto py-12 text-center">
      <h1>Prestataire introuvable</h1>
      <p>
        Ce prestataire a peut-être modifié son lien. Veuillez le contacter directement
        pour obtenir son nouveau lien de réservation.
      </p>
      <Button onClick={() => router.push('/services')}>
        Rechercher d'autres prestataires
      </Button>
    </div>
  );
}
```

---

## Performance Considerations

### Caching Strategy
- **Service Catalog:** Cache for 5 minutes (ISR in Next.js)
- **Available Slots:** Cache for 1 minute (TanStack Query)
- **Contractor Profiles:** Cache for 10 minutes
- **Promo Code Validation:** No cache (always fresh)
- **Address Autocomplete:** Debounce 300ms, cache results

### Database Indexes
```sql
-- Critical indexes for booking flow
CREATE INDEX idx_services_active ON services(is_active, category);
CREATE INDEX idx_contractor_services_active ON contractor_services(contractor_id, is_active);
CREATE INDEX idx_client_addresses_default ON client_addresses(client_id, is_default);
CREATE INDEX idx_promo_codes_code ON promo_codes(UPPER(code)) WHERE is_active = true;
CREATE INDEX idx_gift_cards_code ON gift_cards(UPPER(code)) WHERE is_active = true;
CREATE INDEX idx_bookings_slot_check ON appointment_bookings(contractor_id, scheduled_start, status);
```

---

## Security Considerations

### RLS Policies
All booking-related tables must enforce row-level security:
- Clients can only read their own bookings
- Promo code usage logged per user
- Gift card balance updates audited
- Payment intents linked to authenticated users

### Input Validation
- **Server-Side:** All Edge Functions validate with Zod schemas
- **Client-Side:** React Hook Form + Zod for UX
- **SQL Injection:** Use parameterized queries via Supabase SDK
- **XSS Prevention:** Sanitize all user inputs

### Rate Limiting
- Slot availability check: Max 20 requests/minute per user
- Promo code validation: Max 10 requests/minute per user
- Payment attempts: Max 3 failures per booking

---

## Monitoring & Observability

### Key Metrics to Track
1. **Booking Funnel Conversion Rate:**
   - Service selection → Address → Slot → Payment → Confirmed
2. **Average Booking Time:** Target <3 minutes
3. **Slot Load Time:** Target <3 seconds
4. **Payment Success Rate:** Target >95%
5. **Promo Code Usage Rate:** Track effectiveness
6. **Slot Conflict Rate:** % of slots taken during checkout

---

## Summary of Key Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| **Address Autocomplete** | Google Places API | Industry standard, excellent UX, accurate |
| **Availability Calculation** | Server-Side Edge Function | Security, consistency, single source of truth |
| **Contractor Assignment** | Weighted Scoring Algorithm | Transparent, debuggable, balances multiple factors |
| **Promo Codes** | Database + Edge Function Validation | Secure, flexible, auditable |
| **Payment** | Stripe PaymentIntent (manual capture) | Pre-auth without immediate charge, refund-friendly |
| **Contractor Slug Booking** | Dynamic Routes + Session Storage | SEO-friendly, stable during slug changes |
| **Analytics** | contractor_slug_analytics from Spec 007 | Track marketing effectiveness, conversions |

---

**Last Updated:** 2025-11-07
**Reviewed By:** Technical Lead
**Status:** Approved for Implementation
