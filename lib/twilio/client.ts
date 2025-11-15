import twilio from 'twilio';

let twilioClientInstance: ReturnType<typeof twilio> | null = null;

/**
 * Get Twilio client instance - Server-side only
 * Lazy initialization to avoid build-time errors
 */
function getTwilioClient(): ReturnType<typeof twilio> | null {
  if (twilioClientInstance !== null) {
    return twilioClientInstance;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Validate that credentials are proper Twilio credentials (not placeholders)
  const isValidAccountSid = accountSid && accountSid.startsWith('AC');
  const isValidAuthToken = authToken && authToken.length > 20;

  if (!isValidAccountSid || !isValidAuthToken) {
    console.warn('⚠️  Twilio credentials not configured. SMS functionality will be disabled.');
    twilioClientInstance = null;
    return null;
  }

  twilioClientInstance = twilio(accountSid, authToken);
  return twilioClientInstance;
}

/**
 * Twilio client - Server-side only
 * Uses lazy initialization to avoid build-time errors
 * Returns null if credentials are not configured
 */
export const twilioClient = new Proxy({} as ReturnType<typeof twilio>, {
  get: (_target, prop) => {
    const instance = getTwilioClient();
    if (instance === null) {
      return null;
    }
    const value = instance[prop as keyof ReturnType<typeof twilio>];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
}) as ReturnType<typeof twilio> | null;

// Export configuration getter
export const getTwilioConfig = () => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
});

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
