import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBookingPaymentIntent, getOrCreateStripeCustomer, cancelPaymentIntent } from '@/lib/stripe/payment';
import { stripe } from '@/lib/stripe/config';
import { sendBookingConfirmationEmail } from '@/lib/email/send-booking-confirmation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/create
 * Create a new booking request with Stripe pre-authorization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get client profile
    console.log('[Bookings API] Fetching profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Bookings API] Profile query error:', profileError);
    }

    if (!profile) {
      console.error('[Bookings API] Profile not found for user:', user.id);
      return NextResponse.json(
        { error: 'Profile not found', details: profileError?.message },
        { status: 404 }
      );
    }

    console.log('[Bookings API] Profile found:', profile.first_name, profile.last_name);
    console.log('[Bookings API] User email:', user.email);

    // Parse request body
    const body = await request.json();
    const {
      service_id,
      address_id,
      scheduled_datetime,
      booking_timezone,
      contractor_id, // Optional: Pre-selected contractor from booking flow
      payment_method_id, // Optional: Stripe payment method ID for immediate authorization
      payment_intent_id, // Optional: Existing payment intent from confirmation page
      // Optional: Promo/gift card details for "no-payment-required" case
      promo_code_id,
      promo_discount,
      gift_card_id,
      gift_card_code,
      gift_card_amount,
    } = body;

    // Validate required fields
    if (!service_id || !address_id || !scheduled_datetime || !booking_timezone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[Bookings API] Creating booking with contractor:', contractor_id || 'none (open request)', '- Requires manual confirmation');

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('name, base_duration_minutes, base_price')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get address details
    const { data: address, error: addressError } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('id', address_id)
      .eq('client_id', user.id)
      .single();

    if (addressError || !address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomer;
    try {
      stripeCustomer = await getOrCreateStripeCustomer({
        userId: user.id,
        email: user.email || '',
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        phone: profile.phone || undefined,
      });
      console.log('✅ Stripe customer obtained:', stripeCustomer.id);
    } catch (customerError) {
      console.error('❌ Failed to get/create Stripe customer:', customerError);
      return NextResponse.json(
        {
          error: 'Failed to process payment',
          details: customerError instanceof Error ? customerError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Handle Stripe payment intent
    let paymentIntent;
    let promoCodeId: number | null = null;
    let promoDiscount: number = 0;
    let giftCardId: number | null = null;
    let giftCardCode: string | null = null;
    let giftCardAmount: number = 0;

    try {
      if (payment_intent_id && payment_intent_id !== 'no-payment-required') {
        // Use existing payment intent from confirmation page
        console.log('[Bookings API] Retrieving existing PaymentIntent:', payment_intent_id);
        paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

        // Extract promo/gift card details from metadata
        if (paymentIntent.metadata.promo_discount) {
          promoDiscount = parseInt(paymentIntent.metadata.promo_discount || '0') / 100; // Convert cents to euros
          if (paymentIntent.metadata.promo_id) {
            promoCodeId = parseInt(paymentIntent.metadata.promo_id);
          }
        }
        if (paymentIntent.metadata.gift_card_amount) {
          giftCardAmount = parseInt(paymentIntent.metadata.gift_card_amount || '0') / 100; // Convert cents to euros
          if (paymentIntent.metadata.gift_card_id) {
            giftCardId = parseInt(paymentIntent.metadata.gift_card_id);
          }
          if (paymentIntent.metadata.gift_card_code) {
            giftCardCode = paymentIntent.metadata.gift_card_code;
          }
        }

        console.log('[Bookings API] Payment details:', {
          original_amount: paymentIntent.metadata.original_amount,
          promo_code_id: promoCodeId,
          promo_discount: promoDiscount,
          gift_card_id: giftCardId,
          gift_card_code: giftCardCode,
          gift_card_amount: giftCardAmount,
          final_amount: paymentIntent.amount / 100,
        });

      } else if (payment_intent_id === 'no-payment-required') {
        // Payment fully covered by promo/gift card
        console.log('[Bookings API] No payment required - fully covered by promo/gift card');
        paymentIntent = null;

        // Use promo/gift card details from request body
        if (promo_code_id) {
          promoCodeId = promo_code_id;
          promoDiscount = promo_discount || 0;
        }
        if (gift_card_id) {
          giftCardId = gift_card_id;
          giftCardCode = gift_card_code || null;
          giftCardAmount = gift_card_amount || 0;
        }

        console.log('[Bookings API] Payment details from request:', {
          promo_code_id: promoCodeId,
          promo_discount: promoDiscount,
          gift_card_id: giftCardId,
          gift_card_code: giftCardCode,
          gift_card_amount: giftCardAmount,
        });

      } else {
        // Legacy flow: Create new payment intent
        console.log('[Bookings API] Creating new PaymentIntent (legacy flow)');
        paymentIntent = await createBookingPaymentIntent({
          amount: service.base_price,
          customerId: stripeCustomer.id,
          metadata: {
            booking_id: 'temp', // Will update after booking creation
            client_id: user.id,
            service_id: service_id,
            service_name: service.name,
          },
          description: `Réservation Simone Paris - ${service.name} - ${new Date(scheduled_datetime).toLocaleDateString('fr-FR', { timeZone: booking_timezone })}`,
        });
        console.log('✅ Stripe PaymentIntent created:', paymentIntent.id);
      }
    } catch (stripeError) {
      console.error('❌ Stripe payment intent error:', stripeError);
      return NextResponse.json(
        {
          error: 'Failed to process payment',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Parse scheduled_datetime to extract date and time for backward compatibility
    const scheduledDate = new Date(scheduled_datetime);
    const dateOnly = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeOnly = scheduledDate.toTimeString().split(' ')[0]; // HH:mm:ss

    console.log('[Bookings API] Scheduled:', {
      scheduled_datetime,
      dateOnly,
      timeOnly,
      booking_timezone
    });

    // Calculate final service amount after discounts
    const finalServiceAmount = service.base_price - promoDiscount - giftCardAmount;

    // Create the appointment booking
    const { data: booking, error: bookingError} = await supabase
      .from('appointment_bookings')
      .insert({
        client_id: user.id,
        service_id: service_id,
        contractor_id: contractor_id || null, // Assigned contractor or null
        // New timezone-aware columns
        scheduled_datetime: scheduled_datetime,
        booking_timezone: booking_timezone,
        // Legacy columns (still NOT NULL, needed for backward compatibility)
        scheduled_date: dateOnly,
        scheduled_time: timeOnly,
        duration_minutes: service.base_duration_minutes,
        service_address: `${address.street}${address.building_info ? ', ' + address.building_info : ''}`,
        service_city: address.city,
        service_postal_code: address.postal_code,
        service_latitude: address.latitude,
        service_longitude: address.longitude,
        service_amount: finalServiceAmount,
        service_amount_original: service.base_price,
        // Promo code details
        promo_code_id: promoCodeId,
        promo_discount_amount: promoDiscount > 0 ? promoDiscount : null,
        // Gift card details
        gift_card_id: giftCardId,
        gift_card_code: giftCardCode,
        gift_card_amount: giftCardAmount > 0 ? giftCardAmount : null,
        status: 'pending', // Always pending - contractor must manually confirm
        client_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        client_phone: profile.phone || user.phone || '',
        client_email: user.email || '',
        service_name: service.name,
        stripe_payment_intent_id: paymentIntent?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError);

      // Cancel the payment intent if booking creation failed and payment intent exists
      if (paymentIntent?.id) {
        try {
          await cancelPaymentIntent(paymentIntent.id, 'requested_by_customer');
          console.log('✅ Payment intent cancelled due to booking creation failure');
        } catch (cancelError) {
          console.error('⚠️  Failed to cancel payment intent:', cancelError);
        }
      }

      return NextResponse.json(
        { error: 'Failed to create booking', details: bookingError.message },
        { status: 500 }
      );
    }

    // Update payment intent metadata with actual booking_id (if payment intent exists)
    if (paymentIntent?.id) {
      try {
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            booking_id: booking.id.toString(),
            client_id: user.id,
            service_id: service_id.toString(),
            service_name: service.name,
          },
        });
        console.log('✅ Payment intent metadata updated with booking_id:', booking.id);
      } catch (updateError) {
        console.error('⚠️  Failed to update payment intent metadata:', updateError);
        // Non-critical error, continue
      }
    }

    // Apply gift card balance deduction if gift card was used
    if (giftCardId && giftCardAmount > 0) {
      try {
        const { error: giftCardError } = await supabase.rpc('apply_gift_card_to_booking', {
          p_gift_card_id: giftCardId,
          p_booking_id: booking.id,
          p_user_id: user.id,
          p_amount: giftCardAmount,
        });

        if (giftCardError) {
          console.error('⚠️  Failed to apply gift card balance:', giftCardError);
          // Non-critical - booking already created, log the issue
        } else {
          console.log('✅ Gift card balance deducted:', giftCardAmount, '€');
        }
      } catch (giftCardError) {
        console.error('⚠️  Error applying gift card:', giftCardError);
        // Non-critical error, continue
      }
    }

    // Record promo code usage if promo was used
    if (promoCodeId && promoDiscount > 0) {
      try {
        const { error: promoError } = await supabase
          .from('promo_code_usage')
          .insert({
            promo_code_id: promoCodeId,
            booking_id: booking.id,
            user_id: user.id,
            original_amount: service.base_price,
            discount_amount: promoDiscount,
            final_amount: service.base_price - promoDiscount - giftCardAmount,
            used_at: new Date().toISOString(),
          });

        if (promoError) {
          console.error('⚠️  Failed to record promo code usage:', promoError);
          // Non-critical - booking already created, log the issue
        } else {
          console.log('✅ Promo code usage recorded');
        }
      } catch (promoError) {
        console.error('⚠️  Error recording promo usage:', promoError);
        // Non-critical error, continue
      }
    }

    // Create booking request for contractors to see
    // Always create as 'pending' - contractor must manually confirm
    // Request expires 24 hours before the scheduled service
    const expiresAt = new Date(scheduled_datetime);
    expiresAt.setHours(expiresAt.getHours() - 24); // Expires 24h before service

    const { error: requestError } = await supabase
      .from('booking_requests')
      .insert({
        booking_id: booking.id,
        contractor_id: contractor_id || null, // Assigned contractor or null for open request
        status: 'pending', // Always pending - contractor must manually confirm
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (requestError) {
      console.error('⚠️  Error creating booking request:', requestError);
      // Don't fail the whole operation if this fails
    }

    // Send booking confirmation email to client
    try {
      // Convert scheduled_datetime to Paris timezone for email display
      const scheduledDate = new Date(booking.scheduled_datetime);
      const dateStr = scheduledDate.toLocaleDateString('fr-FR', {
        timeZone: booking.booking_timezone || 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const timeStr = scheduledDate.toLocaleTimeString('fr-FR', {
        timeZone: booking.booking_timezone || 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const emailResult = await sendBookingConfirmationEmail({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        serviceName: booking.service_name,
        scheduledDate: dateStr,
        scheduledTime: timeStr,
        serviceAddress: booking.service_address,
        serviceCity: booking.service_city,
        servicePostalCode: booking.service_postal_code,
        serviceAmount: booking.service_amount,
        bookingId: booking.id,
      });

      if (emailResult.success) {
        console.log('✅ Confirmation email sent to client:', emailResult.messageId);
      } else {
        console.error('⚠️  Failed to send confirmation email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('⚠️  Error sending confirmation email:', emailError);
      // Non-critical error, don't fail the booking
    }

    // TODO: Send notification emails/SMS to available contractors

    return NextResponse.json({
      success: true,
      booking: booking,
      booking_id: booking.id,
      payment_intent_id: paymentIntent?.id || null,
      payment_intent_client_secret: paymentIntent?.client_secret || null,
      stripe_customer_id: stripeCustomer.id,
      message: paymentIntent
        ? 'Réservation créée avec succès - En attente de confirmation du prestataire'
        : 'Réservation créée avec succès (couverte par code promo/carte cadeau) - En attente de confirmation du prestataire',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/bookings/create:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
