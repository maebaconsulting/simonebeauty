# Technical Research & Decisions
# Feature 007: Interface Prestataire Complète

**Date:** 2025-11-07
**Status:** Approved
**Branch:** `007-contractor-interface`

---

## 1. Multi-step Form Implementation (FR-001)

### Context
The contractor application form requires 5 distinct steps with:
- Progressive validation at each step
- Navigation with visual progress indicator
- Real-time Zod schema validation
- Optional file uploads at final step
- Dynamic specialty selection based on profession

### Decision: **React Hook Form + Zod + Custom State Machine**

### Rationale
**Why React Hook Form:**
- Native integration with Zod for schema validation
- Excellent performance (uncontrolled components by default)
- Built-in `mode: "onChange"` for real-time validation
- Form state persistence between steps
- Minimal re-renders

**Why Not Formik:**
- Heavier bundle size
- More re-renders due to controlled components
- Less modern TypeScript support
- Community momentum shifting to React Hook Form

**Why Custom State Machine over library:**
- Simple linear flow (step 1 → 2 → 3 → 4 → 5)
- No complex branching logic
- Avoid dependency on XState for basic use case
- Total control over step transitions

### Implementation Pattern

```typescript
// Form state machine
type FormStep = 1 | 2 | 3 | 4 | 5;
type FormData = {
  step1: PersonalInfoSchema;
  step2: ProfessionalProfileSchema;
  step3: AvailabilitySchema;
  step4: MotivationSchema;
  step5: DocumentsSchema;
};

// Hook structure
const useMultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});

  const form = useForm({
    mode: "onChange", // Real-time validation
    resolver: zodResolver(getCurrentStepSchema(currentStep)),
    defaultValues: formData[`step${currentStep}`],
  });

  const nextStep = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setFormData(prev => ({
        ...prev,
        [`step${currentStep}`]: form.getValues(),
      }));
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  return { form, currentStep, nextStep, prevStep, formData };
};
```

### Progress Indicator
- Circular pills with numbers (1-5)
- Connecting lines between pills
- Active state: filled primary color
- Completed: checkmark icon
- Future steps: gray outline

### Specialty Dynamic Loading
```typescript
// FR-003: Dynamic specialties
const specialtiesByProfession = {
  massage: ["Suédois", "Deep Tissue", "Thaï", "Californien"],
  beauty: ["Maquillage", "Manucure", "Pédicure", "Épilation"],
  hair: ["Coupe", "Coloration", "Brushing", "Extensions"],
  other: [], // Free text input
};

// Watch profession field and update specialties
const profession = form.watch("profession");
const availableSpecialties = specialtiesByProfession[profession] || [];
```

---

## 2. File Upload Strategy (FR-005-006)

### Context
Contractor applications require optional document uploads:
- CV (PDF, DOC, DOCX)
- Certifications (PDF, DOC, DOCX)
- Portfolio images (JPG, PNG, WEBP)
- Max 5MB per file
- Upload to Supabase Storage bucket `job-applications`
- Organized in subfolders: `cv/`, `certifications/`, `portfolio/`

### Decision: **Direct Upload to Supabase Storage with Client-Side Validation**

### Alternatives Considered

| Pattern | Pros | Cons | Decision |
|---------|------|------|----------|
| **Direct Upload** | Simple, fast, no server proxy | Requires CORS config, client handles errors | **✅ CHOSEN** |
| **Presigned URLs** | More secure, server controls access | Extra API call, more complex flow | ❌ Overkill for authenticated users |
| **Edge Function Proxy** | Full control, virus scanning | Slower, higher bandwidth costs | ❌ Not needed for MVP |
| **Chunked Upload** | Large file support (>50MB) | Complex implementation | ❌ Files are <5MB |

### Rationale
- **Performance:** Direct upload eliminates server roundtrip
- **Simplicity:** Supabase Storage SDK handles upload logic
- **Cost:** No Edge Function bandwidth usage
- **Security:** RLS policies protect buckets, authenticated users only

### Implementation Pattern

```typescript
// Client-side upload utility
const uploadFile = async (
  file: File,
  category: "cv" | "certifications" | "portfolio"
): Promise<string> => {
  // 1. Client-side validation
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = {
    cv: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    certifications: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    portfolio: ["image/jpeg", "image/png", "image/webp"],
  };

  if (file.size > MAX_SIZE) throw new Error("Fichier trop volumineux (max 5MB)");
  if (!ALLOWED_TYPES[category].includes(file.type)) throw new Error("Type de fichier non autorisé");

  // 2. Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${category}/${timestamp}_${sanitizedName}`;

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("job-applications")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return data.path;
};
```

### Storage Bucket Configuration
```sql
-- Supabase Storage bucket setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-applications', 'job-applications', false);

-- RLS Policy: Only authenticated users can upload
CREATE POLICY "Authenticated users can upload job application files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-applications');

-- RLS Policy: Admins can view all files
CREATE POLICY "Admins can view all job application files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-applications'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### File Validation Schema
```typescript
const DocumentsSchema = z.object({
  cv: z.custom<File>().optional().refine(
    (file) => !file || file.size <= 5 * 1024 * 1024,
    "Le CV doit faire moins de 5MB"
  ),
  certifications: z.array(z.custom<File>()).optional(),
  portfolio: z.array(z.custom<File>()).max(10, "Maximum 10 images").optional(),
});
```

---

## 3. Stripe Connect Onboarding (FR-034-036)

### Context
Contractors must complete Stripe Connect onboarding to receive payments:
- Bank account details
- Identity verification (KYC)
- Business information
- Tax details

### Decision: **Stripe Connect Express Accounts**

### Account Type Comparison

| Type | Pros | Cons | Decision |
|------|------|------|----------|
| **Express** | Stripe handles UI/UX, fast onboarding, compliance included | Less branding control | **✅ CHOSEN** |
| **Standard** | Full contractor control, direct Stripe dashboard access | Slower onboarding, more support burden | ❌ Too complex |
| **Custom** | Complete white-label experience | Must build all UI, handle compliance | ❌ MVP overkill |

### Rationale
- **Speed to Market:** Express onboarding UI is production-ready
- **Compliance:** Stripe handles KYC/AML regulations
- **User Experience:** Trusted Stripe UI reduces friction
- **Support:** Stripe handles verification issues
- **Cost:** No additional implementation time

### Onboarding Flow Pattern

```typescript
// Edge Function: create-stripe-connect-account.ts
export async function createConnectAccount(contractorId: string) {
  // 1. Create Stripe Connect account
  const account = await stripe.accounts.create({
    type: "express",
    country: "FR",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      contractor_id: contractorId,
    },
  });

  // 2. Store account ID
  await supabase
    .from("contractors")
    .update({
      stripe_connect_account_id: account.id,
      stripe_onboarding_status: "pending",
    })
    .eq("id", contractorId);

  // 3. Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${FRONTEND_URL}/contractor/stripe-refresh`,
    return_url: `${FRONTEND_URL}/contractor/stripe-return`,
    type: "account_onboarding",
  });

  return { accountLinkUrl: accountLink.url };
}
```

### Account Verification Handling

```typescript
// Webhook handler: stripe-webhook.ts
// Listen for account.updated events
if (event.type === "account.updated") {
  const account = event.data.object as Stripe.Account;

  // Check if fully verified
  const isVerified =
    account.details_submitted &&
    account.charges_enabled &&
    account.payouts_enabled;

  // Update contractor status
  await supabase
    .from("contractors")
    .update({
      stripe_onboarding_status: isVerified ? "completed" : "pending",
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
    })
    .eq("stripe_connect_account_id", account.id);
}
```

### Blocking Logic (FR-036)
```typescript
// Before accepting booking
const { data: contractor } = await supabase
  .from("contractors")
  .select("stripe_onboarding_status, stripe_charges_enabled")
  .eq("id", contractorId)
  .single();

if (
  contractor.stripe_onboarding_status !== "completed" ||
  !contractor.stripe_charges_enabled
) {
  throw new Error(
    "Vous devez finaliser votre compte Stripe Connect avant d'accepter des réservations"
  );
}
```

---

## 4. Slug Generation & Validation (FR-046-065)

### Context
Each contractor needs a unique URL slug for direct bookings:
- Format: `simone.paris/book/[slug]`
- Auto-generated on account creation
- Modifiable by contractor (max 3 times/year)
- Real-time uniqueness validation
- Must handle conflicts, forbidden words, normalization
- Track analytics (visits, conversions)
- Redirect old slugs for 30 days

### Decision: **Database-Level Uniqueness + Edge Function for Real-Time Validation + PostgreSQL Full-Text Search for Analytics**

### Slug Generation Algorithm

```typescript
// utils/slug-generator.ts
function generateSlug(firstName: string, lastName: string): string {
  // 1. Combine names
  const combined = `${firstName} ${lastName}`.toLowerCase();

  // 2. Normalize: remove accents, special chars
  const normalized = combined
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Keep only alphanumeric, spaces, hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens

  // 3. Validate length
  if (normalized.length < 3) {
    // Handle edge case: very short names
    return `${normalized}-contractor`;
  }

  if (normalized.length > 50) {
    return normalized.substring(0, 50);
  }

  return normalized;
}

// Handle conflicts with incremental suffix
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { count } = await supabase
      .from("contractors")
      .select("*", { count: "exact", head: true })
      .eq("slug", slug);

    if (count === 0) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}
```

### Real-Time Uniqueness Checking Strategy

**Option A: Database Query on Every Keystroke** ❌
- High database load
- Potential rate limiting issues
- Not scalable

**Option B: Debounced Edge Function** ✅ **CHOSEN**
- Wait 500ms after user stops typing
- Single API call per check
- Return: `{ available: boolean, suggestion?: string }`

**Option C: Client-Side Cache + Bloom Filter** ❌
- Complex implementation
- Stale data risk
- MVP overkill

```typescript
// Hook: useSlugValidation.ts
import { useDebouncedCallback } from "use-debounce";

const useSlugValidation = () => {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const checkSlug = useDebouncedCallback(async (slug: string) => {
    if (slug.length < 3) return;

    setStatus("checking");

    const { data, error } = await supabase.functions.invoke("check-slug-availability", {
      body: { slug },
    });

    if (error) {
      setStatus("idle");
      return;
    }

    setStatus(data.available ? "available" : "taken");
  }, 500); // Wait 500ms after user stops typing

  return { status, checkSlug };
};
```

### Forbidden Words List
Store in `platform_config` table as JSONB for easy admin updates:

```sql
CREATE TABLE platform_config (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO platform_config (key, value) VALUES (
  'forbidden_slugs',
  '["admin", "api", "www", "book", "search", "login", "register", "support", "help", "contact", "about", "dashboard", "settings", "account", "profile", "bookings", "payments", "test", "dev", "staging", "prod", "stripe", "supabase", "simone", "contractor", "client", "user", "public", "private", "secret", "config", "database", "cache", "upload", "download", "delete", "create", "update", "null", "undefined", "true", "false"]'::JSONB
);
```

### Analytics Tracking Approach

**Decision: Edge Function + Lightweight Event Storage**

```typescript
// Edge Function: track-slug-visit.ts
export async function trackSlugVisit(slug: string, request: Request) {
  const headers = request.headers;
  const userAgent = headers.get("user-agent");
  const referer = headers.get("referer");
  const ipAddress = headers.get("x-forwarded-for") || "unknown";

  // Generate session ID (stored in cookie, expires in 30min)
  const sessionId = getOrCreateSessionId(request);

  // Insert analytics event
  await supabase.from("contractor_slug_analytics").insert({
    contractor_id: (await getContractorBySlug(slug)).id,
    slug_used: slug,
    visited_at: new Date().toISOString(),
    referrer: referer,
    user_agent: userAgent,
    ip_address: ipAddress,
    session_id: sessionId,
    converted: false, // Will be updated when booking confirmed
  });

  return { tracked: true };
}

// Update conversion when booking confirmed
export async function markSlugConversion(sessionId: string, bookingId: string) {
  await supabase
    .from("contractor_slug_analytics")
    .update({
      converted: true,
      booking_id: bookingId,
      conversion_timestamp: new Date().toISOString(),
    })
    .eq("session_id", sessionId)
    .is("booking_id", null); // Only update if not already converted
}
```

### Slug History & Redirections

```sql
-- Store old slugs for 30-day redirection
CREATE TABLE slug_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT REFERENCES contractors(id) ON DELETE CASCADE,
  old_slug VARCHAR(50) NOT NULL,
  new_slug VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  is_active BOOLEAN DEFAULT true
);

-- Unique index to prevent duplicate old slugs
CREATE UNIQUE INDEX idx_slug_history_old_slug_active
ON slug_history(old_slug)
WHERE is_active = true;

-- Cleanup job (run daily via cron)
DELETE FROM slug_history
WHERE expires_at < NOW();
```

**Redirect Logic:**
```typescript
// Middleware: slug-redirect.ts
export async function handleSlugRedirect(slug: string) {
  // 1. Check if slug is current
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (contractor) {
    // Current slug, proceed normally
    return { redirect: null, contractorId: contractor.id };
  }

  // 2. Check slug history for redirect
  const { data: history } = await supabase
    .from("slug_history")
    .select("new_slug, contractor_id")
    .eq("old_slug", slug)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (history) {
    // Redirect to new slug (HTTP 301)
    return {
      redirect: `/book/${history.new_slug}`,
      status: 301
    };
  }

  // 3. Slug not found (expired or never existed)
  return { redirect: "/404-slug-expired", status: 404 };
}
```

---

## 5. Dashboard Financial Calculations (FR-030-033e)

### Context
Contractor dashboard must display:
- Revenue from services (after commission + Stripe fees)
- Tips received (after Stripe fees)
- Total net earnings
- Transaction history with itemized breakdown
- Export to CSV
- Differentiate between contractors who pay Stripe fees vs platform

### Decision: **Database Views + Edge Function for Complex Calculations**

### Alternatives Considered

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Client-Side Calculation** | Simple, no server load | Inconsistent, security risk, can't audit | ❌ |
| **Edge Function Only** | Flexible, real-time | High compute cost, slower | ❌ |
| **Database Views** | Fast, consistent, cacheable | Less flexible for custom queries | ✅ PARTIALLY |
| **Materialized Views + Cron** | Very fast reads, pre-computed | Stale data, complex refresh logic | ❌ Overkill for MVP |
| **Hybrid: Views + Edge Function** | Balance speed and flexibility | - | ✅ **CHOSEN** |

### Rationale
- **Database Views:** Pre-compute standard metrics (today, this week, this month)
- **Edge Functions:** Handle complex queries (date ranges, filtering, exports)
- **Performance:** Views are indexed, Edge Functions use views as base
- **Consistency:** Single source of truth for financial logic

### Implementation Pattern

```sql
-- View: contractor_financial_summary
CREATE VIEW contractor_financial_summary AS
SELECT
  c.id AS contractor_id,

  -- Service Revenue (current month)
  COALESCE(SUM(
    CASE
      WHEN b.status = 'completed' AND DATE_TRUNC('month', b.completed_at) = DATE_TRUNC('month', NOW())
      THEN b.service_amount - (b.service_amount * c.commission_rate / 100) - (
        CASE
          WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service
          ELSE 0
        END
      )
      ELSE 0
    END
  ), 0) AS revenue_service_current_month,

  -- Tips (current month)
  COALESCE(SUM(
    CASE
      WHEN b.status = 'completed' AND DATE_TRUNC('month', b.completed_at) = DATE_TRUNC('month', NOW()) AND b.tip_amount > 0
      THEN b.tip_amount - b.stripe_fee_tip
      ELSE 0
    END
  ), 0) AS revenue_tips_current_month,

  -- Total Net (current month)
  COALESCE(SUM(
    CASE
      WHEN b.status = 'completed' AND DATE_TRUNC('month', b.completed_at) = DATE_TRUNC('month', NOW())
      THEN
        (b.service_amount - (b.service_amount * c.commission_rate / 100) -
          CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END) +
        (CASE WHEN b.tip_amount > 0 THEN b.tip_amount - b.stripe_fee_tip ELSE 0 END)
      ELSE 0
    END
  ), 0) AS total_net_current_month,

  -- Number of completed bookings
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) AS total_completed_bookings,

  -- Number of bookings with tips
  COUNT(CASE WHEN b.status = 'completed' AND b.tip_amount > 0 THEN 1 END) AS total_bookings_with_tips,

  -- Average tip amount
  AVG(CASE WHEN b.tip_amount > 0 THEN b.tip_amount ELSE NULL END) AS average_tip_amount,

  -- Tip rate percentage
  CASE
    WHEN COUNT(CASE WHEN b.status = 'completed' THEN 1 END) > 0
    THEN (COUNT(CASE WHEN b.tip_amount > 0 THEN 1 END)::DECIMAL / COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::DECIMAL) * 100
    ELSE 0
  END AS tip_rate_percentage

FROM contractors c
LEFT JOIN appointment_bookings b ON b.contractor_id = c.id
GROUP BY c.id, c.commission_rate, c.contractor_pays_stripe_fees;

-- Grant access
GRANT SELECT ON contractor_financial_summary TO authenticated;

-- RLS Policy: Contractors can only see their own data
CREATE POLICY "Contractors can view own financial summary"
ON contractor_financial_summary FOR SELECT
TO authenticated
USING (contractor_id = (SELECT id FROM contractors WHERE profile_uuid = auth.uid()));
```

### Transaction Detail Breakdown

```sql
-- View: contractor_transaction_details
CREATE VIEW contractor_transaction_details AS
SELECT
  b.id AS booking_id,
  b.contractor_id,
  b.completed_at,

  -- Service breakdown
  b.service_amount AS service_gross,
  (b.service_amount * c.commission_rate / 100) AS service_commission,
  CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END AS service_stripe_fee,
  (b.service_amount - (b.service_amount * c.commission_rate / 100) -
    CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END) AS service_net,

  -- Tip breakdown
  b.tip_amount AS tip_gross,
  b.stripe_fee_tip AS tip_stripe_fee,
  (b.tip_amount - b.stripe_fee_tip) AS tip_net,

  -- Total
  (b.service_amount - (b.service_amount * c.commission_rate / 100) -
    CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END) +
  (b.tip_amount - b.stripe_fee_tip) AS total_net,

  -- Metadata
  c.commission_rate,
  c.contractor_pays_stripe_fees,
  b.client_name,
  b.service_name

FROM appointment_bookings b
JOIN contractors c ON c.id = b.contractor_id
WHERE b.status = 'completed'
ORDER BY b.completed_at DESC;
```

### Tip Processing Flow

```typescript
// Edge Function: process-tip.ts
export async function processTip(bookingId: string, tipAmount: number) {
  // 1. Calculate Stripe fee (tip fees ALWAYS deducted from tip)
  const stripeFeePercentage = 1.4; // 1.4% for European cards
  const stripeFeeFixed = 0.25; // €0.25 fixed fee
  const stripeFee = (tipAmount * stripeFeePercentage / 100) + stripeFeeFixed;
  const tipNet = tipAmount - stripeFee;

  // 2. Create Stripe transfer to contractor
  const booking = await getBooking(bookingId);
  const contractor = await getContractor(booking.contractor_id);

  const transfer = await stripe.transfers.create({
    amount: Math.round(tipNet * 100), // Convert to cents
    currency: "eur",
    destination: contractor.stripe_connect_account_id,
    transfer_group: `booking_${bookingId}`,
    metadata: {
      booking_id: bookingId,
      type: "tip",
      gross_amount: tipAmount,
      stripe_fee: stripeFee,
      net_amount: tipNet,
    },
  });

  // 3. Update booking record
  await supabase
    .from("appointment_bookings")
    .update({
      tip_amount: tipAmount,
      stripe_fee_tip: stripeFee,
      tip_transfer_id: transfer.id,
      tip_processed_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  // 4. Notify contractor
  await sendNotification(contractor.id, {
    type: "tip_received",
    title: "Pourboire reçu",
    message: `Vous avez reçu un pourboire de ${tipAmount.toFixed(2)}€`,
    data: { booking_id: bookingId, net_amount: tipNet },
  });

  return { success: true, netAmount: tipNet };
}
```

### CSV Export Implementation

```typescript
// Edge Function: export-financial-history.ts
export async function exportFinancialHistory(
  contractorId: string,
  startDate: string,
  endDate: string
): Promise<Blob> {
  // Query transaction details
  const { data: transactions } = await supabase
    .from("contractor_transaction_details")
    .select("*")
    .eq("contractor_id", contractorId)
    .gte("completed_at", startDate)
    .lte("completed_at", endDate)
    .order("completed_at", { ascending: false });

  // Generate CSV
  const headers = [
    "Date",
    "Client",
    "Service",
    "Montant Service Brut",
    "Commission",
    "Frais Stripe Service",
    "Net Service",
    "Pourboire",
    "Frais Stripe Tip",
    "Net Tip",
    "Total Net",
  ];

  const rows = transactions.map(t => [
    new Date(t.completed_at).toLocaleDateString("fr-FR"),
    t.client_name,
    t.service_name,
    `${t.service_gross.toFixed(2)}€`,
    `${t.service_commission.toFixed(2)}€`,
    `${t.service_stripe_fee.toFixed(2)}€`,
    `${t.service_net.toFixed(2)}€`,
    t.tip_gross > 0 ? `${t.tip_gross.toFixed(2)}€` : "-",
    t.tip_gross > 0 ? `${t.tip_stripe_fee.toFixed(2)}€` : "-",
    t.tip_gross > 0 ? `${t.tip_net.toFixed(2)}€` : "-",
    `${t.total_net.toFixed(2)}€`,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.join(","))
    .join("\n");

  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
```

---

## Performance Considerations

### Caching Strategy
- **Database Views:** Automatically cached by PostgreSQL query planner
- **Edge Function Results:** Cache GET requests with 60-second TTL
- **Static Slug List:** Consider maintaining in-memory cache for forbidden words
- **Analytics Queries:** Use database indexes on `contractor_id`, `visited_at`, `converted`

### Database Indexes
```sql
-- Critical indexes for contractor interface
CREATE INDEX idx_contractors_slug ON contractors(slug);
CREATE INDEX idx_contractors_stripe_account ON contractors(stripe_connect_account_id);
CREATE INDEX idx_bookings_contractor_status ON appointment_bookings(contractor_id, status);
CREATE INDEX idx_bookings_completed_at ON appointment_bookings(completed_at) WHERE status = 'completed';
CREATE INDEX idx_slug_analytics_contractor ON contractor_slug_analytics(contractor_id, visited_at);
CREATE INDEX idx_slug_analytics_session ON contractor_slug_analytics(session_id) WHERE converted = false;
CREATE INDEX idx_slug_history_old_slug ON slug_history(old_slug) WHERE is_active = true;
```

---

## Security Considerations

### RLS Policies
All contractor data must enforce row-level security:
- Contractors can only read/write their own data
- Admins have full access
- File uploads restricted to authenticated users
- Slug analytics data isolated per contractor

### Data Validation
- **Server-Side:** All Edge Functions validate input with Zod
- **Client-Side:** React Hook Form + Zod for UX
- **Database:** CHECK constraints on critical columns

### Rate Limiting
- Slug validation: Max 10 requests per minute per user
- File uploads: Max 5 files per minute per user
- Financial exports: Max 1 request per minute per user

---

## Monitoring & Observability

### Key Metrics to Track
1. **Form Completion Rate:** % of contractors who complete step 5
2. **Stripe Onboarding Time:** Median time from account creation to verified
3. **Slug Change Frequency:** Average changes per contractor per year
4. **Tip Rate:** % of bookings that receive tips
5. **Financial Dashboard Load Time:** P95 response time
6. **File Upload Success Rate:** % of uploads without errors

### Error Logging
- All Edge Functions log to Supabase Edge Function Logs
- Client-side errors captured with error boundaries
- Stripe webhook failures retry with exponential backoff

---

## Summary of Key Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| **Multi-step Form** | React Hook Form + Zod + Custom State Machine | Performance, TypeScript support, simple flow |
| **File Upload** | Direct Upload to Supabase Storage | Speed, simplicity, cost efficiency |
| **Stripe Connect** | Express Accounts | Fast onboarding, Stripe-managed compliance |
| **Slug Validation** | Debounced Edge Function + Database Uniqueness | Balance between UX and performance |
| **Analytics** | Lightweight Event Storage + Database Views | Sufficient for MVP, scalable later |
| **Financial Calculations** | Database Views + Edge Functions | Fast reads, flexible queries, consistent logic |
| **Tip Processing** | Always deduct Stripe fees from tip | Simple, transparent, fair |

---

**Last Updated:** 2025-11-07
**Reviewed By:** Technical Lead
**Status:** Approved for Implementation
