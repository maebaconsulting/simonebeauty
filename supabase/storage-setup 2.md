# Supabase Storage Setup Instructions

**Feature**: 007 - Contractor Interface
**Date**: 2025-11-07
**Status**: Manual setup required via Supabase Dashboard

---

## Overview

This document provides instructions for creating and configuring Supabase Storage buckets for the contractor interface feature.

---

## 1. Create "job-applications" Bucket

### Steps (via Supabase Dashboard)

1. Navigate to **Storage** → **Create a new bucket**
2. **Bucket name**: `job-applications`
3. **Public bucket**: ❌ **No** (private - only authenticated users can upload, only admins can read)
4. **File size limit**: 5 MB per file
5. **Allowed MIME types**:
   - `application/pdf`
   - `image/jpeg`
   - `image/png`
   - `application/msword`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Folder Structure

Create these virtual folders (they will be created automatically on first upload):
- `cv/` - CVs and resumes
- `certifications/` - Professional certifications
- `portfolio/` - Portfolio images and documents

### RLS Policies

**Policy 1: Authenticated users can upload**
```sql
CREATE POLICY "Authenticated users can upload job application documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-applications' AND
  (storage.foldername(name))[1] IN ('cv', 'certifications', 'portfolio')
);
```

**Policy 2: Admins can read**
```sql
CREATE POLICY "Admins can read all job application documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-applications' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**Policy 3: Users can read their own uploads (optional)**
```sql
CREATE POLICY "Users can read their own job application documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-applications' AND
  owner = auth.uid()
);
```

---

## 2. Create "contractor-portfolios" Bucket

### Steps (via Supabase Dashboard)

1. Navigate to **Storage** → **Create a new bucket**
2. **Bucket name**: `contractor-portfolios`
3. **Public bucket**: ✅ **Yes** (public read - anyone can view contractor portfolios)
4. **File size limit**: 10 MB per file
5. **Allowed MIME types**:
   - `image/jpeg`
   - `image/png`
   - `image/webp`
   - `image/heic`

### Folder Structure

Organized by contractor ID:
- `{contractor_id}/` - Each contractor has their own folder
  - `{contractor_id}/profile.jpg` - Profile photo
  - `{contractor_id}/work-1.jpg` - Portfolio work sample 1
  - `{contractor_id}/work-2.jpg` - Portfolio work sample 2
  - etc.

### RLS Policies

**Policy 1: Public read access**
```sql
CREATE POLICY "Anyone can view contractor portfolio images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contractor-portfolios');
```

**Policy 2: Contractors can upload to their own folder**
```sql
CREATE POLICY "Contractors can upload to their own portfolio folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contractor-portfolios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 3: Contractors can update their own files**
```sql
CREATE POLICY "Contractors can update their own portfolio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contractor-portfolios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 4: Contractors can delete their own files**
```sql
CREATE POLICY "Contractors can delete their own portfolio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contractor-portfolios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Alternative: Setup via Supabase CLI

If you prefer to setup storage buckets via CLI instead of Dashboard:

```bash
# Create job-applications bucket
supabase storage create job-applications --private

# Create contractor-portfolios bucket
supabase storage create contractor-portfolios --public

# Apply RLS policies (create .sql files with policies above and run)
supabase db push
```

---

## Verification

After setup, verify:

1. ✅ Both buckets appear in Supabase Dashboard → Storage
2. ✅ `job-applications` is marked as **Private**
3. ✅ `contractor-portfolios` is marked as **Public**
4. ✅ RLS policies are enabled and listed for each bucket
5. ✅ Test upload to `job-applications` as authenticated user (should succeed)
6. ✅ Test public read from `contractor-portfolios` (should succeed)

---

## Next Steps

Once storage buckets are configured:
1. Update `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Implement file upload utilities in `lib/supabase/storage-utils.ts`
3. Build application form Step 5 (document uploads)
