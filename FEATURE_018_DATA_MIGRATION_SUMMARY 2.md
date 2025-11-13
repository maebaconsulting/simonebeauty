# Feature 018: Data Migration to France Market

**Date**: 2025-01-12
**Feature**: 018-international-market-segmentation
**Tasks**: T087-T091 - Backfill Existing Data

## Summary

All existing data has been successfully migrated to the **France market** (id=1) as the default market for the initial deployment.

---

## Migration Details

### 1. Markets Created

5 markets were pre-populated in the database:

| ID | Name      | Code | Currency | Timezone          | Languages        | Status |
|----|-----------|------|----------|-------------------|------------------|--------|
| 1  | France    | FR   | EUR      | Europe/Paris      | fr, en           | Active |
| 2  | Belgique  | BE   | EUR      | Europe/Brussels   | fr, nl, en       | Active |
| 3  | Suisse    | CH   | CHF      | Europe/Zurich     | fr, de, it, en   | Active |
| 4  | Espagne   | ES   | EUR      | Europe/Madrid     | es, en           | Active |
| 5  | Allemagne | DE   | EUR      | Europe/Berlin     | de, en           | Active |

---

### 2. Client Codes (Profiles)

**Status**: ✅ **Already assigned via trigger**

- **Total profiles**: 4
- **Profiles with client_code**: 4 (100%)
- **Client role profiles**: 2

**Automatic code assignment**: All profiles automatically receive a unique `CLI-XXXXXX` code via the database trigger when created.

---

### 3. Contractors

**Status**: ✅ **Already assigned to France market**

- **Total contractors**: 1
- **Contractors with market_id**: 1 (100%)
- **Default market**: France (id=1)

**Automatic code assignment**: All contractors automatically receive a unique `CTR-XXXXXX` code via the database trigger when created.

---

### 4. Services to Markets

**Status**: ✅ **Migrated via backfill script**

**Migration**: `20250112000230_backfill_services_to_france_market.sql`

- **Total services**: 89
- **Services assigned to France market**: 89 (100%)
- **Availability**: All marked as `is_available = true`
- **Pricing**: Using service `base_price` (localized_price = NULL)

**Query executed**:
```sql
INSERT INTO service_market_availability (
  service_id, market_id, is_available, localized_price
)
SELECT
  s.id, 1, true, NULL
FROM services s;
```

**Result**: All 89 services are now available in the France market.

---

### 5. Bookings

**Status**: ✅ **Protected by RLS policies**

- **Total bookings**: 11
- **Unique clients**: 1
- **Unique contractors**: 0 (pending assignments)

**RLS Policies Applied**:
- Clients can only view their own bookings
- Contractors can only see bookings in their assigned market
- Bookings must respect market boundaries (via contractor's market_id)

---

## Database Changes

### Migrations Applied

1. **20250112000100_create_markets_table.sql**
   - Created `markets` table with 5 pre-populated markets

2. **20250112000110_create_code_sequences.sql**
   - Created `client_code_seq` and `contractor_code_seq`

3. **20250112000120_add_client_code_to_profiles.sql**
   - Added `client_code` column to profiles table

4. **20250112000130_add_contractor_code_market_to_contractors.sql**
   - Added `contractor_code` and `market_id` columns to contractors table

5. **20250112000140_create_client_code_trigger.sql**
   - Auto-generates CLI-XXXXXX codes for new profiles

6. **20250112000150_create_contractor_code_trigger.sql**
   - Auto-generates CTR-XXXXXX codes for new contractors

7. **20250112000160_create_service_market_availability.sql**
   - Created junction table for service-market relationships

8. **20250112000170_create_markets_rls_policies.sql**
   - Added RLS policies for markets table

9. **20250112000180_backfill_existing_codes.sql**
   - Backfilled codes for existing profiles and contractors

10. **20250112000200_add_contractor_market_rls.sql**
    - Added RLS policies for contractor market filtering

11. **20250112000210_add_service_market_rls.sql**
    - Added RLS policies for service-market availability

12. **20250112000220_add_booking_market_rls.sql**
    - Added RLS policies for market-filtered bookings

13. **20250112000230_backfill_services_to_france_market.sql** ⬅️ **NEW**
    - Assigned all 89 services to France market

---

## Verification Queries

```sql
-- Check markets
SELECT * FROM markets ORDER BY id;

-- Check client codes
SELECT id, client_code, first_name, last_name, role
FROM profiles
WHERE client_code IS NOT NULL
ORDER BY client_code;

-- Check contractor codes and markets
SELECT id, contractor_code, business_name, market_id
FROM contractors
ORDER BY contractor_code;

-- Check services in France market
SELECT COUNT(*) as services_in_france
FROM service_market_availability
WHERE market_id = 1 AND is_available = true;
-- Result: 89

-- Check total service availability
SELECT
  m.name as market,
  COUNT(sma.service_id) as available_services
FROM markets m
LEFT JOIN service_market_availability sma ON m.id = sma.market_id AND sma.is_available = true
GROUP BY m.id, m.name
ORDER BY m.id;
```

---

## Next Steps

### Remaining Tasks (Phase 9: Polish)

1. **Market Forms** (T025-T031)
   - ✅ Create market page created
   - ⏳ Market edit page
   - ⏳ Market detail page

2. **Service Multi-Market Pricing** (T073-T076)
   - ⏳ UI for managing localized prices per market
   - ⏳ Currency formatting helpers

3. **Contractor Assignment** (T058-T062)
   - ⏳ UI for assigning contractors to markets
   - ⏳ Market selection dropdown

4. **Utilities** (T095-T098)
   - ⏳ Currency formatting (`formatPrice()`)
   - ⏳ Timezone formatting (`formatDateTime()`)
   - ⏳ Apply throughout app

5. **Performance** (T099-T101)
   - ⏳ Verify indexes on market_id columns
   - ⏳ Add partial indexes
   - ⏳ Run EXPLAIN ANALYZE

6. **Documentation** (T102-T104)
   - ⏳ Update README with market setup
   - ⏳ Create admin user guide
   - ⏳ Test quickstart scenarios

7. **Code Quality** (T105-T108)
   - ⏳ ESLint fixes
   - ⏳ Security audit of RLS policies
   - ⏳ Verify API endpoint auth

---

## Status

✅ **Data Migration Complete**

- All clients have unique codes (CLI-XXXXXX)
- All contractors have unique codes (CTR-XXXXXX) and are assigned to France market
- All 89 services are available in France market
- RLS policies protect data access by market boundaries

**France market is now the operational default for the platform.**
