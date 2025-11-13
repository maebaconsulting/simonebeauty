import twilio from 'twilio';

// Twilio credentials - must be set in environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken) {
  console.warn('⚠️  Twilio credentials not configured. SMS functionality will be disabled.');
}

// Initialize Twilio client (only if credentials are available)
export const twilioClient = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null;

// Export configuration
export const twilioConfig = {
  accountSid,
  phoneNumber: twilioPhoneNumber,
};

/**
 * Validate phone number format
 * Accepts French format: +33, 0033, or 06/07
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Handle French formats
  if (cleaned.startsWith('0033')) {
    cleaned = '+33' + cleaned.substring(4);
  } else if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Validate if phone number is valid for SMS
 */
export function isValidPhoneNumber(phone: string): boolean {
  try {
    const formatted = formatPhoneNumber(phone);
    // Basic validation: must start with + and have 10-15 digits
    return /^\+\d{10,15}$/.test(formatted);
  } catch {
    return false;
  }
}
