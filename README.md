# Simone Paris Platform 💆‍♀️

**Version**: 2.1
**Status**: 🚧 Phase 1 Complete - Ready for Phase 2
**Tech Stack**: Next.js 16, React 19, TypeScript, Supabase, Stripe Connect

---

## 📋 About

Simone Paris is a comprehensive wellness and beauty services marketplace platform connecting clients with professional service providers (masseurs, estheticians, hairdressers, etc.) across Paris.

**Key Features**:
- 🔐 Multi-role authentication (clients, contractors, admins)
- 💆 88 professional services across 8 categories
- 📅 Real-time booking with availability management
- 💳 Stripe Connect integration for contractor payouts
- 📱 PWA with push notifications
- 🏢 Corporate services (B2B)
- 📊 Contractor dashboard with financial analytics

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Supabase CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/maebaconsulting/simonebeauty
cd webclaude

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run database migrations (if needed)
supabase db push --db-url "your-database-url"

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📚 Documentation

### Spec-Driven Development (SpecKit)

This project follows a **Spec-Driven Development** approach using **SpecKit**. All features are specified in [`/specs`](./specs) before implementation:

- **[Project Constitution](./.specify/constitution.md)** - Core principles and conventions
- **[Feature Specifications](./specs)** - 15 feature specs (001-015)
  - Each spec follows the SpecKit template: User Stories → Requirements → Success Criteria
  - See [specs/015-promo-codes-system](./specs/015-promo-codes-system) for complete example

**SpecKit Commands** (available via slash commands):
- `/speckit.specify` - Create or update feature specification
- `/speckit.plan` - Generate implementation plan
- `/speckit.tasks` - Generate actionable tasks
- `/speckit.implement` - Execute implementation
- `/speckit.analyze` - Cross-artifact consistency analysis

### General Documentation

All supporting documentation is in the [`/docs`](./docs) folder:

#### Phase 1 Documentation (Database Setup)
- **[PHASE1_STATUS.md](./docs/PHASE1_STATUS.md)** - Complete Phase 1 overview and status
- **[PHASE1_COMPLETE.md](./docs/PHASE1_COMPLETE.md)** - Phase 1 accomplishments details
- **[README_PHASE1.md](./docs/README_PHASE1.md)** - Quick start guide for Phase 1
- **[CHANGELOG_PHASE1.md](./docs/CHANGELOG_PHASE1.md)** - Detailed Phase 1 changelog

#### Database Schema
- **[SERVICE_CATEGORIES_ADDED.md](./docs/SERVICE_CATEGORIES_ADDED.md)** - Hierarchical category system (48 categories)
- **[SERVICES_TABLE_EXTENDED.md](./docs/SERVICES_TABLE_EXTENDED.md)** - Extended services table (33 columns)
- **[SERVICES_POPULATED.md](./docs/SERVICES_POPULATED.md)** - 88 services data population

#### Reference
- **[specifications-simone-fusionnees.md](./docs/specifications-simone-fusionnees.md)** - Complete specifications
- **[liste_services.md](./docs/liste_services.md)** - Service catalog (88 services)
- **[legacy_product.md](./docs/legacy_product.md)** - Legacy system reference

---

## 🏗️ Project Structure

```
webclaude/
├── .specify/                # SpecKit configuration
│   ├── constitution.md      # Project principles & conventions
│   ├── templates/           # SpecKit templates (spec, plan, tasks)
│   └── scripts/             # SpecKit automation scripts
├── specs/                   # Feature specifications (Spec-Driven Development)
│   ├── 001-authentication-system/
│   ├── 002-availability-calculator/
│   ├── 003-booking-flow/
│   ├── ...
│   └── 015-promo-codes-system/
│       ├── spec.md          # SpecKit specification
│       └── README.md        # Quick overview
├── app/                     # Next.js 16 App Router
├── components/              # React components
├── lib/                     # Utilities and helpers
├── public/                  # Static assets
├── supabase/
│   ├── migrations/          # Database migrations (24 files)
│   └── storage-setup.md     # Storage bucket setup
├── docs/                    # 📚 Supporting documentation
├── .env.local               # Environment variables (not in git)
├── .env.local.example       # Environment template
└── README.md                # This file
```

---

## 🗄️ Database

**Database Provider**: Supabase (PostgreSQL)
**Status**: ✅ Production Ready
**Project**: xpntvajwrjuvsqsmizzb

### Statistics
- **17 tables** with Row Level Security (RLS)
- **5 views** with calculated fields
- **48 service categories** (8 main + 40 subcategories)
- **88 services** fully populated
- **46 RLS policies** for data security
- **30+ indexes** for performance

### Key Tables
- `profiles` - User accounts
- `contractors` - Service providers
- `services` - 88 services catalog
- `service_categories` - Hierarchical categories
- `appointment_bookings` - Bookings with tips
- `contractor_services` - Many-to-many (contractors ↔ services)
- `contractor_schedules` - Weekly availability
- `contractor_profiles` - Public profiles

See [PHASE1_STATUS.md](./docs/PHASE1_STATUS.md) for complete schema.

---

## 🎯 Current Status

### ✅ Phase 1: Setup & Infrastructure (Complete)
- [x] Database schema (17 tables)
- [x] Service categories (48 categories)
- [x] Services population (88 services)
- [x] RLS policies (46 policies)
- [x] Database views (5 views)
- [x] Environment configuration

### 🚧 Phase 2: Implementation (Next)

Choose one of:
- **Option A**: Spec 007 - Contractor Onboarding (28 tasks)
- **Option B**: Spec 003 - Booking Flow (MVP ~100 tasks)
- **Option C**: Spec 013 - Ready to Go (MVP ~120 tasks)
- **Option D**: Service Content Enhancement

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (assumed)

### Backend
- **Supabase** - PostgreSQL database + Auth + Storage
- **Row Level Security (RLS)** - Database-level security
- **Edge Functions (Deno)** - Serverless functions

### Integrations
- **Stripe Connect** - Contractor payouts (Express Accounts)
- **Google Maps API** - Geocoding, distance calculation
- **Resend** - Email notifications
- **Twilio** - SMS notifications (optional)

### Developer Tools
- **Supabase CLI** - Database migrations
- **ESLint** - Code linting
- **Prettier** - Code formatting (assumed)

---

## 🔐 Environment Variables

Required environment variables (see `.env.local.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_CONNECT_CLIENT_ID=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Optional
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

---

## 📦 Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:status    # Check database status (custom)
npm run db:push      # Apply migrations (custom)
npm run db:reset     # Reset database (custom)

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code (if configured)
```

---

## 🤝 Contributing

This is a private project. For team members:

1. Create a feature branch from `main`
2. Make your changes
3. Submit a PR for review
4. Ensure all tests pass
5. Get approval before merging

---

## 📝 License

Private project - All rights reserved

---

## 🔗 Links

- **GitHub**: https://github.com/maebaconsulting/simonebeauty
- **Database**: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb
- **Documentation**: [`/docs`](./docs) folder

---

## 📞 Support

For questions or issues:
1. Check the [`/docs`](./docs) folder
2. Review migration files in `supabase/migrations/`
3. Check [PHASE1_STATUS.md](./docs/PHASE1_STATUS.md) for current state

---

**Last Updated**: 2025-11-07
**Phase**: 1 Complete | 2 Ready to Start
