# Implementation Plan: Client Interface Complete

**Branch**: `006-client-interface` | **Date**: 2025-11-09 | **Spec**: `/specs/006-client-interface/spec.md`

## Summary

The Client Interface feature provides a comprehensive dashboard and management system for clients to manage their personal profile, booking history, favorite addresses, saved payment methods, notifications, and preferences. This feature enables clients to:

- View and update personal information (name, email, phone, avatar)
- Access complete booking history with filtering by status
- Cancel bookings with automatic refund calculation based on platform policies
- Manually confirm payments and add tips after service completion
- Reschedule bookings within configured limits
- Manage favorite addresses with Google Places autocomplete
- Save and manage payment methods via Stripe
- Configure notification preferences and view notification center
- Access a personalized dashboard with upcoming bookings and recommendations

**Technical Approach**: Full-stack Next.js implementation using React Query for state management, Supabase for backend/database, Stripe for payment management, and shadcn/ui components following established project patterns.

---

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**:
- React 18.x with React Query (TanStack Query)
- Supabase (Auth, Database, Storage, Realtime)
- Stripe SDK (payment methods, tips, refunds)
- shadcn/ui + Tailwind CSS
- Google Places API (address autocomplete)
- Resend (email notifications)

**Storage**:
- PostgreSQL via Supabase (profiles, bookings, addresses, notifications, payment references)
- Supabase Storage (profile photos)
- Stripe (tokenized payment methods)

**Testing**: Vitest with React Testing Library (unit + integration tests)

**Target Platform**: Web (responsive, mobile-first)

**Project Type**: Web application (Next.js fullstack)

**Performance Goals**:
- Page load < 2s for dashboard and profile
- Booking history query < 500ms for 95% of requests
- Address autocomplete debounced at 300ms
- Notification center < 1s load time

**Constraints**:
- Must respect Supabase RLS policies for all data access
- Stripe PCI compliance for payment method handling (use tokenization only)
- Email verification required for email changes
- Profile photos < 5MB, stored in Supabase Storage
- Notification retention: 90 days

**Scale/Scope**:
- Support 10,000+ clients
- Booking history pagination (50 records per page)
- Up to 10 saved addresses per client
- Unlimited payment methods via Stripe
- Notification center with 500+ notifications per client

---

## Open Questions / NEEDS CLARIFICATION

1. **SMS Notifications**: Are SMS notifications required for MVP (P1) or can they be P2/P3? No SMS provider is currently configured.

2. **Tip Distribution**: How are tips transferred to contractors? Do we use Stripe Connect transfers (recommended) or a separate payout system?

3. **Medical Exception Workflow**: Does medical exception approval require admin action, or can it be auto-approved based on criteria?

4. **Cancellation Deadline Configuration**: What is the default cancellation deadline? Spec mentions "J-1 à 18h" (1 day before at 6pm). Should this be configurable per service or global?

5. **Recommendation Algorithm**: For the P3 dashboard, should recommendations be:
   - Simple frequency-based (most booked services)?
   - Collaborative filtering (similar users)?
   - Time-based (seasonal services)?

6. **Notification Retention**: Spec says 90 days. Should old notifications be:
   - Hard deleted?
   - Soft deleted (archived)?
   - Moved to cold storage?

7. **Payment Method Limits**: Should there be a limit on how many payment methods a client can save?

8. **Profile Photo Moderation**: Spec mentions manual/automatic moderation. Should this be:
   - Manual admin review?
   - Automated (using ML API like AWS Rekognition)?
   - No moderation for MVP?

9. **Reschedule Availability**: When rescheduling, should we:
   - Lock to same contractor only?
   - Allow switching contractors?
   - Show all available slots across all contractors?

10. **Constitution Compliance**: Once the constitution file is completed, this plan must be re-validated against all principles.

---

## Implementation Roadmap

### Quick Win: Update Middleware Redirect

**Task**: Change client redirect from `/booking/services` to `/client/dashboard`
**Files**:
- `middleware.ts` (line 275)
- `hooks/useLogin.ts` (line 116)

---

### Phase 3A: P1 Features (MVP - Must Have)

**Database Migrations** (5 tasks)
1. Create `notifications` table
2. Create `notification_preferences` table
3. Create `cancellation_requests` table
4. Extend `appointment_bookings` (reschedule fields)
5. Add `platform_config` keys (cancellation rules, reschedule config, tip config)

**Core Repositories** (5 tasks)
6. `client-profile-repository.ts` (profile CRUD)
7. `booking-repository.ts` (booking queries)
8. `notification-repository.ts` (notification CRUD)
9. `stripe/payment-methods.ts` (Stripe Customer & PM management)
10. `stripe/refunds.ts` (refund processing)

**Utility Functions** (3 tasks)
11. `cancellation-policy.ts` (calculate refunds)
12. `reschedule-validator.ts` (validate reschedule rules)
13. `notification-formatter.ts` (format notifications)

**React Query Hooks** (7 tasks)
14. `useClientProfile.ts`
15. `useClientBookings.ts`
16. `useCancelBooking.ts`
17. `useTipBooking.ts`
18. `useRescheduleBooking.ts`
19. `usePaymentMethods.ts`
20. `useNotifications.ts`

**API Routes - Profile** (3 tasks)
21. `GET /api/client/profile`
22. `PATCH /api/client/profile`
23. `POST /api/client/profile/avatar`

**API Routes - Bookings** (5 tasks)
24. `GET /api/client/bookings` (with filters)
25. `POST /api/client/bookings/[id]/cancel`
26. `POST /api/client/bookings/[id]/capture`
27. `POST /api/client/bookings/[id]/tip`
28. `POST /api/client/bookings/[id]/reschedule`

**UI Components - Profile** (5 tasks)
29. `ProfileForm.tsx`
30. `AvatarUploadWidget.tsx`
31. `EmailChangeSection.tsx`
32. Profile page (`/client/profile/page.tsx`)
33. Profile page tests

**UI Components - Bookings** (10 tasks)
34. `BookingCard.tsx`
35. `BookingFilters.tsx`
36. `BookingList.tsx`
37. Bookings list page (`/client/bookings/page.tsx`)
38. `BookingDetailHeader.tsx`
39. `CancelBookingModal.tsx` (with policy display)
40. `TipModal.tsx` (with suggested amounts)
41. `RescheduleModal.tsx` (with calendar)
42. Booking detail page (`/client/bookings/[id]/page.tsx`)
43. Booking pages tests

**Milestone 1**: Client can manage profile, view booking history, cancel bookings with refund calculation, capture payments, add tips, and reschedule bookings.

---

### Phase 3B: P2 Features (Important - Should Have)

**API Routes - Addresses** (3 tasks)
44. Extend existing address hooks if needed
45. Google Places API integration
46. Address validation

**UI Components - Addresses** (5 tasks)
47. `AddressCard.tsx`
48. `AddressList.tsx`
49. `AddressFormModal.tsx` (with Google Places)
50. Addresses page (`/client/addresses/page.tsx`)
51. Addresses page tests

**API Routes - Payment Methods** (4 tasks)
52. `GET /api/client/payment-methods`
53. `POST /api/client/payment-methods`
54. `DELETE /api/client/payment-methods/[id]`
55. `PATCH /api/client/payment-methods/[id]/set-default`

**UI Components - Payments** (5 tasks)
56. `PaymentMethodCard.tsx`
57. `PaymentMethodList.tsx`
58. `AddCardModal.tsx` (Stripe Elements)
59. Payments page (`/client/payments/page.tsx`)
60. Payments page tests

**API Routes - Notifications** (5 tasks)
61. `GET /api/client/notifications`
62. `PATCH /api/client/notifications/[id]/read`
63. `DELETE /api/client/notifications/[id]`
64. `GET /api/client/notifications/preferences`
65. `PATCH /api/client/notifications/preferences`

**UI Components - Notifications** (6 tasks)
66. `NotificationCard.tsx`
67. `NotificationList.tsx`
68. `NotificationBadge.tsx` (for navbar)
69. Notifications page (`/client/notifications/page.tsx`)
70. Preferences page (`/client/notifications/preferences/page.tsx`)
71. Notifications pages tests

**Milestone 2**: Client can manage addresses, payment methods, and notification preferences.

---

### Phase 3C: P3 Features (Nice to Have)

**Dashboard Analytics** (4 tasks)
72. Create dashboard data aggregation views (SQL)
73. `GET /api/client/dashboard` API route
74. `useClientDashboard.ts` hook
75. Favorites/Recommendations algorithm

**UI Components - Dashboard** (7 tasks)
76. `WelcomeBanner.tsx`
77. `NextBookingWidget.tsx`
78. `FavoritesWidget.tsx`
79. `RecommendationsWidget.tsx`
80. `QuickActionsWidget.tsx`
81. Dashboard page (`/client/dashboard/page.tsx`)
82. Dashboard tests

**Milestone 3**: Client has a personalized dashboard with recommendations.

---

### Phase 3D: Integration & Polish

**Middleware Updates** (1 task)
83. Update `middleware.ts` to redirect authenticated clients to `/client/dashboard`

**Navigation** (2 tasks)
84. Add client nav links to layout
85. Notification badge in navbar (real-time update)

**Email Templates** (3 tasks)
86. Booking cancellation confirmation email
87. Reschedule confirmation email
88. Tip receipt email (to client and contractor)

**Error Handling** (2 tasks)
89. Global error boundaries for client pages
90. Toast notifications for all actions

**Accessibility** (1 task)
91. ARIA labels, keyboard navigation, screen reader testing

**Performance** (2 tasks)
92. Optimize booking list pagination
93. Image optimization for avatars

**End-to-End Tests** (3 tasks)
94. Profile update E2E flow
95. Booking cancellation E2E flow
96. Tip submission E2E flow

**Final Milestone**: Complete client interface with all features, tests, and polish.

---

## Next Steps

1. ✅ Plan approved
2. ⏳ Update middleware redirect (quick win)
3. ⏳ Answer open questions
4. ⏳ Begin Phase 3A implementation
5. ⏳ Generate detailed tasks with `/speckit.tasks`

---

**Plan Version**: 1.0
**Last Updated**: 2025-11-09
**Status**: Approved - Ready for Implementation
