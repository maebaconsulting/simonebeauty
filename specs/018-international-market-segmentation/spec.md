# Feature Specification: International Market Segmentation with Unique Codes

**Feature Branch**: `018-international-market-segmentation`
**Created**: 2025-11-12
**Status**: Draft
**Input**: "Système de segmentation internationale avec codes uniques pour clients et prestataires. La plateforme doit supporter plusieurs marchés (FR, BE, CH, etc.) avec une gestion claire des objets par marché. Chaque client reçoit un code unique numérique auto-incrémenté format CLI-XXXXXX (ex: CLI-000001, CLI-000002). Chaque contractor reçoit un code unique numérique auto-incrémenté format CTR-XXXXXX (ex: CTR-000001, CTR-000002). Table markets avec currency, timezone, languages[], is_active. Contractors assignés à UN seul marché (market_id NOT NULL). Services/produits disponibles sur PLUSIEURS marchés (available_markets jsonb[]). Pricing localisé par marché. RLS policies filtrées par marché. Séquences PostgreSQL pour auto-increment. Triggers pour assigner codes automatiquement lors de l'insertion. Migration pour données existantes. Admin peut gérer les marchés, assigner clients/contractors aux marchés. Interface admin pour voir codes uniques dans listings."

## User Scenarios & Testing

### User Story 1 - Market Configuration (Priority: P1)

As a platform administrator, I need to configure and manage different geographical markets so that the platform can operate in multiple countries with appropriate regional settings.

**Why this priority**: This is foundational infrastructure. Without defined markets, no other market-specific features can function. This represents the minimum viable foundation for international expansion.

**Independent Test**: Can be fully tested by creating, editing, and deactivating markets through the admin interface, and verifying that each market stores correct currency, timezone, and language settings. Delivers immediate value by establishing the organizational structure for international operations.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I navigate to the markets management page, **Then** I see a list of all configured markets with their currency, timezone, languages, and active status
2. **Given** I am on the markets page, **When** I click "Add Market" and enter details (name: "France", code: "FR", currency: "EUR", timezone: "Europe/Paris", languages: ["fr"], is_active: true), **Then** the new market is created and appears in the markets list
3. **Given** I have an existing market, **When** I edit the market to change its timezone or add/remove languages, **Then** the changes are saved and reflected immediately
4. **Given** I have a market with assigned contractors, **When** I attempt to delete or deactivate the market, **Then** I receive appropriate warnings about dependent data
5. **Given** I am viewing the markets list, **When** I filter by active/inactive status, **Then** only markets matching that status are displayed

---

### User Story 2 - Automatic Unique Code Generation (Priority: P2)

As the system, I need to automatically assign unique, sequential codes to clients and contractors upon account creation so that each user has a human-readable identifier for administrative and customer service purposes.

**Why this priority**: Once markets exist, we need reliable user identification. This enables customer service, reporting, and administrative workflows. It's independent of market assignment and can be tested separately.

**Independent Test**: Can be tested by creating new client and contractor accounts and verifying that each receives a unique code in the correct format (CLI-XXXXXX for clients, CTR-XXXXXX for contractors). Codes should be sequential and never duplicate.

**Acceptance Scenarios**:

1. **Given** a new client registers an account, **When** the account creation completes, **Then** the client is automatically assigned a unique code starting with "CLI-" followed by a 6-digit zero-padded number (e.g., CLI-000001, CLI-000042, CLI-001337)
2. **Given** a new contractor application is approved, **When** the contractor account is created, **Then** the contractor is automatically assigned a unique code starting with "CTR-" followed by a 6-digit zero-padded number (e.g., CTR-000001, CTR-000023)
3. **Given** 50 clients already exist in the system, **When** a new client registers, **Then** they receive code CLI-000051 (next in sequence)
4. **Given** multiple clients register simultaneously, **When** their accounts are created concurrently, **Then** each receives a unique code with no duplicates or gaps
5. **Given** existing client and contractor data without codes, **When** the migration runs, **Then** all existing users receive codes in creation order

---

### User Story 3 - Code Display in Admin Interface (Priority: P3)

As an administrator, I need to see client and contractor unique codes in all listing and detail views so that I can quickly identify and reference specific users in customer service and administrative tasks.

**Why this priority**: This builds on the code generation feature (P2) by making codes visible and useful. It's a UI enhancement that improves administrative efficiency but doesn't add new data capabilities.

**Independent Test**: Can be tested by viewing client and contractor lists in the admin interface and verifying that codes are displayed prominently alongside names and other identifying information.

**Acceptance Scenarios**:

1. **Given** I am viewing the clients list as an admin, **When** the page loads, **Then** each client row displays their unique code (CLI-XXXXXX) in a prominent column
2. **Given** I am viewing the contractors list as an admin, **When** the page loads, **Then** each contractor row displays their unique code (CTR-XXXXXX) in a prominent column
3. **Given** I am viewing a specific client's detail page, **When** the page loads, **Then** the client's unique code is displayed in the header or summary section
4. **Given** I am searching for a client, **When** I enter a code (e.g., "CLI-000123") in the search field, **Then** the matching client is found and displayed
5. **Given** I am exporting client or contractor data, **When** I download the CSV/Excel file, **Then** the unique codes are included as a column

---

### User Story 4 - Contractor Market Assignment (Priority: P4)

As an administrator, I need to assign each contractor to a specific market so that contractors only see and handle bookings from their designated geographical region.

**Why this priority**: This implements the core market segmentation logic for contractors. It depends on markets existing (P1) but is independent of client assignment and service availability. This enables regional operations management.

**Independent Test**: Can be tested by assigning contractors to different markets and verifying that each contractor is associated with exactly one market, with appropriate validation preventing contractors from being unassigned or assigned to multiple markets.

**Acceptance Scenarios**:

1. **Given** I am creating a new contractor profile as an admin, **When** I fill in contractor details, **Then** I must select a market from a dropdown of active markets before saving
2. **Given** I have an existing contractor, **When** I view their profile, **Then** I can see their assigned market clearly displayed
3. **Given** I am editing a contractor's profile, **When** I change their assigned market from "France" to "Belgium", **Then** the change is saved and their access is updated to the new market
4. **Given** a contractor is assigned to the "France" market, **When** they log in to view booking requests, **Then** they only see requests from clients in the France market
5. **Given** I deactivate a market, **When** I attempt to assign or reassign contractors to that market, **Then** the deactivated market does not appear in the selection dropdown

---

### User Story 5 - Service Multi-Market Availability (Priority: P5)

As an administrator, I need to configure which markets each service is available in so that services can be offered in multiple countries with market-specific pricing and settings.

**Why this priority**: This enables the business to expand services across markets with localized pricing. It depends on markets existing (P1) but is independent of user assignment. This is a revenue-enabler but not critical for basic operations.

**Independent Test**: Can be tested by configuring a service to be available in specific markets (e.g., "Haircut" available in FR, BE, CH) with different prices per market, and verifying that the service appears correctly for users in those markets.

**Acceptance Scenarios**:

1. **Given** I am creating or editing a service, **When** I configure market availability, **Then** I can select multiple markets where this service should be offered
2. **Given** I am configuring a service for multiple markets, **When** I set pricing, **Then** I can specify different prices for each market in the appropriate currency
3. **Given** a service is available in France (EUR) and Switzerland (CHF), **When** a French client views the service, **Then** they see the price in EUR
4. **Given** a service is available in France (EUR) and Switzerland (CHF), **When** a Swiss client views the service, **Then** they see the price in CHF
5. **Given** I disable a market in the service configuration, **When** clients from that market browse services, **Then** the service is no longer visible or bookable for them

---

### User Story 6 - Market-Filtered Data Access (Priority: P6)

As a client or contractor, I need to only see data (services, bookings, contractors) relevant to my market so that my experience is localized and I don't see irrelevant information from other geographical regions.

**Why this priority**: This provides the user-facing experience of market segmentation. It depends on all previous features being in place and represents the final layer of the segmentation system. This is important for user experience but not critical for basic operations.

**Independent Test**: Can be tested by creating users in different markets and verifying that each user only sees services, contractors, and bookings from their assigned market.

**Acceptance Scenarios**:

1. **Given** I am a client in the France market, **When** I browse available services, **Then** I only see services configured for the France market
2. **Given** I am a contractor in the Belgium market, **When** I view booking requests, **Then** I only see requests from clients in the Belgium market
3. **Given** I am a client in Switzerland, **When** I search for contractors, **Then** I only see contractors assigned to the Switzerland market
4. **Given** I am an admin viewing booking data, **When** I filter by market, **Then** I can see bookings from all markets or filter to a specific market
5. **Given** data access policies are enforced, **When** a user attempts to directly access data from another market (via URL manipulation), **Then** access is denied with an appropriate error

---

### Edge Cases

- What happens when a contractor's assigned market is deactivated? Should the contractor be automatically unassigned, or should they retain their assignment to an inactive market?
- How does the system handle code generation if the sequence reaches CLI-999999 or CTR-999999? Should it wrap around, extend to 7 digits, or prevent new registrations?
- What happens when existing data is migrated and multiple users have the same creation timestamp? How is the sequential code order determined?
- How does the system handle a service that is configured for a market but has no contractors available in that market?
- What happens when a client's market preference doesn't match the contractor's market on an existing booking?
- How does the system handle timezone conversions for bookings when clients and contractors are in different timezones within the same market?
- What happens when an admin attempts to delete a market that has active bookings, contractors, or clients assigned to it?
- How does pricing work when a service is available in multiple markets with different currencies but a client travels and wants to book in a different market?

## Requirements

### Functional Requirements

- **FR-001**: System MUST store market configuration including name, code, currency code (ISO 4217), timezone (IANA timezone identifier), supported languages (ISO 639-1 codes), and active status
- **FR-002**: System MUST automatically generate and assign a unique client code in format CLI-XXXXXX (where X is a zero-padded digit) to every new client account upon creation
- **FR-003**: System MUST automatically generate and assign a unique contractor code in format CTR-XXXXXX (where X is a zero-padded digit) to every new contractor account upon creation
- **FR-004**: System MUST ensure client codes and contractor codes are sequential, starting from 000001, with no gaps or duplicates
- **FR-005**: System MUST use database sequences (PostgreSQL SEQUENCE) for atomic, concurrent-safe code generation
- **FR-006**: System MUST use database triggers to automatically assign codes during INSERT operations, ensuring codes are always present
- **FR-007**: System MUST require every contractor to be assigned to exactly one market (market_id NOT NULL foreign key)
- **FR-008**: System MUST allow services to be available in multiple markets, storing market availability as an array or junction table
- **FR-009**: System MUST allow administrators to create, read, update, and deactivate (soft delete) markets
- **FR-010**: System MUST allow administrators to assign or reassign contractors to markets
- **FR-011**: System MUST display client codes (CLI-XXXXXX) in all admin client listing and detail views
- **FR-012**: System MUST display contractor codes (CTR-XXXXXX) in all admin contractor listing and detail views
- **FR-013**: System MUST allow searching for clients and contractors by their unique codes
- **FR-014**: System MUST store market-specific pricing for services, allowing different prices in different currencies
- **FR-015**: System MUST enforce row-level security (RLS) policies that filter data by market for non-admin users
- **FR-016**: System MUST provide a migration script that assigns codes to all existing clients and contractors in order of account creation date
- **FR-017**: System MUST prevent deletion of markets that have assigned contractors, clients, or active bookings
- **FR-018**: System MUST allow admins to view and filter data across all markets regardless of RLS policies
- **FR-019**: System MUST display prices in the appropriate currency for the user's market
- **FR-020**: System MUST support multiple languages per market, with language selection based on user preference or market default

### Key Entities

- **Market**: Represents a geographical region or country where the platform operates. Key attributes include unique identifier, name (e.g., "France"), code (e.g., "FR"), currency code (e.g., "EUR"), timezone (e.g., "Europe/Paris"), supported languages (e.g., ["fr", "en"]), and active status. Markets are configured by administrators and serve as the top-level organizational unit for segmentation.

- **Client Code Sequence**: A database sequence that generates sequential integers for client unique codes. Starts at 1 and increments atomically for each new client. Used by trigger to generate CLI-XXXXXX format codes.

- **Contractor Code Sequence**: A database sequence that generates sequential integers for contractor unique codes. Starts at 1 and increments atomically for each new contractor. Used by trigger to generate CTR-XXXXXX format codes.

- **Client (Enhanced)**: Existing client entity extended with a unique code field (client_code VARCHAR, e.g., "CLI-000042") and optional market assignment for market-based filtering. Code is automatically generated on account creation.

- **Contractor (Enhanced)**: Existing contractor entity extended with a unique code field (contractor_code VARCHAR, e.g., "CTR-000123") and mandatory market assignment (market_id foreign key NOT NULL). Code is automatically generated on contractor approval/creation.

- **Service Market Availability**: Represents the many-to-many relationship between services and markets. Indicates which markets a service is offered in, with optional market-specific pricing overrides. A service can be available in zero, one, or many markets.

- **Market-Specific Pricing**: Pricing configuration for a service in a specific market. Includes price amount, currency code, and optional special rates or discounts for that market.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Administrators can create and configure a new market (including name, currency, timezone, languages) in under 2 minutes without errors
- **SC-002**: Every new client and contractor account receives a unique code automatically within 1 second of account creation, with 100% reliability
- **SC-003**: Client and contractor codes are visible in all admin listing views, reducing customer service inquiry response time by 40%
- **SC-004**: Zero duplicate codes are generated even under concurrent account creation loads of up to 100 simultaneous registrations
- **SC-005**: Existing data migration completes successfully for databases with up to 10,000 clients and contractors, assigning codes to all users within 5 minutes
- **SC-006**: Contractors only see bookings from their assigned market, with zero data leakage between markets verified through security testing
- **SC-007**: Services can be configured for multiple markets with market-specific pricing, and clients see prices in their market's currency with 100% accuracy
- **SC-008**: Admin users can search for clients or contractors by unique code and find results in under 1 second
- **SC-009**: Market segmentation reduces UI clutter for users, with 90% of users reporting that they find their experience more relevant and localized in user testing
- **SC-010**: System handles market deactivation gracefully, preventing assignment of new contractors while preserving existing data integrity
