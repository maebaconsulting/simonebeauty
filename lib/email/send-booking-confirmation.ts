import { Resend } from 'resend';
import { render } from '@react-email/render';
import BookingConfirmationEmail from './templates/booking-confirmation';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY is not set. Email sending will fail.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface BookingConfirmationData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  serviceCity: string;
  servicePostalCode: string;
  serviceAmount: number;
  bookingId: number;
}

/**
 * Send booking confirmation email to client
 */
export async function sendBookingConfirmationEmail(
  data: BookingConfirmationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Render the email template
    const emailHtml = await render(
      BookingConfirmationEmail({
        clientName: data.clientName,
        serviceName: data.serviceName,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        serviceAddress: data.serviceAddress,
        serviceCity: data.serviceCity,
        servicePostalCode: data.servicePostalCode,
        serviceAmount: data.serviceAmount,
        bookingId: data.bookingId,
      })
    );

    // Send email via Resend
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@simone.paris',
      to: data.clientEmail,
      subject: `✅ Réservation confirmée - ${data.serviceName}`,
      html: emailHtml,
    });

    if (response.error) {
      console.error('❌ Resend error:', response.error);
      return {
        success: false,
        error: response.error.message,
      };
    }

    console.log('✅ Booking confirmation email sent:', response.data?.id);

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error('❌ Failed to send booking confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send booking notification to contractor
 */
export async function sendContractorNotificationEmail(data: {
  contractorEmail: string;
  contractorName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  bookingId: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedDate = new Date(data.scheduledDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@simone.paris',
      to: data.contractorEmail,
      subject: `🔔 Nouvelle réservation - ${data.serviceName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Nouvelle réservation</h1>
          <p>Bonjour ${data.contractorName},</p>
          <p>Une nouvelle réservation vous a été attribuée :</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service :</strong> ${data.serviceName}</p>
            <p><strong>Date :</strong> ${formattedDate}</p>
            <p><strong>Heure :</strong> ${data.scheduledTime}</p>
            <p><strong>Adresse :</strong> ${data.serviceAddress}</p>
            <p><strong>Réservation #:</strong> ${data.bookingId}</p>
          </div>

          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contractor/bookings/${data.bookingId}"
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Voir la réservation
            </a>
          </p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            © 2025 Simone Paris. Tous droits réservés.
          </p>
        </div>
      `,
    });

    if (response.error) {
      console.error('❌ Resend error:', response.error);
      return {
        success: false,
        error: response.error.message,
      };
    }

    console.log('✅ Contractor notification email sent:', response.data?.id);

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error('❌ Failed to send contractor notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
