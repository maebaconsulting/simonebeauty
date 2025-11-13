/**
 * Enable unaccent Extension for Slug Generation
 * Task: Fix "function unaccent(text) does not exist" error
 * Feature: 007-contractor-interface
 *
 * Problem: The generate_contractor_slug() trigger uses UNACCENT() function
 * to remove accents from contractor names when generating slugs, but the
 * PostgreSQL extension was not enabled.
 *
 * Error: function unaccent(text) does not exist (code 42883)
 *
 * Solution: Enable the unaccent extension which provides text accent removal
 */

-- ============================================================================
-- Enable the unaccent extension
-- ============================================================================

-- This extension provides the unaccent() function which removes accents from text
-- Example: unaccent('José') returns 'Jose'
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON EXTENSION unaccent IS
  'Extension for removing accents from text. Required by generate_contractor_slug() trigger to create URL-friendly slugs from contractor names with accents (e.g., "José Dupont" → "jose-dupont").';
