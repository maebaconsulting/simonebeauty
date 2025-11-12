-- List all tables created by migrations
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'contractors', 'services', 'appointment_bookings',
    'specialties', 'contractor_applications', 'contractor_onboarding_status',
    'contractor_schedules', 'contractor_unavailabilities', 'contractor_profiles',
    'contractor_profile_specialties', 'contractor_services', 'contractor_slug_history',
    'contractor_slug_analytics', 'platform_config', 'booking_requests', 'service_action_logs'
  )
ORDER BY tablename;
