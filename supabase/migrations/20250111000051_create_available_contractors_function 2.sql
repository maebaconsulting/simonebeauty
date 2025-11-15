-- Migration: 20250111000051_create_available_contractors_function.sql
-- Description: Create PostgreSQL function to get available contractors
-- This replaces Service Role Key usage with a secure, performant database function
-- Compatible with: Web (Next.js), iOS mobile app, Android mobile app

-- =============================================================================
-- FUNCTION: get_available_contractors
-- =============================================================================
-- Purpose: Get contractors available for a specific service, date, and time
-- Security: SECURITY DEFINER bypasses RLS in controlled way
-- Performance: Single query with all business logic in database
-- Mobile-ready: Can be called directly from iOS/Android with ANON_KEY
-- =============================================================================

CREATE OR REPLACE FUNCTION get_available_contractors(
    p_service_id INT,
    p_date DATE,
    p_time TIME,
    p_address_id INT DEFAULT NULL
)
RETURNS TABLE(
    contractor_id UUID,
    contractor_slug VARCHAR,
    business_name VARCHAR,
    bio TEXT,
    professional_title VARCHAR,
    profile_picture_url TEXT,
    rating NUMERIC,
    total_bookings BIGINT,
    distance_km NUMERIC,
    specialties TEXT[]
)
SECURITY DEFINER  -- Execute with function owner's permissions (bypass RLS)
SET search_path = public  -- Security: Prevent search_path injection
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_duration INT;
    v_start_datetime TIMESTAMPTZ;
    v_end_datetime TIMESTAMPTZ;
    v_day_of_week INT;
BEGIN
    -- Get service duration
    SELECT base_duration_minutes INTO v_service_duration
    FROM services
    WHERE id = p_service_id AND is_active = true;

    IF v_service_duration IS NULL THEN
        RAISE EXCEPTION 'Service not found or inactive: %', p_service_id;
    END IF;

    -- Calculate time window
    v_start_datetime := (p_date || ' ' || p_time)::TIMESTAMPTZ;
    v_end_datetime := v_start_datetime + (v_service_duration || ' minutes')::INTERVAL;
    v_day_of_week := EXTRACT(DOW FROM p_date);

    -- Return available contractors with all checks in one query
    RETURN QUERY
    WITH contractor_candidates AS (
        -- Get contractors who offer this service
        SELECT DISTINCT
            c.id,
            c.slug,
            c.business_name,
            c.bio,
            c.professional_title,
            NULL::TEXT as profile_picture_url,  -- TODO: Add profile picture support
            cos.is_completed
        FROM contractor_services cs
        JOIN contractors c ON c.id = cs.contractor_id
        LEFT JOIN contractor_onboarding_status cos ON cos.contractor_id = c.id
        WHERE cs.service_id = p_service_id
          AND cs.is_active = true
          AND c.is_active = true
          AND cos.is_completed = true  -- Only fully onboarded contractors
    ),
    contractor_availability AS (
        -- Check each contractor's availability
        SELECT
            cc.id,
            cc.slug,
            cc.business_name,
            cc.bio,
            cc.professional_title,
            cc.profile_picture_url,
            -- Check if contractor has schedule for this day
            EXISTS (
                SELECT 1 FROM contractor_schedules cs
                WHERE cs.contractor_id = cc.id
                  AND cs.day_of_week = v_day_of_week
                  AND cs.is_active = true
                  AND p_time >= cs.start_time::TIME
                  AND (p_time + (v_service_duration || ' minutes')::INTERVAL)::TIME <= cs.end_time::TIME
            ) as has_schedule,
            -- Check if contractor has unavailability
            NOT EXISTS (
                SELECT 1 FROM contractor_unavailabilities cu
                WHERE cu.contractor_id = cc.id
                  AND cu.is_active = true
                  AND cu.start_datetime <= v_start_datetime
                  AND cu.end_datetime >= v_start_datetime
            ) as is_not_unavailable,
            -- Check if contractor has conflicting bookings
            NOT EXISTS (
                SELECT 1 FROM appointment_bookings ab
                WHERE ab.contractor_id = cc.id
                  AND ab.status IN ('pending', 'confirmed')
                  AND ab.scheduled_datetime >= v_start_datetime
                  AND ab.scheduled_datetime < v_end_datetime
            ) as has_no_conflicts
        FROM contractor_candidates cc
    ),
    contractor_stats AS (
        -- Get contractor statistics
        SELECT
            ca.id,
            ca.slug,
            ca.business_name,
            ca.bio,
            ca.professional_title,
            ca.profile_picture_url,
            -- Calculate average rating (placeholder - TODO: add reviews table)
            NULL::NUMERIC as avg_rating,
            -- Count completed bookings
            (
                SELECT COUNT(*)
                FROM appointment_bookings ab
                WHERE ab.contractor_id = ca.id
                  AND ab.status = 'completed'
            ) as booking_count,
            -- Calculate distance if address provided (placeholder - TODO: implement geospatial)
            NULL::NUMERIC as calc_distance
        FROM contractor_availability ca
        WHERE ca.has_schedule = true
          AND ca.is_not_unavailable = true
          AND ca.has_no_conflicts = true
    ),
    contractor_specialties AS (
        -- Get contractor service categories (as specialties)
        SELECT
            cs.contractor_id,
            ARRAY_AGG(DISTINCT s.category ORDER BY s.category) as specialty_names
        FROM contractor_services cs
        JOIN services s ON s.id = cs.service_id
        WHERE cs.is_active = true
          AND s.category IS NOT NULL
        GROUP BY cs.contractor_id
    )
    -- Final result with all data
    SELECT
        cst.id::UUID,
        cst.slug::VARCHAR,
        COALESCE(cst.business_name, 'Prestataire')::VARCHAR,
        cst.bio::TEXT,
        cst.professional_title::VARCHAR,
        cst.profile_picture_url::TEXT,
        cst.avg_rating::NUMERIC,
        cst.booking_count::BIGINT,
        cst.calc_distance::NUMERIC,
        COALESCE(csp.specialty_names, ARRAY[]::TEXT[])::TEXT[]
    FROM contractor_stats cst
    LEFT JOIN contractor_specialties csp ON csp.contractor_id = cst.id
    ORDER BY cst.booking_count DESC;  -- Sort by experience (most bookings first)
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
-- Allow both authenticated users AND anonymous users (for guest booking)
GRANT EXECUTE ON FUNCTION get_available_contractors TO anon, authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON FUNCTION get_available_contractors IS
'Get available contractors for a service at a specific date/time.
Security: SECURITY DEFINER bypasses RLS in controlled way.
Returns: Only public contractor information (name, bio, stats).
Usage: Can be called from web (Next.js) or mobile (iOS/Android) with ANON_KEY.
Example: SELECT * FROM get_available_contractors(1, ''2025-11-13'', ''13:30'', 123);';
