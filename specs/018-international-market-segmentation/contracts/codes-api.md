# API Contract: Unique Code Management

**Feature**: 018-international-market-segmentation
**Date**: 2025-11-12
**Status**: Phase 1 Design

## Overview

This document specifies API endpoints for client and contractor unique code generation, display, and search functionality. Codes are automatically generated via database triggers, but these endpoints provide search and display capabilities for admin interfaces.

---

## Client Codes (CLI-XXXXXX)

### 1. Search Clients by Code

**GET** `/api/admin/clients`

**Purpose**: Search and list clients with their unique codes

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | - | Search by code, email, name |
| page | number | No | 1 | Page number (1-indexed) |
| limit | number | No | 20 | Items per page (max 100) |
| sort | string | No | 'created_at' | Sort field (client_code, email, created_at) |
| order | string | No | 'desc' | Sort order (asc, desc) |

**Success Response** (200):
```json
{
  "data": {
    "clients": [
      {
        "id": "uuid-here",
        "client_code": "CLI-000042",
        "email": "alice@example.com",
        "first_name": "Alice",
        "last_name": "Dupont",
        "phone": "+33612345678",
        "role": "client",
        "created_at": "2025-02-15T10:30:00Z",
        "updated_at": "2025-02-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 128,
      "pages": 7
    }
  }
}
```

**Error Responses**:
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager

**Search Behavior**:
- Exact match on `client_code`: `search=CLI-000042` → finds CLI-000042
- Partial match on email: `search=alice` → finds alice@example.com
- Partial match on name: `search=dupont` → finds "Alice Dupont"
- Case-insensitive (ILIKE query)

**Example Requests**:
```bash
# Search by exact code
GET /api/admin/clients?search=CLI-000042

# Search by email fragment
GET /api/admin/clients?search=alice

# Sort by code ascending
GET /api/admin/clients?sort=client_code&order=asc

# Paginated results
GET /api/admin/clients?page=2&limit=50
```

---

### 2. Get Client by Code

**GET** `/api/admin/clients/:code`

**Purpose**: Fetch client details by unique code

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Client code (CLI-XXXXXX format) |

**Success Response** (200):
```json
{
  "data": {
    "id": "uuid-here",
    "client_code": "CLI-000042",
    "email": "alice@example.com",
    "first_name": "Alice",
    "last_name": "Dupont",
    "phone": "+33612345678",
    "role": "client",
    "created_at": "2025-02-15T10:30:00Z",
    "updated_at": "2025-02-15T10:30:00Z",
    "_count": {
      "bookings": 12,
      "addresses": 2
    }
  }
}
```

**Error Responses**:
- 400: `{ "error": "Code client invalide" }` - Invalid format (not CLI-XXXXXX)
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager
- 404: `{ "error": "Client non trouvé" }` - Client not found

**Validation**:
```typescript
const clientCodeRegex = /^CLI-\d{6}$/;
if (!clientCodeRegex.test(code)) {
  return { error: 'Code client invalide' };
}
```

---

## Contractor Codes (CTR-XXXXXX)

### 3. Search Contractors by Code

**GET** `/api/admin/contractors`

**Purpose**: Search and list contractors with their unique codes

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | - | Search by code, business name, email |
| market_id | number | No | - | Filter by market |
| is_active | boolean | No | - | Filter by active status |
| page | number | No | 1 | Page number (1-indexed) |
| limit | number | No | 20 | Items per page (max 100) |
| sort | string | No | 'created_at' | Sort field (contractor_code, business_name, created_at) |
| order | string | No | 'desc' | Sort order (asc, desc) |

**Success Response** (200):
```json
{
  "data": {
    "contractors": [
      {
        "id": 1,
        "contractor_code": "CTR-000123",
        "business_name": "Marie's Salon",
        "professional_title": "Coiffeuse professionnelle",
        "email": "marie@salon.fr",
        "phone": "+33698765432",
        "market_id": 1,
        "market": {
          "id": 1,
          "name": "France",
          "code": "FR"
        },
        "is_active": true,
        "created_at": "2025-03-10T14:00:00Z",
        "updated_at": "2025-03-10T14:00:00Z",
        "_count": {
          "bookings": 45,
          "services": 8
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "pages": 3
    }
  }
}
```

**Error Responses**:
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager

**Example Requests**:
```bash
# Search by exact code
GET /api/admin/contractors?search=CTR-000123

# Filter by market
GET /api/admin/contractors?market_id=1

# Active contractors only
GET /api/admin/contractors?is_active=true

# Combined filters
GET /api/admin/contractors?market_id=1&is_active=true&search=marie
```

---

### 4. Get Contractor by Code

**GET** `/api/admin/contractors/:code`

**Purpose**: Fetch contractor details by unique code

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Contractor code (CTR-XXXXXX format) |

**Success Response** (200):
```json
{
  "data": {
    "id": 1,
    "contractor_code": "CTR-000123",
    "business_name": "Marie's Salon",
    "professional_title": "Coiffeuse professionnelle",
    "email": "marie@salon.fr",
    "phone": "+33698765432",
    "market_id": 1,
    "market": {
      "id": 1,
      "name": "France",
      "code": "FR",
      "currency_code": "EUR"
    },
    "is_active": true,
    "created_at": "2025-03-10T14:00:00Z",
    "updated_at": "2025-03-10T14:00:00Z",
    "_count": {
      "bookings": 45,
      "services": 8,
      "upcoming_bookings": 3
    }
  }
}
```

**Error Responses**:
- 400: `{ "error": "Code prestataire invalide" }` - Invalid format (not CTR-XXXXXX)
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager
- 404: `{ "error": "Prestataire non trouvé" }` - Contractor not found

---

## Code Migration Endpoint

### 5. Trigger Code Backfill Migration

**POST** `/api/admin/migrations/assign-codes`

**Purpose**: Manually trigger code assignment for existing users (admin-only, used during initial migration)

**Request Body**:
```json
{
  "dry_run": true,
  "batch_size": 1000
}
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| dry_run | boolean | No | false | If true, simulate migration without writing |
| batch_size | number | No | 1000 | Number of records to process per batch |

**Success Response** (200):
```json
{
  "data": {
    "clients": {
      "total": 128,
      "processed": 128,
      "assigned": 128,
      "skipped": 0,
      "next_sequence": 129
    },
    "contractors": {
      "total": 42,
      "processed": 42,
      "assigned": 42,
      "skipped": 0,
      "next_sequence": 43
    },
    "duration_ms": 1234,
    "dry_run": true
  }
}
```

**Error Responses**:
- 401: `{ "error": "Non autorisé" }` - Not authenticated
- 403: `{ "error": "Non autorisé" }` - Not admin/manager
- 500: `{ "error": "Erreur lors de la migration", "details": {...} }` - Migration error

**Implementation Notes**:
- Check `auth.role() = 'admin'` (manager not allowed for migrations)
- Use PostgreSQL transaction for atomicity
- Process in batches to avoid long-running locks
- Set sequence values after backfill: `SELECT setval('client_code_seq', ...)`
- Log migration progress for auditing

**Example Request**:
```bash
# Dry run first
POST /api/admin/migrations/assign-codes
Content-Type: application/json
{ "dry_run": true }

# Execute migration
POST /api/admin/migrations/assign-codes
Content-Type: application/json
{ "dry_run": false, "batch_size": 500 }
```

---

## Code Display Components

### Client Code Display (Frontend)

**Component**: `components/admin/CodeDisplay.tsx`

**Usage**:
```tsx
<CodeDisplay type="client" code="CLI-000042" />
```

**Features**:
- Monospace font for readability
- Copy to clipboard on click
- Color-coded by type (blue for CLI, green for CTR)
- Tooltip showing "Copied!" on click

**Example**:
```tsx
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeDisplayProps {
  type: 'client' | 'contractor';
  code: string;
}

export function CodeDisplay({ type, code }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1 rounded font-mono text-sm cursor-pointer hover:bg-gray-100"
    >
      <span className={type === 'client' ? 'text-blue-600' : 'text-green-600'}>
        {code}
      </span>
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </div>
  );
}
```

---

## TypeScript Types

```typescript
// types/code.ts

export interface ClientWithCode {
  id: string;
  client_code: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  _count?: {
    bookings: number;
    addresses: number;
  };
}

export interface ContractorWithCode {
  id: number;
  contractor_code: string;
  business_name: string;
  professional_title: string | null;
  email: string;
  phone: string | null;
  market_id: number;
  market?: {
    id: number;
    name: string;
    code: string;
    currency_code?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    bookings: number;
    services: number;
    upcoming_bookings?: number;
  };
}

export interface MigrationResult {
  data: {
    clients: {
      total: number;
      processed: number;
      assigned: number;
      skipped: number;
      next_sequence: number;
    };
    contractors: {
      total: number;
      processed: number;
      assigned: number;
      skipped: number;
      next_sequence: number;
    };
    duration_ms: number;
    dry_run: boolean;
  };
}
```

---

## Zod Validation Schemas

```typescript
// lib/validations/code-schemas.ts

import { z } from 'zod';

export const clientCodeSchema = z.string().regex(
  /^CLI-\d{6}$/,
  'Code client invalide (format: CLI-XXXXXX)'
);

export const contractorCodeSchema = z.string().regex(
  /^CTR-\d{6}$/,
  'Code prestataire invalide (format: CTR-XXXXXX)'
);

export const searchClientsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['client_code', 'email', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchContractorsQuerySchema = z.object({
  search: z.string().optional(),
  market_id: z.coerce.number().int().positive().optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['contractor_code', 'business_name', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const migrationRequestSchema = z.object({
  dry_run: z.boolean().default(false),
  batch_size: z.number().int().min(100).max(10000).default(1000),
});
```

---

## React Query Hooks

```typescript
// hooks/useClientCode.ts

import { useQuery } from '@tanstack/react-query';
import type { ClientWithCode } from '@/types/code';

export function useClientByCode(code: string) {
  return useQuery({
    queryKey: ['client', 'code', code],
    queryFn: async () => {
      const res = await fetch(`/api/admin/clients/${code}`);
      if (!res.ok) throw new Error('Client non trouvé');
      const data = await res.json();
      return data.data as ClientWithCode;
    },
    enabled: /^CLI-\d{6}$/.test(code),
  });
}

// hooks/useContractorCode.ts

export function useContractorByCode(code: string) {
  return useQuery({
    queryKey: ['contractor', 'code', code],
    queryFn: async () => {
      const res = await fetch(`/api/admin/contractors/${code}`);
      if (!res.ok) throw new Error('Prestataire non trouvé');
      const data = await res.json();
      return data.data as ContractorWithCode;
    },
    enabled: /^CTR-\d{6}$/.test(code),
  });
}
```

---

## Performance Targets

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Search by code | <1s | B-tree index on client_code, contractor_code |
| List clients (paginated) | <500ms | Partial index + LIMIT clause |
| List contractors (filtered) | <500ms | Composite index on (market_id, is_active) |
| Migration (10K users) | <5min | Batched updates (1000 rows/batch) |

---

## Security Considerations

**Access Control**:
- All endpoints require admin/manager role
- RLS policies ensure data isolation by market
- No client-side code generation (database-only)

**Input Validation**:
- Validate code format with regex before query
- Sanitize search queries to prevent SQL injection
- Escape special characters in ILIKE patterns

**Rate Limiting** (future):
- Migration endpoint: 1 request per 10 minutes per admin
- Search endpoints: 100 requests per minute per admin

---

## Next Steps

See [markets-api.md](./markets-api.md) for market management endpoints and [rls-policies.md](./rls-policies.md) for complete RLS policy specifications.
