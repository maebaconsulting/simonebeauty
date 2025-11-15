export default function TestVercelPreviewPage() {
  const timestamp = new Date().toISOString();

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
          Vercel Preview Test
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Deployment Verification Page
        </p>
      </div>

      <div style={{
        background: '#f7fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginTop: 0, color: '#2d3748' }}>
          Deployment Status
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <strong style={{ color: '#48bb78' }}>✓ </strong>
          Vercel Preview deployment successful
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong style={{ color: '#48bb78' }}>✓ </strong>
          Next.js build completed
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong style={{ color: '#48bb78' }}>✓ </strong>
          Environment variables loaded
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h3 style={{ marginTop: 0, color: '#2d3748' }}>
          Environment Information
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 0', fontWeight: 600 }}>
                Build Timestamp:
              </td>
              <td style={{ padding: '12px 0', fontFamily: 'monospace', fontSize: '14px' }}>
                {timestamp}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 0', fontWeight: 600 }}>
                Supabase URL:
              </td>
              <td style={{ padding: '12px 0', fontFamily: 'monospace', fontSize: '14px' }}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 0', fontWeight: 600 }}>
                Stripe Key (First 20 chars):
              </td>
              <td style={{ padding: '12px 0', fontFamily: 'monospace', fontSize: '14px' }}>
                {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) || 'Not configured'}...
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px 0', fontWeight: 600 }}>
                Google Maps API (First 20 chars):
              </td>
              <td style={{ padding: '12px 0', fontFamily: 'monospace', fontSize: '14px' }}>
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 20) || 'Not configured'}...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: '#edf2f7',
        borderLeft: '4px solid #4299e1',
        borderRadius: '4px'
      }}>
        <h4 style={{ marginTop: 0, color: '#2c5282' }}>
          Next Steps
        </h4>
        <ol style={{ margin: '8px 0', paddingLeft: '20px', color: '#2d3748' }}>
          <li>Verify environment variables are correct</li>
          <li>Test Supabase connection</li>
          <li>Check browser console for any errors</li>
          <li>Validate all public pages load correctly</li>
        </ol>
      </div>

      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        color: '#718096',
        fontSize: '14px'
      }}>
        Option A - Multi-Environment Setup | Test Deployment
      </div>
    </div>
  );
}
