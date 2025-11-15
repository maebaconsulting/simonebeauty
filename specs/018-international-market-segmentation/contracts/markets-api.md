# API Contract: Markets Management

**Feature**: 018-international-market-segmentation
**Date**: 2025-11-12
**Status**: Phase 1 Design

## Overview

This document specifies the REST API endpoints for managing geographical markets. All endpoints require admin or manager authentication. Follows existing API conventions from `app/api/admin/services/` pattern.

---

## Base URL

```
/api/admin/markets
```

**Authentication**: All endpoints require `auth.role() IN ('admin', 'manager')`

**Response Format**: JSON with standard structure:
```typescript
// Success
{ data: T }

// Error
{ error: string, details?: any }
```

---

## Endpoints

### 1. List All Markets

**GET** `/api/admin/markets`

**Purpose**: Fetch all markets with pagination and filtering

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (1-indexed) |
| limit | number | No | 20 | Items per page (max 100) |
| is_active | boolean | No | - | Filter by active status |
| search | string | No | - | Search by name or code |
| sort | string | No | 'created_at' | Sort field (name, code, created_at) |
| order | string | No | 'desc' | Sort order (asc, desc) |

**Success Response** (200):
```json
{
  "data": {
    "markets": [
      {
        "id": 1,
        "name": "France",
        "code": "FR",
        "currency_code": "EUR",
        "timezone": "Europe/Paris",
        "supported_languages": ["fr", "en"],
        "is_active": true,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z",
        "_count": {
          "contractors": 42,
          "services": 15
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

**Error Responses**:
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager

**Example Request**:
```bash
GET /api/admin/markets?is_active=true&sort=name&order=asc
Authorization: Bearer <token>
```

**Implementation Notes**:
- Use Supabase query with RLS bypass for admins
- Count contractors and services via subqueries
- Validate pagination parameters (page >= 1, limit <= 100)
- Use ILIKE for case-insensitive search on name/code

---

### 2. Get Market by ID

**GET** `/api/admin/markets/:id`

**Purpose**: Fetch detailed market information

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Market ID |

**Success Response** (200):
```json
{
  "data": {
    "id": 1,
    "name": "France",
    "code": "FR",
    "currency_code": "EUR",
    "timezone": "Europe/Paris",
    "supported_languages": ["fr", "en"],
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z",
    "_count": {
      "contractors": 42,
      "services": 15,
      "clients": 128
    }
  }
}
```

**Error Responses**:
- 400: `{ "error": "ID de marché invalide" }` - Invalid ID format
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager
- 404: `{ "error": "Marché non trouvé" }` - Market not found

**Example Request**:
```bash
GET /api/admin/markets/1
Authorization: Bearer <token>
```

---

### 3. Create Market

**POST** `/api/admin/markets`

**Purpose**: Create a new geographical market

**Request Body**:
```json
{
  "name": "Switzerland",
  "code": "CH",
  "currency_code": "CHF",
  "timezone": "Europe/Zurich",
  "supported_languages": ["fr", "de", "it", "en"],
  "is_active": true
}
```

**Validation Rules**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | Yes | 1-100 chars |
| code | string | Yes | 2-3 uppercase letters, unique |
| currency_code | string | Yes | ISO 4217 (EUR, CHF, USD, GBP, CAD, JPY) |
| timezone | string | Yes | Valid IANA timezone |
| supported_languages | string[] | No | ISO 639-1 codes, default ["fr"] |
| is_active | boolean | No | Default true |

**Success Response** (201):
```json
{
  "data": {
    "id": 3,
    "name": "Switzerland",
    "code": "CH",
    "currency_code": "CHF",
    "timezone": "Europe/Zurich",
    "supported_languages": ["fr", "de", "it", "en"],
    "is_active": true,
    "created_at": "2025-11-12T10:00:00Z",
    "updated_at": "2025-11-12T10:00:00Z"
  }
}
```

**Error Responses**:
- 400: `{ "error": "Validation échouée", "details": {...} }` - Invalid input
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager
- 409: `{ "error": "Code de marché déjà existant" }` - Duplicate code
- 500: `{ "error": "Erreur lors de la création" }` - Server error

**Validation Example**:
```typescript
import { z } from 'zod';

const createMarketSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().regex(/^[A-Z]{2,3}$/),
  currency_code: z.enum(['EUR', 'CHF', 'USD', 'GBP', 'CAD', 'JPY']),
  timezone: z.string().min(1),
  supported_languages: z.array(z.string().regex(/^[a-z]{2}$/)).default(['fr']),
  is_active: z.boolean().default(true),
});
```

---

### 4. Update Market

**PUT** `/api/admin/markets/:id`

**Purpose**: Update existing market configuration

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Market ID |

**Request Body** (partial update supported):
```json
{
  "name": "France Métropolitaine",
  "supported_languages": ["fr", "en", "es"],
  "is_active": true
}
```

**Validation Rules**: Same as Create Market (all fields optional for update)

**Success Response** (200):
```json
{
  "data": {
    "id": 1,
    "name": "France Métropolitaine",
    "code": "FR",
    "currency_code": "EUR",
    "timezone": "Europe/Paris",
    "supported_languages": ["fr", "en", "es"],
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-11-12T11:30:00Z"
  }
}
```

**Error Responses**:
- 400: `{ "error": "Validation échouée", "details": {...} }` - Invalid input
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager
- 404: `{ "error": "Marché non trouvé" }` - Market not found
- 409: `{ "error": "Code de marché déjà existant" }` - Duplicate code (if code changed)
- 500: `{ "error": "Erreur lors de la mise à jour" }` - Server error

**Implementation Notes**:
- Use `updated_at` trigger (auto-updates timestamp)
- Validate timezone against `pg_timezone_names`
- Prevent changing code if contractors/services already assigned

---

### 5. Deactivate Market (Soft Delete)

**DELETE** `/api/admin/markets/:id`

**Purpose**: Soft delete market by setting `is_active = false`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Market ID |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| force | boolean | No | false | If true, deactivate even with active contractors |

**Success Response** (200):
```json
{
  "data": {
    "id": 1,
    "is_active": false,
    "updated_at": "2025-11-12T12:00:00Z"
  }
}
```

**Error Responses**:
- 400: `{ "error": "ID de marché invalide" }` - Invalid ID format
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager
- 404: `{ "error": "Marché non trouvé" }` - Market not found
- 409: `{ "error": "Impossible de désactiver: 42 prestataires actifs assignés", "details": { "contractors": 42 } }` - Has active contractors (if force=false)
- 500: `{ "error": "Erreur lors de la désactivation" }` - Server error

**Implementation Notes**:
- Never hard delete (preserve data integrity)
- Check for active contractors: `SELECT COUNT(*) FROM contractors WHERE market_id = $1 AND is_active = true`
- If `force=true`, allow deactivation but warn user
- Deactivated markets don't appear in dropdowns for new assignments

---

### 6. Get Market Statistics

**GET** `/api/admin/markets/:id/stats`

**Purpose**: Get detailed statistics for a market

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Market ID |

**Success Response** (200):
```json
{
  "data": {
    "market_id": 1,
    "market_name": "France",
    "market_code": "FR",
    "contractors": {
      "total": 42,
      "active": 38,
      "inactive": 4
    },
    "clients": {
      "total": 128,
      "active": 120,
      "inactive": 8
    },
    "services": {
      "total": 15,
      "available": 15,
      "unavailable": 0
    },
    "bookings": {
      "total": 356,
      "pending": 12,
      "confirmed": 280,
      "completed": 60,
      "cancelled": 4
    },
    "revenue": {
      "total_cents": 456789,
      "currency_code": "EUR",
      "formatted": "4 567,89 €"
    }
  }
}
```

**Error Responses**:
- 400: `{ "error": "ID de marché invalide" }` - Invalid ID format
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager
- 404: `{ "error": "Marché non trouvé" }` - Market not found

---

## TypeScript Types

```typescript
// types/market.ts

export interface Market {
  id: number;
  name: string;
  code: string;
  currency_code: string;
  timezone: string;
  supported_languages: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketWithCounts extends Market {
  _count: {
    contractors: number;
    services: number;
    clients?: number;
  };
}

export interface MarketListResponse {
  data: {
    markets: MarketWithCounts[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface MarketResponse {
  data: Market;
}

export interface MarketStatsResponse {
  data: {
    market_id: number;
    market_name: string;
    market_code: string;
    contractors: {
      total: number;
      active: number;
      inactive: number;
    };
    clients: {
      total: number;
      active: number;
      inactive: number;
    };
    services: {
      total: number;
      available: number;
      unavailable: number;
    };
    bookings: {
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    revenue: {
      total_cents: number;
      currency_code: string;
      formatted: string;
    };
  };
}

export interface CreateMarketInput {
  name: string;
  code: string;
  currency_code: string;
  timezone: string;
  supported_languages?: string[];
  is_active?: boolean;
}

export interface UpdateMarketInput {
  name?: string;
  code?: string;
  currency_code?: string;
  timezone?: string;
  supported_languages?: string[];
  is_active?: boolean;
}
```

---

## Zod Validation Schemas

```typescript
// lib/validations/market-schemas.ts

import { z } from 'zod';

export const currencyCodeEnum = z.enum(['EUR', 'CHF', 'USD', 'GBP', 'CAD', 'JPY']);

export const createMarketSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  code: z.string()
    .regex(/^[A-Z]{2,3}$/, 'Code invalide (2-3 lettres majuscules)')
    .transform(val => val.toUpperCase()),
  currency_code: currencyCodeEnum,
  timezone: z.string().min(1, 'Fuseau horaire requis'),
  supported_languages: z.array(
    z.string().regex(/^[a-z]{2}$/, 'Code langue invalide (ISO 639-1)')
  ).default(['fr']),
  is_active: z.boolean().default(true),
});

export const updateMarketSchema = createMarketSchema.partial();

export const listMarketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'code', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
```

---

## Error Handling

**Standard Error Format**:
```json
{
  "error": "Message d'erreur principal",
  "details": {
    "field": "Erreur spécifique au champ"
  }
}
```

**HTTP Status Codes**:
- 200: Success (GET, PUT, DELETE)
- 201: Created (POST)
- 400: Bad Request (validation errors)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not admin/manager)
- 404: Not Found
- 409: Conflict (duplicate code, active contractors)
- 500: Internal Server Error

---

## Security

**Authentication**:
- All endpoints require Supabase JWT authentication
- Check `auth.uid()` is not null
- Verify `auth.role()` IN ('admin', 'manager')

**RLS Bypass**:
- Admin users bypass market filtering RLS policies
- Use service role key for admin operations (server-side only)

**Input Sanitization**:
- Validate all inputs with Zod schemas
- Sanitize search queries to prevent SQL injection
- Escape special characters in ILIKE patterns

---

## Rate Limiting

**Not implemented in MVP** - Future enhancement:
- 100 requests/minute per admin user
- 1000 requests/hour per admin user
- Implement via Vercel Edge Config or Upstash Redis

---

## Testing

**Unit Tests** (Vitest):
```typescript
describe('GET /api/admin/markets', () => {
  it('returns 401 if not authenticated', async () => {
    const response = await fetch('/api/admin/markets');
    expect(response.status).toBe(401);
  });

  it('returns 403 if not admin/manager', async () => {
    const response = await fetch('/api/admin/markets', {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    expect(response.status).toBe(403);
  });

  it('returns markets list for admin', async () => {
    const response = await fetch('/api/admin/markets', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.markets).toBeInstanceOf(Array);
  });
});
```

---

## Next Steps

See [codes-api.md](./codes-api.md) for client/contractor code management endpoints and [rls-policies.md](./rls-policies.md) for complete RLS policy specifications.
