# Implementation Plan: Image Management System

**Branch**: `017-image-management` | **Date**: 2025-01-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-image-management/spec.md`

## Summary

This feature implements a comprehensive image management system for the Simone Paris platform, covering:
- **Service Images**: Admin/manager upload and organize images for services (coiffure, ongles, massage, etc.)
- **Product Images**: E-commerce product images (~500 products) with product variant support
- **User-Generated Content**: Clients upload photos in conversation threads with moderation workflow
- **Performance**: Lazy loading, CDN caching, responsive images, LCP < 2.5s
- **Accessibility**: Mandatory alt-text with AI-powered auto-generation (125 char limit, WCAG compliant)
- **Configuration**: Dynamic max file size (5MB default) and max images per entity (10 default) via platform_config

**Technical Approach**:
- Supabase Storage with separate buckets (service-images, product-images, conversation-attachments)
- Normalized database tables (service_images, product_images, product_variants, conversation_attachments)
- Next.js Image component for optimization with progressive fallback hierarchy
- OpenAI GPT-4 Vision API for alt-text generation
- Row Level Security (RLS) policies for permissions
- Soft delete pattern for recovery

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16, React 19
**Primary Dependencies**:
- @supabase/supabase-js (Supabase client)
- next (Next.js framework)
- react-dropzone (file upload UI)
- @tanstack/react-query (data fetching)
- zod (validation schemas)
- OpenAI API (alt-text generation - NEEDS CLARIFICATION: GPT-4 Vision vs alternatives)

**Storage**:
- PostgreSQL (Supabase) for metadata
- Supabase Storage for binary image files
- Bucket structure: service-images/, product-images/, conversation-attachments/

**Testing**:
- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests - NEEDS CLARIFICATION: coverage strategy)
- Manual QA for image quality/accessibility

**Target Platform**: Web (Next.js PWA), consumed by future native mobile apps via APIs

**Project Type**: Web application (Next.js full-stack)

**Performance Goals**:
- LCP (Largest Contentful Paint) < 2.5 seconds
- Image upload/processing < 5 seconds for 5MB file
- Lazy loading reduces initial load by 40%
- CDN cache hit rate > 85%

**Constraints**:
- Max file size: 5MB (configurable via platform_config)
- Max images per entity: 10 (configurable)
- Supported formats: JPEG, PNG, WebP only
- Alt-text max length: 125 characters (WCAG best practice)
- Storage quota monitoring (alert at 80%)

**Scale/Scope**:
- ~500 e-commerce products with variants
- ~8 services with images (priority)
- Approximately 50-100 UGC images per month initially
- Total: ~3500 product images + service images + UGC

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle 1: ID Strategy & Data Identity
- **Compliant**: Using BIGINT auto-increment IDs for all new tables (service_images.id, product_images.id)
- **Rationale**: Image metadata (display_order, timestamps) benefits from sequential IDs
- **Exception**: References to existing tables (profiles.id = UUID for auth sync) maintained

### ✅ Principle 2: Enum Strategy & Data Types
- **Compliant**: Using VARCHAR with CHECK constraints for moderation_status
- **Implementation**:
  ```sql
  moderation_status VARCHAR(50) CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
  ```
- **Benefit**: Easy to add new statuses (e.g., 'under_review') without ALTER TYPE migrations

### ✅ Principle 3: Database Naming & Documentation
- **Compliant**:
  - Table names: English, snake_case (`service_images`, `product_images`, `conversation_attachments`)
  - Column names: English, snake_case (`uploaded_by`, `file_size_bytes`, `alt_text`)
  - SQL comments: French for business context (to be added in migrations)
- **Example**:
  ```sql
  COMMENT ON COLUMN service_images.alt_text IS 'Texte alternatif pour accessibilité et SEO (max 125 caractères)';
  ```

### ✅ Principle 4: Security-First Architecture
- **Compliant**: RLS policies mandatory on all image tables
- **Implementation**:
  - Admins/managers: Full CRUD on service_images, product_images
  - Clients: Insert-only on conversation_attachments (own conversations)
  - Public: Read-only on approved images with proper joins
- **Audit**: All image operations logged (uploaded_by, moderated_by, timestamps)

### ✅ Principle 5: Premium User Experience
- **Compliant**:
  - Mobile-first responsive design
  - LCP < 2.5s target (< 3s constitution requirement)
  - Lazy loading for images below fold
  - Progressive Web App compatible
- **UX Enhancements**:
  - Drag-and-drop upload with react-dropzone
  - Elegant gradient placeholders for missing images
  - Image galleries with swipe support (mobile)

### ✅ Principle 6: Intelligent Booking System
- **Not Applicable**: This feature doesn't directly impact booking availability calculation
- **Integration Point**: UGC images in conversations may reference bookings (conversation_id → booking_id FK)

### ✅ Principle 12: Testing & Quality Assurance
- **Compliant**:
  - Reference existing CAHIER_RECETTE.md for test patterns
  - Test RLS policies (admin vs client permissions)
  - Performance testing (Lighthouse audits, image load times)
  - Accessibility audits (screen reader, WCAG AA)
- **Test Coverage**: Unit tests for upload logic, E2E for complete workflows

### ✅ Principle 13: Multilingual Architecture (i18n)
- **Compliant**:
  - Alt-text generation supports French (default), with future multi-language support
  - UI labels use next-intl for translations
  - Image metadata (filenames) language-agnostic
- **Future**: Alt-text could be generated in user's preferred language

### ⚠️ NEEDS RESEARCH: AI Service Selection
- **Question**: OpenAI GPT-4 Vision vs Google Cloud Vision vs AWS Rekognition?
- **Criteria**: Cost, French language quality, API latency, accuracy
- **Decision Point**: Phase 0 research

### ⚠️ NEEDS RESEARCH: Image Optimization Strategy
- **Question**: Use Supabase built-in transformation vs external service (Cloudinary, Imgix)?
- **Criteria**: Cost, performance, feature set (WebP conversion, resizing)
- **Decision Point**: Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/017-image-management/
├── spec.md              # Feature specification (✅ completed)
├── checklists/
│   └── requirements.md  # Quality validation (✅ completed - 100/100 score)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (next step)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Next.js Web Application Structure
app/
├── (authenticated)/
│   ├── admin/
│   │   ├── services/
│   │   │   └── [id]/
│   │   │       └── images/
│   │   │           └── page.tsx          # Service image management UI
│   │   ├── products/
│   │   │   └── [id]/
│   │   │       └── images/
│   │   │           └── page.tsx          # Product image management UI
│   │   └── moderation/
│   │       └── images/
│   │           └── page.tsx              # UGC moderation dashboard
│   └── booking/
│       └── [id]/
│           └── conversation/
│               └── page.tsx              # Client UGC upload (enhanced)

app/api/
├── images/
│   ├── upload/
│   │   └── route.ts                      # Image upload endpoint
│   ├── reorder/
│   │   └── route.ts                      # Reorder images endpoint
│   ├── delete/
│   │   └── route.ts                      # Soft delete endpoint
│   └── generate-alt-text/
│       └── route.ts                      # AI alt-text generation

components/
├── admin/
│   ├── ImageGalleryManager.tsx           # Admin image management component
│   ├── ImageUploadDropzone.tsx           # Drag-and-drop upload
│   ├── ImagePreviewCard.tsx              # Single image with actions
│   └── ModerationQueue.tsx               # UGC moderation UI
├── shared/
│   ├── OptimizedImage.tsx                # ✅ Already exists - reuse
│   └── ImageFallback.tsx                 # Progressive fallback logic
└── ui/
    └── [shadcn components]               # Button, Card, Dialog, etc.

hooks/
├── useImageUpload.ts                     # Upload logic with progress
├── useImageGallery.ts                    # Fetch/reorder/delete images
├── useAltTextGeneration.ts               # Generate alt-text via API
└── useModerationQueue.ts                 # Fetch UGC for moderation

lib/
├── validations/
│   └── image-schemas.ts                  # Zod schemas for validation
├── supabase/
│   └── image-storage.ts                  # Storage utility functions
└── ai/
    └── generate-alt-text.ts              # OpenAI API integration

supabase/
├── migrations/
│   ├── 20250111000030_create_service_images.sql
│   ├── 20250111000031_create_product_images.sql
│   ├── 20250111000032_create_product_variants.sql
│   ├── 20250111000033_create_conversation_attachments.sql
│   ├── 20250111000034_update_platform_config.sql
│   └── 20250111000035_create_image_rls_policies.sql
└── seed-default-config.sql               # Insert default config values

types/
└── database.ts                           # TypeScript types (regenerated)

__tests__/
├── unit/
│   ├── image-upload.test.ts
│   ├── image-validation.test.ts
│   └── alt-text-generation.test.ts
├── integration/
│   ├── image-gallery-api.test.ts
│   └── moderation-workflow.test.ts
└── e2e/
    ├── admin-service-images.spec.ts
    ├── admin-product-images.spec.ts
    └── client-ugc-upload.spec.ts
```

**Structure Decision**:
This is a full-stack Next.js web application following the existing project structure. Image management features integrate into existing admin routes and enhance booking/conversation pages with UGC upload. Supabase provides both database (metadata) and storage (binary files) in a unified backend.

## Complexity Tracking

> No constitution violations. All principles followed.

This section is empty - no complexity justifications needed.

---

## Next Steps

**Phase 0: Research & Technology Decisions**
1. Resolve "NEEDS CLARIFICATION" items:
   - AI service selection for alt-text generation
   - Image optimization/transformation strategy
   - E2E testing coverage approach
2. Document decisions in `research.md`
3. Evaluate cost/performance trade-offs

**Phase 1: Design & Contracts**
1. Generate `data-model.md` with complete database schema
2. Create API contracts in `contracts/` directory
3. Write `quickstart.md` for developer onboarding
4. Update `.claude/context.md` with new tech decisions

**Phase 2: Task Generation** (via `/speckit.tasks` command)
1. Break down implementation into dependency-ordered tasks
2. Each task with acceptance criteria and test requirements
3. Estimated timeline: 7-15 days (per spec)

**Gate Checkpoint**: Constitution check PASSED ✅ - Ready for Phase 0
