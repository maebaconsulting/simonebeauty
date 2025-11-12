-- List all views
SELECT
  schemaname,
  viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('contractor_slug_stats', 'contractor_financial_summary', 'contractor_transaction_details')
ORDER BY viewname;

-- Count RLS policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
