import { twilioClient, twilioConfig, formatPhoneNumber, isValidPhoneNumber } from './client';
import { createClient } from '@/lib/supabase/server';

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a generic SMS message
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<SMSResult> {
  try {
    // Validate phone number
    if (!isValidPhoneNumber(to)) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    // Validate Twilio phone number is configured
    if (!twilioConfig.phoneNumber) {
      console.error('TWILIO_PHONE_NUMBER not configured');
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    const formattedTo = formatPhoneNumber(to);

    // Send SMS via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioConfig.phoneNumber,
      to: formattedTo,
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has SMS notifications enabled
 */
async function canSendSMS(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: preferences } = await supabase
      .from('client_notification_preferences')
      .select('sms_enabled')
      .eq('client_id', userId)
      .single();

    return preferences?.sms_enabled ?? true; // Default to true if no preferences set
  } catch (error) {
    console.error('Error checking SMS preferences:', error);
    return true; // Default to sending if we can't check
  }
}

/**
 * Send booking confirmation SMS
 */
export async function sendBookingConfirmationSMS(
  userId: string,
  phoneNumber: string,
  bookingDetails: {
    serviceName: string;
    contractorName: string;
    date: string;
    time: string;
    address: string;
  }
): Promise<SMSResult> {
  // Check if user has SMS enabled
  const canSend = await canSendSMS(userId);
  if (!canSend) {
    return {
      success: false,
      error: 'User has disabled SMS notifications',
    };
  }

  const message = `Bonjour! Votre réservation est confirmée ✓

Service: ${bookingDetails.serviceName}
Professionnel: ${bookingDetails.contractorName}
Date: ${bookingDetails.date} à ${bookingDetails.time}
Adresse: ${bookingDetails.address}

Nous vous rappellerons 24h avant votre rendez-vous.

Simone Paris`;

  return sendSMS(phoneNumber, message);
}

/**
 * Send booking reminder SMS (24h before appointment)
 */
export async function sendBookingReminderSMS(
  userId: string,
  phoneNumber: string,
  bookingDetails: {
    serviceName: string;
    contractorName: string;
    date: string;
    time: string;
    address: string;
  }
): Promise<SMSResult> {
  // Check if user has SMS enabled
  const canSend = await canSendSMS(userId);
  if (!canSend) {
    return {
      success: false,
      error: 'User has disabled SMS notifications',
    };
  }

  const message = `Rappel: Votre rendez-vous est demain!

Service: ${bookingDetails.serviceName}
Professionnel: ${bookingDetails.contractorName}
Date: ${bookingDetails.date} à ${bookingDetails.time}
Adresse: ${bookingDetails.address}

À très bientôt!
Simone Paris`;

  return sendSMS(phoneNumber, message);
}

/**
 * Send booking cancellation SMS
 */
export async function sendBookingCancellationSMS(
  userId: string,
  phoneNumber: string,
  bookingDetails: {
    serviceName: string;
    contractorName: string;
    date: string;
    time: string;
    reason?: string;
  }
): Promise<SMSResult> {
  // Check if user has SMS enabled
  const canSend = await canSendSMS(userId);
  if (!canSend) {
    return {
      success: false,
      error: 'User has disabled SMS notifications',
    };
  }

  const message = `Votre réservation a été annulée.

Service: ${bookingDetails.serviceName}
Professionnel: ${bookingDetails.contractorName}
Date: ${bookingDetails.date} à ${bookingDetails.time}
${bookingDetails.reason ? `Raison: ${bookingDetails.reason}` : ''}

N'hésitez pas à reprendre rendez-vous quand vous le souhaitez.

Simone Paris`;

  return sendSMS(phoneNumber, message);
}

/**
 * Send contractor assignment notification SMS
 */
export async function sendContractorAssignmentSMS(
  userId: string,
  phoneNumber: string,
  bookingDetails: {
    serviceName: string;
    contractorName: string;
    date: string;
    time: string;
  }
): Promise<SMSResult> {
  // Check if user has SMS enabled
  const canSend = await canSendSMS(userId);
  if (!canSend) {
    return {
      success: false,
      error: 'User has disabled SMS notifications',
    };
  }

  const message = `Bonne nouvelle! Un professionnel a accepté votre demande.

Professionnel: ${bookingDetails.contractorName}
Service: ${bookingDetails.serviceName}
Date: ${bookingDetails.date} à ${bookingDetails.time}

Consultez votre espace client pour plus de détails.

Simone Paris`;

  return sendSMS(phoneNumber, message);
}

/**
 * Send verification code SMS
 */
export async function sendVerificationCodeSMS(
  phoneNumber: string,
  code: string
): Promise<SMSResult> {
  const message = `Votre code de vérification Simone Paris: ${code}

Ce code expire dans 10 minutes.

Ne partagez jamais ce code.`;

  return sendSMS(phoneNumber, message);
}
