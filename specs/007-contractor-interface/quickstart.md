# Quickstart Guide
# Feature 007: Interface Prestataire Complète

**Date:** 2025-11-07
**Branch:** `007-contractor-interface`

---

## Prerequisites

Before starting development on this feature, ensure you have:

- Node.js 20+ installed
- Supabase CLI installed (`npm install -g supabase`)
- Access to Supabase project
- Stripe account (test mode) with Connect enabled
- Docker installed (for local Supabase)

---

## 1. Environment Setup

### Clone and Install

```bash
cd /Users/dan/Documents/SOFTWARE/myProjects/simone\ _v2.1/webclaude
git checkout 007-contractor-interface
npm install
```

### Environment Variables

Create or update `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Connect
STRIPE_CONNECT_CLIENT_ID=ca_...

# Frontend URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@simone.paris
RESEND_CONTACT_EMAIL=contact@simone.paris

# Google Maps (for travel time calculations)
GOOGLE_MAPS_API_KEY=AIza...
```

---

## 2. Local Database Setup

### Start Local Supabase

```bash
# Initialize Supabase (first time only)
supabase init

# Start local Supabase stack (PostgreSQL, Auth, Storage, Edge Functions)
supabase start
```

This will output your local connection strings:

```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Update `.env.local` with these local values for development.

### Run Migrations

```bash
# Create migrations directory structure
mkdir -p supabase/migrations

# Run migrations in order
supabase db reset

# Or apply specific migration
supabase migration up
```

### Migration Files to Create

Create these migration files in `supabase/migrations/`:

1. `20250107_001_create_specialties.sql`
2. `20250107_002_create_contractor_applications.sql`
3. `20250107_003_create_contractor_onboarding_status.sql`
4. `20250107_004_create_contractor_schedules.sql`
5. `20250107_005_create_contractor_unavailabilities.sql`
6. `20250107_006_create_contractor_profiles.sql`
7. `20250107_007_create_contractor_services.sql`
8. `20250107_008_create_contractor_slug_tables.sql`
9. `20250107_009_create_booking_requests.sql`
10. `20250107_010_create_service_action_logs.sql`
11. `20250107_011_extend_contractors_table.sql`
12. `20250107_012_extend_bookings_table.sql`
13. `20250107_013_create_platform_config.sql`
14. `20250107_014_create_financial_views.sql`
15. `20250107_015_seed_data.sql`

Copy the SQL from `data-model.md` into these migration files.

### Verify Migrations

```bash
# Check migration status
supabase migration list

# Access Supabase Studio
open http://localhost:54323
```

---

## 3. Supabase Storage Setup

### Create Storage Buckets

Run this SQL in Supabase Studio or via CLI:

```sql
-- Create job-applications bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-applications', 'job-applications', false);

-- Create contractor-portfolios bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-portfolios', 'contractor-portfolios', true);

-- RLS Policies for job-applications
CREATE POLICY "Authenticated users can upload job application files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-applications');

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

-- RLS Policies for contractor-portfolios
CREATE POLICY "Anyone can view contractor portfolios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contractor-portfolios');

CREATE POLICY "Contractors can upload to own portfolio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contractor-portfolios'
  AND (storage.foldername(name))[1] IN (
    SELECT id::TEXT FROM contractors WHERE profile_uuid = auth.uid()
  )
);
```

### Test File Upload Locally

```typescript
// Test script: test-upload.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testUpload() {
  const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

  const { data, error } = await supabase.storage
    .from('job-applications')
    .upload('cv/test-cv.txt', file);

  console.log('Upload result:', { data, error });
}

testUpload();
```

---

## 4. Stripe Connect Setup (Test Mode)

### Enable Stripe Connect

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/connect/accounts/overview)
2. Enable **Connect** if not already enabled
3. Configure **Express** account type
4. Set redirect URLs:
   - Refresh URL: `http://localhost:3000/contractor/stripe-refresh`
   - Return URL: `http://localhost:3000/contractor/stripe-return`

### Create Test Connect Account

```typescript
// Test script: test-stripe-connect.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function createTestAccount() {
  // Create Express account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'FR',
    email: 'test-contractor@example.com',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      contractor_id: '1',
    },
  });

  console.log('Created account:', account.id);

  // Create account link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'http://localhost:3000/contractor/stripe-refresh',
    return_url: 'http://localhost:3000/contractor/stripe-return',
    type: 'account_onboarding',
  });

  console.log('Onboarding URL:', accountLink.url);
}

createTestAccount();
```

### Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will output a webhook signing secret like: whsec_...
# Add it to .env.local as STRIPE_WEBHOOK_SECRET
```

### Test Webhook Events

```bash
# Trigger test account.updated event
stripe trigger account.updated
```

---

## 5. Edge Functions Development

### Edge Functions Structure

```
supabase/functions/
├── submit-job-application/
│   └── index.ts
├── check-slug-availability/
│   └── index.ts
├── create-stripe-connect-account/
│   └── index.ts
├── accept-booking-request/
│   └── index.ts
├── mark-booking-completed/
│   └── index.ts
├── export-financial-history/
│   └── index.ts
├── track-slug-visit/
│   └── index.ts
└── expire-pending-requests/ (cron job)
    └── index.ts
```

### Serve Edge Functions Locally

```bash
# Serve all functions
supabase functions serve

# Serve specific function with env vars
supabase functions serve submit-job-application --env-file .env.local

# Test function
curl -i --location --request POST 'http://localhost:54321/functions/v1/submit-job-application' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"first_name":"Marie","last_name":"Dupont",...}'
```

### Deploy Edge Functions

```bash
# Deploy single function
supabase functions deploy submit-job-application

# Deploy all functions
supabase functions deploy
```

---

## 6. Frontend Development

### Run Development Server

```bash
npm run dev
```

Access the app at: http://localhost:3000

### Key Routes to Implement

```
Public:
- /rejoindre-simone - Job application form

Contractor (authenticated):
- /contractor/dashboard - Overview dashboard
- /contractor/onboarding - Onboarding wizard
- /contractor/planning - Weekly planning view
- /contractor/bookings - Booking requests & history
- /contractor/financials - Revenue dashboard
- /contractor/profile - Professional profile editor
- /contractor/settings - Account settings & slug

Client:
- /book/[slug] - Public booking page via contractor slug
```

### Test Users

Create test users in Supabase Studio:

```sql
-- Create admin user
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES (
  gen_random_uuid(),
  'admin@simone.paris',
  'admin',
  'Admin',
  'Simone'
);

-- Create contractor user
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES (
  gen_random_uuid(),
  'contractor@example.com',
  'contractor',
  'Marie',
  'Dupont'
);

-- Create contractor record
INSERT INTO contractors (profile_uuid, first_name, last_name, slug)
VALUES (
  (SELECT id FROM profiles WHERE email = 'contractor@example.com'),
  'Marie',
  'Dupont',
  'marie-dupont'
);

-- Create onboarding status
INSERT INTO contractor_onboarding_status (contractor_id)
VALUES (
  (SELECT id FROM contractors WHERE profile_uuid = (SELECT id FROM profiles WHERE email = 'contractor@example.com'))
);
```

---

## 7. Testing Scenarios

### Test Job Application Flow

1. Navigate to http://localhost:3000/rejoindre-simone
2. Fill out all 5 steps of the form
3. Upload test files (CV, certifications)
4. Submit application
5. Check Inbucket (http://localhost:54324) for emails sent
6. Login as admin and view application in backoffice

### Test Onboarding Flow

1. Login as newly created contractor
2. Complete profile setup
3. Configure weekly schedule
4. Initiate Stripe Connect (use test account)
5. Verify onboarding completion percentage updates

### Test Booking Request Flow

1. Create a test booking as client
2. Login as contractor
3. View pending request in dashboard
4. Accept or refuse booking
5. Verify payment capture (use Stripe test card: 4242 4242 4242 4242)

### Test Slug Management

1. Login as contractor
2. Navigate to settings
3. Change slug (check validation)
4. Copy booking link
5. Test old slug redirect (should redirect to new slug)
6. Wait 30 days or manually expire in DB to test 404 page

### Test Financial Dashboard

1. Complete a booking with tip
2. Navigate to contractor financials
3. Verify breakdown shows:
   - Service revenue (after commission + fees)
   - Tip revenue (after Stripe fees)
   - Total net
4. Export CSV and verify columns

---

## 8. Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution:**
```bash
# Reset local database
supabase db reset

# Or drop and recreate
supabase db reset --force
```

### Issue: File upload returns 403 Forbidden

**Solution:**
- Check RLS policies are enabled on storage.objects
- Verify user is authenticated
- Check bucket exists: `SELECT * FROM storage.buckets;`

### Issue: Stripe webhook not receiving events

**Solution:**
```bash
# Ensure Stripe CLI is forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check webhook endpoint is accessible
curl -X POST http://localhost:3000/api/webhooks/stripe
```

### Issue: Edge Function returns "Function not found"

**Solution:**
```bash
# Ensure function is deployed
supabase functions list

# Redeploy
supabase functions deploy function-name
```

### Issue: Slug validation always returns "already taken"

**Solution:**
- Check unique index on contractors.slug
- Verify RLS policies don't block reads
- Test query directly: `SELECT COUNT(*) FROM contractors WHERE slug = 'test-slug';`

---

## 9. Development Workflow

### Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feat/007-job-application-form

# Commit with conventional commits
git commit -m "feat(contractor): add job application multi-step form"

# Push and create PR
git push origin feat/007-job-application-form
```

### Database Changes

```bash
# Create new migration
supabase migration new add_contractor_notes_column

# Edit migration file
# supabase/migrations/20250107_016_add_contractor_notes_column.sql

# Apply locally
supabase db reset

# Test changes
# ...

# Commit migration file
git add supabase/migrations/
git commit -m "feat(db): add contractor notes column"
```

### Testing Edge Functions

```bash
# Create test file
touch supabase/functions/submit-job-application/test.ts

# Run tests with Deno
deno test --allow-all supabase/functions/submit-job-application/test.ts
```

---

## 10. Deployment Checklist

Before deploying to production:

- [ ] All migrations tested locally
- [ ] All Edge Functions deployed and tested
- [ ] Storage buckets created with correct RLS policies
- [ ] Stripe Connect configured in production mode
- [ ] Webhook endpoints verified in Stripe Dashboard
- [ ] Environment variables set in production
- [ ] Test emails sent successfully
- [ ] File uploads work end-to-end
- [ ] Slug redirects working correctly
- [ ] Financial calculations verified
- [ ] RLS policies tested for all tables
- [ ] Performance tested (Lighthouse score >90)
- [ ] Mobile responsive design verified

---

## 11. Useful Commands

### Supabase

```bash
# View logs
supabase functions logs submit-job-application

# Generate TypeScript types from database
supabase gen types typescript --local > types/supabase.ts

# Dump database schema
supabase db dump --schema public > schema.sql

# List all functions
supabase functions list

# Delete function
supabase functions delete function-name
```

### Database Queries

```sql
-- View all contractors with slug
SELECT id, first_name, last_name, slug, slug_changes_count
FROM contractors
ORDER BY created_at DESC;

-- View pending booking requests
SELECT br.*, b.service_name, b.scheduled_date
FROM booking_requests br
JOIN appointment_bookings b ON b.id = br.booking_id
WHERE br.status = 'pending'
AND br.expires_at > NOW();

-- View financial summary for contractor
SELECT * FROM contractor_financial_summary
WHERE contractor_id = 1;

-- View slug analytics
SELECT * FROM contractor_slug_stats
WHERE contractor_id = 1;

-- Check onboarding status
SELECT * FROM contractor_onboarding_status
WHERE contractor_id = 1;
```

### Stripe CLI

```bash
# List all Connect accounts
stripe accounts list

# Get account details
stripe accounts retrieve acct_xxxxx

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger account.updated

# View webhook events
stripe events list --limit 10
```

---

## 12. Resources

### Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [TanStack Query](https://tanstack.com/query/latest)

### Internal Docs

- Project Constitution: `/.specify/constitution.md`
- Feature Spec: `/specs/007-contractor-interface/spec.md`
- Data Model: `/specs/007-contractor-interface/data-model.md`
- Research: `/specs/007-contractor-interface/research.md`
- API Contracts: `/specs/007-contractor-interface/contracts/`

### Support

- Platform Issues: Open GitHub issue
- Supabase Issues: [Supabase GitHub](https://github.com/supabase/supabase/issues)
- Stripe Issues: [Stripe Support](https://support.stripe.com)

---

## Quick Reference

### Database Connection

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

### Stripe Client

```typescript
// utils/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});
```

### File Upload Example

```typescript
// utils/upload.ts
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
) {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}
```

### Edge Function Template

```typescript
// supabase/functions/example/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Your logic here
    const data = await req.json();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

**Last Updated:** 2025-11-07
**Version:** 1.0
