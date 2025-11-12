#!/bin/bash

# Script: Apply i18n migrations (Phase 2)
# Applies all 5 migrations for multilingual support

set -e  # Exit on any error

export PATH="/Library/PostgreSQL/18/bin:$PATH"
export PGPASSWORD='MoutBinam@007'

DB_HOST="db.xpntvajwrjuvsqsmizzb.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"

MIGRATION_DIR="supabase/migrations"

echo "=========================================="
echo "  Applying i18n Migrations (Phase 2)"
echo "=========================================="
echo ""

# Migration 1: Create supported_languages table
echo "✓ Migration 1/5: Creating supported_languages table..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/20250111000001_create_supported_languages.sql" 2>&1 | grep -v "supautils"
echo "  ✅ Done"
echo ""

# Migration 2: Create translations table
echo "✓ Migration 2/5: Creating translations table..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/20250111000002_create_translations.sql" 2>&1 | grep -v "supautils"
echo "  ✅ Done"
echo ""

# Migration 3: Add specialty-category FK
echo "✓ Migration 3/5: Adding specialty-category FK..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/20250111000003_add_specialty_category_fk.sql" 2>&1 | grep -v "supautils"
echo "  ✅ Done"
echo ""

# Migration 4: Migrate content to translations
echo "✓ Migration 4/5: Migrating existing content to translations..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/20250111000004_migrate_content_to_translations.sql" 2>&1 | grep -v "supautils"
echo "  ✅ Done"
echo ""

# Migration 5: Add technical keys
echo "✓ Migration 5/5: Adding technical keys..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/20250111000005_add_technical_keys.sql" 2>&1 | grep -v "supautils"
echo "  ✅ Done"
echo ""

# Verification
echo "=========================================="
echo "  Verification"
echo "=========================================="
echo ""

echo "✓ Checking supported languages..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT code, name, is_default FROM supported_languages ORDER BY is_default DESC;" 2>&1 | grep -v "supautils"
echo ""

echo "✓ Checking translations count..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT entity_type, COUNT(*) as count FROM translations GROUP BY entity_type;" 2>&1 | grep -v "supautils"
echo ""

echo "✓ Checking specialties with category_id..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as total, COUNT(category_id) as with_category FROM specialties;" 2>&1 | grep -v "supautils"
echo ""

echo "=========================================="
echo "  ✅ All migrations applied successfully!"
echo "=========================================="
