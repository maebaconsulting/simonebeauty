-- Migration: Fix RLS infinite recursion on services and service_categories
-- Description: Remove admin policies that cause recursion with profiles table
-- Author: Bug fix for booking flow
-- Date: 2025-11-08

-- Drop problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage services" ON services;
DROP POLICY IF EXISTS "Admins can manage categories" ON service_categories;

-- These policies remain and are sufficient for the booking flow:
-- - "Anyone can view active services" ON services
-- - "Anyone can view active categories" ON service_categories

-- Note: Admin management of services and categories should be done via
-- service role or through the Supabase dashboard, not through client-side RLS policies
