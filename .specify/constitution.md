# Project Constitution - Simone Paris Platform

## Project Overview
Simone is a premium SaaS platform designed to orchestrate home wellness service management. It connects clients (B2C and B2B) with professional service providers through an intelligent booking system while providing comprehensive management tools for administrators.

## Core Principles

### 1. ID Strategy & Data Identity
**Principle:** Favor numeric auto-increment IDs over UUIDs for better readability, performance, and developer experience.

**Guidelines:**
- **Default Choice:** Use BIGINT auto-increment IDs as primary keys for all business entities
- **UUID Only When Necessary:** Reserve UUIDs for:
  - User authentication integration (syncing with Supabase auth.users.id)
  - External system integrations requiring globally unique identifiers
  - Distributed systems where auto-increment won't work
  - Public-facing identifiers that must be non-sequential for security

**Examples:**
```sql
-- ✅ PREFERRED: Auto-increment for business entities
CREATE TABLE contractors (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  profile_uuid UUID REFERENCES profiles(id),
  ...
);

CREATE TABLE reservations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id UUID REFERENCES profiles(id),
  contractor_id BIGINT REFERENCES contractors(id),
  ...
);

-- ✅ ACCEPTABLE: UUID only for auth sync
CREATE TABLE profiles (
  id UUID PRIMARY KEY,  -- Synced with auth.users
  ...
);

-- ❌ AVOID: Unnecessary UUID usage
CREATE TABLE products (
  id UUID PRIMARY KEY,  -- Should be BIGINT
  ...
);
```

### 2. Enum Strategy & Data Types
**Principle:** Avoid PostgreSQL ENUMs in favor of VARCHAR with CHECK constraints for flexibility and maintainability.

**Guidelines:**
- **Never use PostgreSQL ENUM types** - They are difficult to modify (require migrations, can't easily add/remove values)
- **Use VARCHAR with CHECK constraints instead** for validated string columns
- **Store status/type values as strings** with application-level validation
- **Document valid values** in comments or application code

**Examples:**
```sql
-- ✅ PREFERRED: VARCHAR with CHECK constraint
CREATE TABLE bookings (
  id BIGINT PRIMARY KEY,
  status VARCHAR(50) CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  ...
);

-- ✅ PREFERRED: Easy to add new status values
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'in_progress'));

-- ❌ AVOID: PostgreSQL ENUM
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TABLE bookings (
  status booking_status,  -- Difficult to modify later
  ...
);
```

**Rationale:**
- Easy to add/remove values without complex ALTER TYPE migrations
- Better compatibility with ORMs and application code
- Simpler schema evolution and refactoring
- No enum dependency management issues
- Clearer error messages when constraints are violated

### 3. Database Naming & Documentation
**Principle:** Use English for all database identifiers, French for documentation and comments.

**Guidelines:**
- **Table Names:** English, snake_case (e.g., `contractor_profiles`, `booking_sessions`)
- **Column Names:** English, snake_case (e.g., `created_at`, `is_active`, `stripe_customer_id`)
- **SQL Comments:** French, mandatory for columns requiring explanation
- **Application UI:** French by default (labels, messages, content)
- **Code Comments:** French for business logic, English acceptable for technical implementation

**Examples:**
```sql
-- ✅ PREFERRED: English names, French comments
CREATE TABLE contractor_profiles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id UUID REFERENCES contractors(id),
  slug VARCHAR(50) UNIQUE NOT NULL,
  slug_changes_count INT DEFAULT 0,
  slug_last_changed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractor_profiles IS 'Profils professionnels des prestataires avec informations publiques';
COMMENT ON COLUMN contractor_profiles.slug IS 'Identifiant unique pour URL de réservation personnalisée (ex: marie-dupont-massage)';
COMMENT ON COLUMN contractor_profiles.slug_changes_count IS 'Nombre de modifications du slug (limité à 3 par an)';
COMMENT ON COLUMN contractor_profiles.slug_last_changed_at IS 'Date de la dernière modification du slug pour calculer la limite annuelle';

-- ❌ AVOID: French table/column names
CREATE TABLE profils_prestataires (
  id BIGINT PRIMARY KEY,
  nom_slug VARCHAR(50),
  nombre_changements_slug INT,
  ...
);
```

**Rationale:**
- English identifiers ensure compatibility with international tools and developers
- French comments maintain business context for French-speaking team
- Consistent with industry standards while preserving domain knowledge
- Easier for mobile team (potentially international) to consume APIs

### 4. Security-First Architecture
**Principle:** Security is non-negotiable and built into the data layer.

**Guidelines:**
- Enable Row Level Security (RLS) on ALL tables by default
- Implement "zero trust" principle: explicit permissions only
- Validate all inputs on both client and server side
- Never expose sensitive API keys to the client
- Use JWT tokens for authentication (managed by Supabase Auth)

### 5. Premium User Experience
**Principle:** Every interaction reflects quality, simplicity, and luxury.

**Guidelines:**
- Mobile-first responsive design
- Maximum 3-second initial load time
- API responses under 1 second
- Eliminate friction in the booking flow
- Progressive Web App (PWA) capabilities for web
- Native mobile apps (iOS/Android) developed by separate team
- Consistent design system using Tailwind CSS and shadcn/ui

### 6. Intelligent Booking System
**Principle:** Only offer feasible time slots by integrating complex real-world constraints.

**Guidelines:**
- Calculate availability dynamically, not statically
- Integrate all constraints:
  - Provider work schedules
  - Existing bookings
  - Unavailabilities (manual + synced calendars)
  - Travel time between appointments
  - Preparation buffer time
- Optimize provider routes and maximize daily capacity
- Minimize no-shows and delays

### 7. Data Migration Strategy
**Principle:** Migrate from legacy to new systems progressively without disruption.

**Current Migration:**
- **Legacy System:** `reservations`, `easy_*` tables
- **New System:** `appointment_*` tables (bookings, contractor_schedules, unavailabilities)

**Migration Phases:**
1. Create new table structure
2. Migrate existing data
3. Update Edge Functions progressively
4. Deprecate and remove legacy tables

### 8. API-First Backend
**Principle:** Business logic lives in serverless Edge Functions (Deno).

**Guidelines:**
- Organize functions by domain (auth, bookings, payments, communication)
- Keep functions focused and single-purpose
- Use TypeScript for type safety
- Handle errors gracefully with clear messages
- Log all critical operations for debugging

### 9. Payment Flow Integrity
**Principle:** Pre-authorize first, capture later. Never charge without service confirmation.

**Flow:**
1. Create Stripe PaymentIntent with `capture_method: manual`
2. Pre-authorize amount on client card
3. Wait for provider confirmation or service completion
4. Capture payment automatically
5. Calculate and transfer commission via Stripe Connect

**Cancellation Policy (automated):**
- \>48h before: 100% refund
- 24-48h before: 70% refund
- <24h before: 50% refund

### 10. Multi-Role Architecture
**Principle:** Each user type has a distinct interface optimized for their needs.

**User Types:**
- **Client (Individual):** Browse, book, pay, manage profile
- **Client (B2B):** Dedicated services, negotiated rates, corporate gift cards
- **Provider (Contractor):** Manage profile, availability, bookings, earnings
- **Admin/Manager:** Full platform oversight and configuration
- **Staff:** Limited permissions for specific support tasks

### 11. Accessibility & Inclusion
**Principle:** Platform must be usable by everyone.

**Standards:**
- WCAG AA compliance minimum
- Keyboard navigation on all interactive elements
- Sufficient color contrast
- Semantic HTML and ARIA labels
- Screen reader compatibility

### 12. Testing & Quality Assurance
**Principle:** Features are only complete when tested and validated.

**Guidelines:**
- Reference CAHIER_RECETTE.md (150+ test cases) for acceptance criteria
- Test at multiple levels: unit, integration, E2E
- Validate security policies (RLS)
- Performance testing (load times, API responses)
- Accessibility audits

### 13. Multilingual Architecture (i18n)
**Principle:** Platform supports multiple languages with centralized translation management.

**Supported Markets:**
- 🇫🇷 France (French - default)
- 🇪🇸 Spain (Spanish)
- 🇧🇪 Belgium (French, Dutch)
- 🇩🇪 Germany (German)
- 🇨🇭 Switzerland (French, German, Italian)
- Additional markets as platform expands

**Guidelines:**
- All user-facing content MUST be translatable
- Use centralized `translations` table for database content
- Use next-intl library for UI strings
- Language codes follow ISO 639-1 (2-letter: 'fr', 'es', 'de', 'nl', 'it')
- Always provide French fallback (default language)
- Never hardcode user-facing text in code or migrations

**Architecture:**
- User-facing content tables use technical keys (e.g., `name_key = 'haircare'`)
- Translations stored in centralized `translations` table with schema:
  - `entity_type` (e.g., 'service_category', 'specialty')
  - `entity_id` (FK to source table)
  - `field_name` (e.g., 'name', 'description')
  - `language_code` (e.g., 'fr', 'es')
  - `value` (translated text)
- Auto-detect user language (browser headers, geolocation)
- Allow manual language selection stored in user preferences
- Single URL with automatic detection (not `/fr/`, `/es/` URL paths)

**Content Management:**
- Google Translate API for MVP translations (automated, cost-effective)
- Admin interface for reviewing and editing translations
- JSON file import/export for professional translation workflow
- Version control for translation files

### 14. Data Integrity - Specialty-Category Alignment
**Principle:** Specialties must be formally linked to service categories via foreign keys.

**Rule:** The `specialties` table MUST reference `service_categories` via FK relationship.

**Rationale:**
- Ensures contractors select specialties aligned with available services
- Simplifies service-contractor matching logic (JOIN instead of text comparison)
- Prevents data inconsistencies between specialties and categories
- Enables dynamic UI generation (group specialties by category)
- Supports multilingual category/specialty names via shared translation system

**Implementation:**
- Add `category_id BIGINT REFERENCES service_categories(id)` to `specialties` table
- Migrate existing text-based `category` column data to FK references
- Maintain backward compatibility during transition with dual columns
- Eventually deprecate text `category` column once migration validated

## SpecKit Development Workflow

**Principle:** All features follow a specification-driven development process.

**Workflow Steps:**
1. **Specify:** Create feature specification in `specs/{feature-id}/spec.md`
   - Define user stories, requirements, acceptance criteria
   - Document database schema changes
   - Identify API endpoints and UI components
2. **Plan:** Generate implementation plan using `/speckit.plan {feature-id}`
   - Breaks down spec into actionable tasks
   - Identifies dependencies and sequencing
   - Generates questions for clarification
3. **Clarify:** Use `/speckit.clarify {feature-id}` to resolve ambiguities
   - AI asks targeted questions about underspecified areas
   - Answers encoded back into spec for future reference
4. **Tasks:** Generate task list using `/speckit.tasks {feature-id}`
   - Creates dependency-ordered tasks in `specs/{feature-id}/tasks.md`
   - Each task includes acceptance criteria and test requirements
5. **Implement:** Execute tasks using `/speckit.implement {feature-id}`
   - Systematic implementation following task order
   - Continuous testing and validation
   - Documentation updates alongside code
6. **Analyze:** Run `/speckit.analyze {feature-id}` post-implementation
   - Cross-artifact consistency check (spec ↔ plan ↔ tasks)
   - Quality analysis of deliverables
   - Identifies gaps or deviations

**Constitution Integration:**
- SpecKit reads from `.specify/memory/constitution.md`
- All generated plans/tasks must comply with constitutional principles
- Violations flagged during analysis phase
- Constitution versioned alongside codebase

## Technology Stack

### Frontend
- Next.js 16 (React framework)
- React 19
- TypeScript
- TanStack Query (data fetching)
- Tailwind CSS v4
- shadcn/ui (component library)
- Lucide React (icons)
- next-themes (dark mode)

### Backend
- Supabase (PostgreSQL database)
- Supabase Auth (JWT authentication)
- Supabase Storage
- Supabase Realtime
- Edge Functions (Deno runtime)

### Integrations
- **Payments:** Stripe, Stripe Connect
- **Maps:** Google Maps API (Places, Geocoding, Distance Matrix)
- **Email:** Resend
- **SMS:** Twilio / Vonage
- **Analytics:** (to be defined)

### Design System
- **Typography:** Playfair Display (headings), DM Sans / Inter (body)
- **Color System:** HSL-based CSS tokens for light/dark themes
- **Primary Color:** Coral #dd6055
- **Spacing:** Tailwind default scale
- **Border Radius:** 8px default (--radius: 0.5rem)

## Development Conventions

### Naming Conventions
- **Components:** PascalCase (`UserProfile.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`)
- **Utils:** camelCase (`formatDate.ts`)
- **Database Tables:** English, snake_case (`appointment_bookings`, `contractor_profiles`)
- **Database Columns:** English, snake_case (`created_at`, `stripe_customer_id`, `is_active`)
- **Database Comments:** French, mandatory for business-critical columns
- **CSS Classes:** kebab-case or Tailwind utilities
- **UI Labels/Content:** French (default language)

### File Structure
```
src/
├── components/
│   ├── ui/              # Shadcn components
│   ├── mobile/          # Mobile-specific components
│   └── [feature]/       # Business logic components
├── hooks/
├── utils/
├── pages/
└── lib/
```

### Code Quality
- Use TypeScript strict mode
- Validate with Zod schemas
- Format with Prettier
- Lint with ESLint
- No console errors/warnings in production

## Performance Targets

- **Initial Load:** < 3 seconds
- **API Response:** < 1 second
- **Uptime:** > 99.9%
- **Lighthouse Score:** > 90 (all categories)

## B2B Features

### Dedicated Services
- Services marked as "enterprise ready"
- Organized by pillars: Wellness, Beauty, Health, Events

### Ready to Go Service
- Urgent intervention < 2 hours
- +30% surcharge
- Requires contractor flag `ready_to_go = true`

### Corporate Gift Cards
- 24-month validity (vs 12 months standard)
- Logo customization available
- Bulk purchasing

## Notification Strategy

### Channels
- **In-app:** Status changes, new messages, task assignments
- **Email (Resend):** Account actions, booking confirmations, receipts
- **SMS (Twilio/Vonage):** Urgent notifications, verification codes, J-1 reminders

### User Preferences
- Users can configure notification preferences by channel
- Critical security notifications always sent

## Data Privacy & GDPR

- Respect GDPR principles
- Minimal data collection
- User consent for marketing communications
- Right to data export and deletion
- Secure storage of personal information
- RLS ensures data isolation

## Versioning & Documentation

- Semantic versioning for releases
- Maintain CHANGELOG.md
- Document all Edge Functions
- Keep API documentation up-to-date
- Comment complex business logic

## Decision Log

### Why numeric IDs over UUIDs?
**Decision:** Use BIGINT auto-increment as default, UUID only when necessary
**Rationale:**
- Better readability in logs and debugging (ID: 12345 vs. 550e8400-e29b-41d4-a716-446655440000)
- Improved database performance (smaller index size, better cache efficiency)
- Simpler JOIN queries
- Sequential IDs provide implicit chronological ordering
- Easier for support team to reference bookings/users

**Trade-offs Accepted:**
- IDs are predictable (not a concern for internal business entities)
- Potential ID exhaustion (mitigated by BIGINT range: 9 quintillion)
- Multi-datacenter complexity (not applicable with single Supabase instance)

### Why Progressive Web App + Native Mobile Apps?
**Decision:** Build web as PWA, with native mobile apps (iOS/Android) developed by separate team using secure APIs
**Rationale:**
- **Web (PWA):** Single codebase, instant updates, no app store approval
- **Native Apps:** Superior mobile UX, developed by dedicated mobile team
- **API-First Architecture:** Both web and mobile consume same secure APIs
  - Supabase Auth (JWT tokens) works across all platforms
  - Edge Functions provide consistent business logic
  - RLS policies secure database access regardless of client type
- **Separation of Concerns:** Web team focuses on PWA, mobile team on native apps
- **Shared Backend:** No duplication of business logic or data models

### Why Tailwind CSS + shadcn/ui?
**Decision:** Use utility-first CSS with pre-built components
**Rationale:**
- Rapid development with utility classes
- Consistent design system through tokens
- No CSS naming conflicts
- Excellent TypeScript support
- Accessible components out of the box
- Easy dark mode implementation

---

**Last Updated:** 2025-11-09
**Version:** 1.3

**Changelog:**
- v1.3 (2025-11-09): Added Principle 13 (Multilingual Architecture), Principle 14 (Data Integrity), SpecKit Workflow section
- v1.2 (2025-11-07): Previous version
- v1.0: Initial constitution
