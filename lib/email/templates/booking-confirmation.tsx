import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BookingConfirmationEmailProps {
  clientName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  serviceCity: string;
  servicePostalCode: string;
  serviceAmount: number;
  bookingId: number;
}

export const BookingConfirmationEmail = ({
  clientName,
  serviceName,
  scheduledDate,
  scheduledTime,
  serviceAddress,
  serviceCity,
  servicePostalCode,
  serviceAmount,
  bookingId,
}: BookingConfirmationEmailProps) => {
  const formattedDate = new Date(scheduledDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Preview>Votre réservation Simone Paris est confirmée 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Heading style={h1}>Simone Paris</Heading>
          </Section>

          {/* Confirmation Message */}
          <Section style={content}>
            <Heading style={h2}>✅ Réservation Confirmée !</Heading>
            <Text style={text}>
              Bonjour {clientName},
            </Text>
            <Text style={text}>
              Votre réservation a été confirmée avec succès. Un prestataire vous
              contactera prochainement pour confirmer le rendez-vous.
            </Text>
          </Section>

          {/* Booking Details */}
          <Section style={detailsBox}>
            <Heading style={h3}>Détails de votre réservation</Heading>

            <Hr style={hr} />

            <table style={detailsTable}>
              <tbody>
                <tr>
                  <td style={detailLabel}>Service</td>
                  <td style={detailValue}>{serviceName}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Date</td>
                  <td style={detailValue}>{formattedDate}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Heure</td>
                  <td style={detailValue}>{scheduledTime}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Adresse</td>
                  <td style={detailValue}>
                    {serviceAddress}
                    <br />
                    {servicePostalCode} {serviceCity}
                  </td>
                </tr>
                <tr>
                  <td style={detailLabel}>Montant</td>
                  <td style={detailValue}>{serviceAmount} €</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Numéro de réservation</td>
                  <td style={detailValue}>#{bookingId}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Payment Info */}
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>💳 Paiement sécurisé</strong>
              <br />
              Votre carte bancaire a été pré-autorisée. Le paiement sera
              effectué uniquement après la réalisation du service.
            </Text>
          </Section>

          {/* Actions */}
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_SITE_URL}/client/bookings/${bookingId}`}
            >
              Voir ma réservation
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Vous avez des questions ? Contactez-nous à{' '}
              <Link href="mailto:contact@simone.paris" style={link}>
                contact@simone.paris
              </Link>
            </Text>
            <Text style={footerText}>
              © 2025 Simone Paris. Tous droits réservés.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingConfirmationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px 20px',
  backgroundColor: '#4F46E5',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 48px',
};

const h2 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  marginTop: '24px',
  marginBottom: '16px',
};

const h3 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '16px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const detailsBox = {
  margin: '24px 48px',
  padding: '24px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: '#f9fafb',
};

const detailsTable = {
  width: '100%',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 'bold',
  paddingTop: '12px',
  paddingBottom: '12px',
  width: '40%',
  verticalAlign: 'top' as const,
};

const detailValue = {
  color: '#111827',
  fontSize: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
};

const infoBox = {
  margin: '24px 48px',
  padding: '20px',
  backgroundColor: '#dbeafe',
  borderRadius: '8px',
  borderLeft: '4px solid #3b82f6',
};

const infoText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  padding: '24px 48px',
};

const button = {
  backgroundColor: '#4F46E5',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  padding: '0 48px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '12px',
  marginBottom: '12px',
  textAlign: 'center' as const,
};

const link = {
  color: '#4F46E5',
  textDecoration: 'underline',
};
