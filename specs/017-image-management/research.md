# Research & Technology Decisions: Image Management System

**Feature**: 017-image-management
**Date**: 2025-01-11
**Status**: Completed

## Overview

This document resolves all "NEEDS CLARIFICATION" items from [plan.md](./plan.md) through research and decision-making. Each decision is documented with rationale, alternatives considered, and implementation notes.

---

## Decision 1: AI Service for Alt-Text Generation

### Question
Which AI service should we use for automatic alt-text generation: OpenAI GPT-4 Vision, Google Cloud Vision, or AWS Rekognition?

### Research Summary

#### Option A: OpenAI GPT-4 Vision
**Pros:**
- Excellent natural language generation in French
- Can generate contextual descriptions (not just object labels)
- Understands business context (e.g., "Service de massage bien-être à domicile - Simone Paris")
- Strong at generating alt-text within 125 character limit
- API simple and well-documented

**Cons:**
- Higher cost: $0.00765 per image (with 1024 context)
- Requires OpenAI API key management
- Rate limits: 500 requests/minute (sufficient for our scale)

**Cost Estimate:**
- Initial: ~3500 product images + service images = ~$27
- Monthly: ~100 UGC images = $0.77/month
- Total Year 1: ~$36

#### Option B: Google Cloud Vision API
**Pros:**
- Lower cost: $1.50 per 1000 images = $0.0015 per image
- Excellent object detection and label accuracy
- Good multi-language support including French
- Integrated with Google Cloud ecosystem

**Cons:**
- Labels are simple (e.g., "hair", "nail polish") not full sentences
- Requires additional NLP to generate natural French sentences
- More complex setup (Google Cloud project, service accounts)
- Need to build custom prompt templates to format labels as alt-text

**Cost Estimate:**
- Initial: 3500 images × $0.0015 = $5.25
- Monthly: 100 × $0.0015 = $0.15/month
- Total Year 1: $7.05

#### Option C: AWS Rekognition
**Pros:**
- Comprehensive image analysis features
- Good object detection
- Competitive pricing: $1.00 per 1000 images

**Cons:**
- Similar to Google Cloud Vision - labels only, not natural language
- Requires AWS account and IAM setup
- French language support less mature
- Additional complexity with AWS SDK

### Decision

**✅ SELECTED: OpenAI GPT-4 Vision**

**Rationale:**
1. **Quality First**: Natural French descriptions are critical for accessibility and SEO - OpenAI excels at this
2. **Contextual Understanding**: Can incorporate product names, service types, brand identity ("Simone Paris")
3. **Developer Experience**: Simple API, easy to implement and maintain
4. **Cost Acceptable**: ~$36/year is negligible compared to development time savings
5. **Future-Ready**: GPT-4 Vision can handle edge cases (e.g., products with text, complex scenes)

**Alternatives Considered:**
- Google Cloud Vision: Rejected due to need for additional NLP layer to generate natural sentences
- AWS Rekognition: Rejected due to weaker French language support and added AWS complexity

**Implementation Notes:**
```typescript
// lib/ai/generate-alt-text.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateAltText(
  imageUrl: string,
  context: {
    entityType: 'service' | 'product' | 'ugc'
    entityName?: string
    category?: string
  }
): Promise<string> {
  const contextPrompt = buildContextPrompt(context)

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${contextPrompt}\n\nGénère un texte alternatif en français pour cette image. Maximum 125 caractères. Focuse-toi sur l'accessibilité et le SEO. Termine par " - Simone Paris".`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    max_tokens: 100
  })

  const altText = response.choices[0].message.content
  return altText.substring(0, 125) // Enforce 125 char limit
}
```

**Fallback Strategy:**
- If OpenAI API fails → Use entity name + category (e.g., "Service de coiffure - Simone Paris")
- If generation exceeds 125 chars → Truncate intelligently at last word boundary
- Log all failures for manual review

---

## Decision 2: Image Optimization Strategy

### Question
Should we use Supabase's built-in image transformation or an external service like Cloudinary or Imgix?

### Research Summary

#### Option A: Supabase Storage Transformations
**Pros:**
- Native integration - no additional service
- Transformation parameters in URL (width, height, quality, format)
- No additional cost for basic transformations
- Simple CDN caching with Supabase edge network
- Example: `/storage/v1/render/image/public/bucket/image.jpg?width=800&quality=85`

**Cons:**
- Limited advanced features (no smart crop, art direction)
- Transformation happens on-demand (first request slower)
- Less mature than dedicated image CDNs
- No automatic format negotiation (WebP vs JPEG based on browser)

**Cost:**
- Included in Supabase plan ($25/month Pro tier)
- Bandwidth: First 250GB included, then $0.09/GB

#### Option B: Cloudinary
**Pros:**
- Industry-leading image CDN
- Automatic format optimization (WebP, AVIF)
- Smart crop, face detection, responsive breakpoints
- Excellent performance and global CDN
- Generous free tier: 25GB storage, 25GB bandwidth/month

**Cons:**
- Additional service to manage
- Complexity: Need to upload to both Supabase (backup) and Cloudinary (serving)
- Vendor lock-in risk
- Pricing scales quickly: $89/month for 75GB bandwidth

**Cost:**
- Free tier sufficient for MVP (25GB bandwidth = ~30k image loads)
- Year 1: Likely stay on free tier
- Year 2: May need $89/month plan

#### Option C: Imgix
**Pros:**
- Similar to Cloudinary with excellent performance
- Powerful URL-based transformations
- Real-time image rendering
- Good documentation

**Cons:**
- More expensive: Starts at $79/month (10k origin images)
- Requires separate CDN setup
- Overkill for our initial scale

### Decision

**✅ SELECTED: Supabase Storage Transformations (Hybrid Approach)**

**Rationale:**
1. **Simplicity**: Single storage backend, no additional service integration
2. **Cost-Effective**: Included in existing Supabase plan ($25/month)
3. **Sufficient for MVP**: Basic transformations (resize, quality, format) meet 90% of needs
4. **Progressive Enhancement Path**: Can add Cloudinary later if performance demands it
5. **Developer Experience**: Transformation URLs are simple and predictable

**Alternatives Considered:**
- Cloudinary: Rejected for MVP (over-engineering), but remains option for future if CDN performance becomes critical
- Imgix: Rejected due to cost and complexity for initial scale

**Implementation Approach:**

```typescript
// lib/supabase/image-storage.ts
export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  } = {}
): string {
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

  // Use render endpoint for transformations
  const params = new URLSearchParams()
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.quality) params.set('quality', options.quality.toString())
  if (options.format) params.set('format', options.format)

  return params.toString()
    ? `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}?${params}`
    : baseUrl
}

// Usage in components
<Image
  src={getOptimizedImageUrl('product-images', image.storage_path, {
    width: 800,
    quality: 85,
    format: 'webp'
  })}
  alt={image.alt_text}
  width={800}
  height={600}
/>
```

**Responsive Image Strategy:**
```typescript
// Generate srcset for responsive images
export function generateResponsiveSrcSet(
  bucket: string,
  path: string
): string {
  const widths = [400, 800, 1200, 1600]
  return widths
    .map(w => `${getOptimizedImageUrl(bucket, path, { width: w, format: 'webp' })} ${w}w`)
    .join(', ')
}
```

**Browser Fallback:**
- Primary: WebP format (smaller size, good compression)
- Fallback: Use Next.js Image component's automatic fallback to JPEG/PNG for older browsers
- No need for manual `<picture>` tags - Next.js handles it

**Performance Targets with this approach:**
- LCP: < 2.5s (✅ achievable with Supabase edge network + lazy loading)
- CDN Cache Hit Rate: > 85% (✅ Supabase CDN caching headers)
- Image Size Reduction: 40-60% with WebP vs JPEG (✅ format transformation)

**Future Migration Path (if needed):**
- If CDN performance becomes bottleneck (Year 2+)
- Migrate to Cloudinary with Supabase as backup/source
- Migration script: Sync Supabase storage → Cloudinary
- Update URLs in database (single migration)
- Estimated effort: 2-3 days

---

## Decision 3: E2E Testing Coverage Strategy

### Question
What should be the E2E testing coverage approach for image management features?

### Research Summary

**Current Stack:**
- Playwright for E2E tests
- Existing pattern in project for critical flows

**Key Workflows to Test:**
1. Admin uploads service images
2. Admin manages product images with variants
3. Client uploads UGC in conversations
4. Admin moderates UGC
5. Image display and fallback behavior

### Decision

**✅ SELECTED: Critical Path E2E + Manual QA for Visual Quality**

**Test Coverage Strategy:**

#### Tier 1: E2E Tests (Playwright) - Automated
Focus on critical user journeys (P1 user stories):

1. **admin-service-images.spec.ts** (Priority: High)
   - Login as admin
   - Navigate to service edit page
   - Upload 3 images (JPEG, PNG, WebP)
   - Reorder images via drag-and-drop
   - Set image as primary
   - Verify images display on public service page
   - Delete one image
   - Verify soft delete (still in database)

2. **admin-product-images.spec.ts** (Priority: High)
   - Login as admin
   - Create product with 2 variants (color: red, blue)
   - Upload variant-specific images
   - Switch variant on product page
   - Verify correct images display per variant
   - Test max 10 images limit (upload 11th → error)

3. **client-ugc-upload.spec.ts** (Priority: Medium)
   - Login as client
   - Navigate to active booking conversation
   - Upload 2 photos
   - Verify photos appear in conversation thread
   - Test file size limit (upload 8MB → error)
   - Test format validation (upload PDF → error)

**Implementation Example:**
```typescript
// __tests__/e2e/admin-service-images.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Admin Service Images', () => {
  test('should upload and manage service images', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@simone.paris')
    await page.fill('[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')

    // Navigate to service edit
    await page.goto('/admin/services/4/images') // Service ID: 4 (COIFFURE)

    // Upload image
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./test-fixtures/coiffure-test.jpg')

    // Wait for upload success
    await expect(page.locator('text=Image uploadée avec succès')).toBeVisible()

    // Verify image appears in gallery
    const gallery = page.locator('[data-testid="image-gallery"]')
    await expect(gallery.locator('img').first()).toBeVisible()

    // Test reordering (drag position 3 to position 1)
    const images = gallery.locator('[data-testid="image-card"]')
    await images.nth(2).dragTo(images.first())

    // Verify order saved (check data-order attribute)
    await expect(images.first()).toHaveAttribute('data-order', '1')
  })

  test('should reject oversized files', async ({ page }) => {
    // ... setup ...

    // Attempt to upload 8MB file
    await fileInput.setInputFiles('./test-fixtures/large-image-8mb.jpg')

    // Verify error message
    await expect(page.locator('text=Fichier trop volumineux (max 5MB)')).toBeVisible()
  })
})
```

#### Tier 2: Integration Tests - Automated
API endpoint testing:

1. **image-gallery-api.test.ts**
   - Test /api/images/upload endpoint
   - Test authentication & authorization
   - Test validation (file size, format)
   - Test RLS policies (admin vs client)

2. **moderation-workflow.test.ts**
   - Test UGC moderation flow
   - Test status transitions (pending → approved/rejected)
   - Test notifications on moderation actions

#### Tier 3: Manual QA - Human Review
Visual quality and accessibility:

1. **Image Quality Checklist**
   - Verify images display correctly across devices (desktop, tablet, mobile)
   - Check image sharpness and compression quality
   - Test lazy loading behavior (scroll performance)
   - Verify placeholder fallbacks for missing images

2. **Accessibility Checklist**
   - Screen reader testing (VoiceOver, NVDA)
   - Verify alt-text is present and descriptive
   - Check keyboard navigation in image galleries
   - Verify color contrast on image overlays
   - Run Lighthouse accessibility audit (target: >90 score)

3. **Performance Checklist**
   - Lighthouse performance audit (target LCP < 2.5s)
   - Network throttling test (3G connection)
   - Monitor CDN cache hit rate in production

**Test Data Strategy:**
- Fixtures: Store test images (various sizes, formats) in `__tests__/fixtures/`
- Seed Data: Pre-populate test database with services, products, users
- Cleanup: Use Playwright's afterEach hook to delete test images
- Isolation: Each test uses unique service/product IDs

**CI/CD Integration:**
```yaml
# .github/workflows/test-images.yml
name: Image Management Tests

on: [pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:images
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
          TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
```

**Coverage Target:**
- E2E: 3 critical workflows (80% of user journeys)
- Integration: All API endpoints (100% of /api/images/*)
- Manual QA: Before each release (visual + accessibility)
- Estimated Test Execution Time: ~10 minutes

**Rationale:**
- Balance automation with pragmatic manual QA
- Focus E2E on critical paths to avoid brittle tests
- Manual QA essential for visual quality (automated tests can't judge image aesthetics)
- Performance testing via Lighthouse automation

---

## Summary of Decisions

| Decision | Selected | Rationale | Status |
|----------|----------|-----------|--------|
| **AI Service** | OpenAI GPT-4 Vision | Best French language quality, natural descriptions, simple API | ✅ Ready |
| **Image Optimization** | Supabase Storage Transformations | Native integration, cost-effective, sufficient for MVP | ✅ Ready |
| **E2E Testing** | Critical Path E2E + Manual QA | Balanced automation coverage, focus on user journeys | ✅ Ready |

## Implementation Checklist

- [x] Research AI services for alt-text generation
- [x] Research image optimization strategies
- [x] Define E2E testing approach
- [ ] Set up OpenAI API key in environment variables
- [ ] Create test fixtures for E2E tests
- [ ] Document Supabase transformation URL patterns
- [ ] Create Playwright test suite structure

## Next Phase

All NEEDS CLARIFICATION items resolved. Proceeding to **Phase 1: Design & Contracts**:
1. Generate `data-model.md` with complete database schema
2. Create API contracts in `contracts/` directory
3. Write `quickstart.md` for developer onboarding

---

**Completed**: 2025-01-11
**Reviewed By**: Development Team
**Approved**: Ready for Phase 1
