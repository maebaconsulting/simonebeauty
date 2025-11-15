# Quickstart: Image Management System

**Feature**: 017-image-management
**For**: Developers implementing or extending the image management feature
**Last Updated**: 2025-01-11

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Running the Dev Server](#running-the-dev-server)
6. [Common Use Cases](#common-use-cases)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ installed
- **pnpm** package manager (`npm install -g pnpm`)
- **Supabase CLI** (`brew install supabase/tap/supabase` on Mac)
- **PostgreSQL client** (psql) for database operations
- **Git** (obviously!)
- **OpenAI API Key** (for alt-text generation)

---

## Local Setup

### 1. Clone and Install

```bash
# Navigate to project root
cd /path/to/simone-platform

# Install dependencies
pnpm install

# Verify Next.js and Supabase are installed
pnpm list next @supabase/supabase-js
```

### 2. Checkout Feature Branch

```bash
# Fetch latest
git fetch --all

# Checkout image management branch
git checkout 017-image-management

# Verify you're on the right branch
git branch --show-current
# Should output: 017-image-management
```

---

## Database Setup

### 1. Run Migrations

The image management feature requires 6 new migrations:

```bash
# Option A: Using psql directly (production/staging)
PGPASSWORD='your-password' psql \
  -h db.xpntvajwrjuvsqsmizzb.supabase.co \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20250111000030_create_service_images.sql

# Repeat for migrations 31-35...

# Option B: Using Supabase CLI (local dev)
supabase db push
```

**Migrations to run (in order)**:
1. `20250111000030_create_service_images.sql`
2. `20250111000031_create_product_images.sql`
3. `20250111000032_create_product_variants.sql`
4. `20250111000033_create_conversation_attachments.sql`
5. `20250111000034_update_platform_config.sql`
6. `20250111000035_create_image_rls_policies.sql`

### 2. Verify Migrations

```bash
# Check tables exist
psql -h <host> -U postgres -d postgres -c "\dt *images*"

# Should see:
# - service_images
# - product_images
# - product_variants
# - conversation_attachments

# Check platform_config values
psql -h <host> -U postgres -d postgres -c "
  SELECT config_key, config_value FROM platform_config
  WHERE config_key LIKE '%image%' OR config_key LIKE '%file%';
"
```

### 3. Create Storage Buckets

```bash
# Via Supabase Dashboard:
# 1. Go to Storage → Create bucket
# 2. Create 3 buckets:
#    - service-images (public)
#    - product-images (public)
#    - conversation-attachments (public with RLS)

# OR via SQL:
psql -h <host> -U postgres -d postgres -c "
  INSERT INTO storage.buckets (id, name, public)
  VALUES
    ('service-images', 'service-images', true),
    ('product-images', 'product-images', true),
    ('conversation-attachments', 'conversation-attachments', true)
  ON CONFLICT (id) DO NOTHING;
"
```

---

## Environment Variables

Add these to your `.env.local` file:

```env
# Existing Supabase config (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# New: OpenAI for alt-text generation
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: Override default config
MAX_FILE_SIZE_MB=5
MAX_IMAGES_PER_ENTITY=10
```

**Security Note**: Never commit `.env.local` to Git! It's already in `.gitignore`.

---

## Running the Dev Server

```bash
# Start Next.js dev server
pnpm dev

# Server starts on http://localhost:3000
# Hot reload enabled
```

### Verify Installation

1. **Admin Upload Test**:
   - Navigate to http://localhost:3000/login
   - Login as admin (`admin@simone.paris`)
   - Go to `/admin/services/4/images` (Service ID: 4 = COIFFURE)
   - You should see image upload UI

2. **API Endpoint Test**:
   ```bash
   # Test upload endpoint (requires auth token)
   curl -X POST http://localhost:3000/api/images/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@test-image.jpg" \
     -F "entityType=service" \
     -F "entityId=4"
   ```

---

## Common Use Cases

### Use Case 1: Upload Service Image (Admin)

**UI Flow**:
```typescript
// components/admin/ImageGalleryManager.tsx
import { useImageUpload } from '@/hooks/useImageUpload'

function ServiceImageManager({ serviceId }: { serviceId: number }) {
  const { upload, isUploading, progress } = useImageUpload()

  const handleUpload = async (file: File) => {
    const result = await upload({
      file,
      entityType: 'service',
      entityId: serviceId,
      isPrimary: false
    })

    if (result.success) {
      toast.success('Image uploadée!')
    }
  }

  return (
    <Dropzone onDrop={handleUpload}>
      {isUploading && <ProgressBar value={progress} />}
    </Dropzone>
  )
}
```

**API Call**:
```typescript
// hooks/useImageUpload.ts
const formData = new FormData()
formData.append('file', file)
formData.append('entityType', 'service')
formData.append('entityId', serviceId.toString())

const response = await fetch('/api/images/upload', {
  method: 'POST',
  body: formData,
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})
```

### Use Case 2: Generate Alt-Text with AI

```typescript
// hooks/useAltTextGeneration.ts
import { useMutation } from '@tanstack/react-query'

export function useAltTextGeneration() {
  return useMutation({
    mutationFn: async ({ imageId, entityType }: {
      imageId: number
      entityType: string
    }) => {
      const response = await fetch('/api/images/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, entityType, saveToDatabase: true })
      })
      return response.json()
    }
  })
}

// Usage in component
const { mutate: generateAltText } = useAltTextGeneration()

<Button onClick={() => generateAltText({ imageId: 123, entityType: 'product' })}>
  Générer alt-text
</Button>
```

### Use Case 3: Moderate UGC Image

```typescript
// components/admin/ModerationQueue.tsx
const { mutate: moderate } = useMutation({
  mutationFn: async ({ attachmentId, status, reason }: {
    attachmentId: number
    status: 'approved' | 'rejected'
    reason?: string
  }) => {
    const response = await fetch('/api/images/moderate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachmentId, status, reason })
    })
    return response.json()
  }
})

// Usage
<Button onClick={() => moderate({
  attachmentId: 789,
  status: 'rejected',
  reason: 'Contenu inapproprié'
})}>
  Rejeter
</Button>
```

### Use Case 4: Display Optimized Images

```typescript
// Use existing OptimizedImage component
import { OptimizedImage } from '@/components/shared/OptimizedImage'

<OptimizedImage
  product={product}
  alt={product.name}
  aspectRatio="landscape"
  priority={false}
  className="rounded-lg"
/>

// Component handles:
// - Progressive fallback (primary → secondary → service icon → placeholder)
// - Lazy loading
// - Responsive sizing
// - WebP optimization via Supabase transformations
```

---

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run image-related tests only
pnpm test image

# Watch mode
pnpm test:watch
```

**Key Test Files**:
- `__tests__/unit/image-upload.test.ts` - Upload validation logic
- `__tests__/unit/image-validation.test.ts` - File format/size checks
- `__tests__/unit/alt-text-generation.test.ts` - AI integration

### Integration Tests

```bash
# Run integration tests (requires test database)
pnpm test:integration
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
pnpm test:e2e

# Run specific test
pnpm test:e2e admin-service-images
```

**E2E Test Files**:
- `__tests__/e2e/admin-service-images.spec.ts`
- `__tests__/e2e/admin-product-images.spec.ts`
- `__tests__/e2e/client-ugc-upload.spec.ts`

### Manual QA Checklist

- [ ] Upload JPEG, PNG, WebP images successfully
- [ ] Reject PDF, SVG, GIF formats with error message
- [ ] Reject files > 5MB with error message
- [ ] Verify 11th image triggers "max limit" error
- [ ] Drag-and-drop reorder saves correctly
- [ ] Alt-text generation returns French description < 125 chars
- [ ] Deleted images show placeholder on public pages
- [ ] UGC moderation sends notification to user on rejection
- [ ] Mobile: Swipe gallery navigation works
- [ ] Accessibility: Screen reader reads alt-text

---

## Troubleshooting

### Issue: "File too large" error but file is < 5MB

**Cause**: Next.js body size limit (default 4MB)

**Fix**: Update `next.config.mjs`:
```javascript
export default {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Increase to 10MB
    }
  }
}
```

### Issue: OpenAI API returns "Invalid API key"

**Cause**: Missing or incorrect `OPENAI_API_KEY`

**Fix**:
1. Verify key in `.env.local`
2. Check key is not expired on OpenAI dashboard
3. Restart dev server after updating env vars

### Issue: Images not appearing on public pages

**Possible Causes**:
1. **RLS Policy Issue**: Check policies allow public SELECT
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'service_images';
   ```

2. **Bucket Not Public**: Verify bucket is public in Supabase dashboard

3. **Deleted Image**: Check `deleted_at IS NULL`
   ```sql
   SELECT id, storage_path, deleted_at
   FROM service_images
   WHERE service_id = 4;
   ```

### Issue: "Rate limit exceeded" from OpenAI

**Cause**: Hitting OpenAI API limits (500 req/min)

**Fix**:
1. Implement request queuing with delay
2. Cache generated alt-text aggressively
3. Consider upgrading OpenAI plan

### Issue: TypeScript errors after migrations

**Cause**: `types/database.ts` out of sync with database schema

**Fix**:
```bash
# Regenerate TypeScript types from Supabase
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

---

## Next Steps

After completing this quickstart:

1. **Read the Spec**: [spec.md](./spec.md) for complete requirements
2. **Review Data Model**: [data-model.md](./data-model.md) for database schema
3. **Check API Contracts**: `contracts/` for endpoint definitions
4. **Implement Tasks**: Follow [tasks.md](./tasks.md) (generated via `/speckit.tasks`)

## Support

- **Documentation**: All docs in `specs/017-image-management/`
- **Constitution**: `.specify/memory/constitution.md` for project rules
- **Issues**: Report bugs on GitHub or Slack #dev-simone

---

**Happy Coding!** 🚀
