# Supabase Storage Buckets Configuration

## Required Buckets for Feature 007 - Contractor Interface

### 1. job-applications

**Purpose**: Store contractor application documents (CV, certifications, portfolio)

**Configuration**:
```
Name: job-applications
Public: No (private)
File size limit: 5MB per file
Allowed file types: .pdf, .doc, .docx, .jpg, .jpeg, .png
```

**Directory Structure**:
```
job-applications/
  ├── cv/
  │   └── {application_id}_{filename}
  ├── certifications/
  │   └── {application_id}_{filename}
  └── portfolio/
      └── {application_id}_{filename}
```

**RLS Policies**:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload application files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-applications');

-- Allow admins to read all files
CREATE POLICY "Admins can read all application files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-applications' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Allow applicants to read their own files
CREATE POLICY "Applicants can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-applications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. contractor-portfolios

**Purpose**: Store contractor portfolio images visible to clients

**Configuration**:
```
Name: contractor-portfolios
Public: Yes (public read access)
File size limit: 5MB per file
Allowed file types: .jpg, .jpeg, .png, .webp
```

**Directory Structure**:
```
contractor-portfolios/
  └── {contractor_id}/
      ├── portfolio/
      │   └── {image_id}.jpg
      └── certifications/
          └── {cert_id}.pdf
```

**RLS Policies**:
```sql
-- Anyone can read portfolio images
CREATE POLICY "Public can read contractor portfolios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contractor-portfolios');

-- Contractors can upload to own folder
CREATE POLICY "Contractors can upload to own portfolio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contractor-portfolios' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM contractors WHERE profile_uuid = auth.uid()
  )
);

-- Contractors can delete own files
CREATE POLICY "Contractors can delete own portfolio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contractor-portfolios' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM contractors WHERE profile_uuid = auth.uid()
  )
);
```

## Setup Instructions

### Via Supabase Dashboard:

1. Go to **Storage** in your Supabase project
2. Click **New bucket**
3. Configure each bucket as specified above
4. Go to **Policies** tab and add the RLS policies

### Via Supabase CLI:

```bash
# Create buckets
supabase storage create job-applications --public false
supabase storage create contractor-portfolios --public true

# Apply RLS policies (run SQL in dashboard or via migrations)
```

## Verification

After setup, verify with:

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Test upload
const { data, error } = await supabase.storage
  .from('job-applications')
  .upload('cv/test.pdf', file)

console.log('Upload result:', data, error)
```

## Next Steps

Once buckets are created:
1. Update file upload utilities in `lib/supabase/storage-utils.ts`
2. Test file uploads in job application form
3. Test portfolio image uploads in contractor profile editor
