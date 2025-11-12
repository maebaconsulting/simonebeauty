# Feature Specification: Gestion des Fuseaux Horaires

**Feature Branch**: `016-timezone-management`
**Created**: 2025-11-10
**Status**: Draft
**Input**: "Gestion robuste des fuseaux horaires pour éviter les décalages de 1-2h dans les notifications aux prestataires, notamment lors des transitions heure d'été/hiver (DST). Dans l'application legacy, les messages étaient parfois envoyés avec 1-2h de décalage et les transitions DST compliquaient le problème."

## User Scenarios & Testing

### User Story 1 - Client Réserve à l'Heure Locale Correcte (Priority: P1)

Un client en France sélectionne un créneau horaire (ex: "30 mars 2025 à 14:00") pour une prestation. Cette heure doit être stockée sans ambiguïté et respectée même lors du passage à l'heure d'été le jour même de la transition DST.

**Why this priority**: Sans cela, décalages de 1-2h systématiques causent une mauvaise expérience utilisateur et des prestataires qui ne sont pas disponibles à l'heure attendue. Problème critique reporté de l'app legacy. MVP absolu.

**Independent Test**: Peut être testé en créant une réservation le 30 mars 2025 à 14:00 (jour de transition DST) et en vérifiant que le prestataire reçoit la notification avec exactement "14:00" heure locale. Délivre la valeur : "Client obtient le créneau exact qu'il a sélectionné".

**Acceptance Scenarios**:

1. **Given** un client en France (UTC+1 en hiver) accédant à la page de sélection de créneau le 15 février 2025, **When** il sélectionne "30 mars 2025 à 14:00" et confirme la réservation, **Then** le système stocke cette heure en UTC (13:00 UTC avant DST, 12:00 UTC après DST) avec le contexte de timezone "Europe/Paris" et l'heure locale sélectionnée "14:00", et le prestataire consulte la réservation et voit "30 mars 2025 à 14:00" sans ambiguïté
2. **Given** un client sélectionnant un créneau "30 mars 2025 à 14:00" (AVANT la transition DST qui a lieu ce jour-là à 02:00), **When** le système stocke la réservation, **Then** le timestamp UTC est calculé correctement en tenant compte que le 30 mars à 14:00 sera en UTC+2 (CEST), donc 12:00 UTC, et non 13:00 UTC
3. **Given** une réservation créée le 15 février pour le "30 mars à 14:00", **When** la transition DST a lieu le 30 mars à 02:00 (passage de UTC+1 à UTC+2), **Then** les notifications envoyées ce jour-là utilisent l'heure correcte 14:00 CEST (12:00 UTC) et pas 14:00 CET (13:00 UTC)
4. **Given** un client consultant sa réservation depuis différents appareils (mobile, desktop) et à différents moments (avant et après DST), **When** il visualise les détails, **Then** l'heure affichée reste toujours cohérente "14:00" heure locale française, quel que soit l'appareil ou la date de consultation
5. **Given** un client en France créant une réservation pour le 15 novembre 2025 à 14:00 (heure d'hiver, UTC+1), **When** le système stocke la réservation, **Then** le timestamp UTC est 13:00 UTC et le contexte timezone "Europe/Paris" est sauvegardé

---

### User Story 2 - Prestataire Reçoit Notifications à l'Heure Exacte (Priority: P1)

Un prestataire reçoit des notifications de nouvelles réservations et des rappels de rendez-vous avec l'heure exacte sans décalage horaire, même lors des transitions DST.

**Why this priority**: Problème critique reporté de l'application legacy où les messages étaient envoyés avec 1-2h de décalage, causant confusion et conflits de planning. Les prestataires se présentaient à la mauvaise heure. MVP absolu.

**Independent Test**: Peut être testé en créant une réservation et en vérifiant que l'email/SMS de notification au prestataire affiche l'heure exacte sélectionnée par le client. Délivre la valeur : "Prestataire reçoit l'information exacte au bon moment".

**Acceptance Scenarios**:

1. **Given** une nouvelle réservation créée par un client pour "demain 10:00", **When** la notification est envoyée au prestataire immédiatement, **Then** l'email/SMS affiche "Nouvelle réservation pour demain à 10:00" avec la date complète et aucun décalage horaire
2. **Given** un prestataire avec un rendez-vous programmé pour le lendemain à 10:00, **When** le système envoie un rappel J-1 à 20:00, **Then** la notification est envoyée exactement à 20:00 heure locale (pas 19:00 ni 21:00) et mentionne "Rappel : rendez-vous demain à 10:00"
3. **Given** un prestataire avec un rendez-vous le "30 mars 2025 à 14:00" (jour de transition DST), **When** il consulte son planning après la transition DST, **Then** le rendez-vous s'affiche toujours à "14:00" heure locale (UTC+2 après transition) et pas à 13:00 ni 15:00
4. **Given** un prestataire recevant un SMS de rappel 2 heures avant un rendez-vous à 14:00, **When** la transition DST a lieu entre la création de la réservation et le jour J, **Then** le SMS est envoyé à 12:00 (2h avant 14:00 en tenant compte du nouveau fuseau) et pas à 11:00 ou 13:00
5. **Given** un prestataire avec 3 rendez-vous le même jour aux heures 09:00, 14:00 et 17:00, **When** il reçoit son récapitulatif quotidien le matin, **Then** toutes les heures affichées sont correctes et cohérentes avec son planning configuré

---

### User Story 3 - Système Gère Transitions DST Automatiquement (Priority: P1)

Le système détecte et gère automatiquement les transitions heure d'été/hiver (DST - Daylight Saving Time) sans intervention manuelle ni bugs d'affichage.

**Why this priority**: Point de friction majeur dans l'app legacy. Les transitions DST causaient des bugs systématiques (rendez-vous décalés, disponibilités erronées). MVP absolu pour éviter les incidents récurrents.

**Independent Test**: Peut être testé en créant des réservations autour des dates de transition DST 2025 (30 mars pour été, 27 octobre pour hiver) et en vérifiant que toutes les heures restent cohérentes avant, pendant et après la transition. Délivre la valeur : "Système fiable toute l'année sans maintenance manuelle".

**Acceptance Scenarios**:

1. **Given** la transition "Spring Forward" le 30 mars 2025 à 02:00 (passage de UTC+1 CET à UTC+2 CEST), **When** un client a des réservations pour ce jour à 14:00, **Then** les réservations restent affichées à 14:00 heure locale (pas 13:00), le timestamp UTC passe de 13:00 UTC à 12:00 UTC automatiquement, et les notifications sont envoyées au bon moment
2. **Given** la transition "Fall Back" le 27 octobre 2025 à 03:00 (passage de UTC+2 CEST à UTC+1 CET), **When** un client a des réservations pour ce jour à 14:00, **Then** les réservations restent affichées à 14:00 heure locale (pas 15:00), le timestamp UTC passe de 12:00 UTC à 13:00 UTC automatiquement, et les rappels sont envoyés correctement
3. **Given** une réservation créée le 15 février 2025 (hiver, UTC+1) pour le 30 avril 2025 à 09:00 (été, UTC+2), **When** la transition DST a lieu le 30 mars, **Then** la réservation reste affichée à "30 avril à 09:00" sans modification, le timestamp UTC reste correct (07:00 UTC en été), et aucun ajustement manuel n'est requis
4. **Given** le planning hebdomadaire d'un prestataire configuré avec horaires 09:00-18:00, **When** le système calcule les créneaux disponibles pour une semaine chevauchant la transition DST (ex: 24-30 mars 2025), **Then** les créneaux avant le 30 mars utilisent UTC+1 et ceux après utilisent UTC+2, tous les créneaux affichés restent cohérents (09:00-18:00 chaque jour), et aucun créneau n'est "perdu" ou "dupliqué" à cause de la transition
5. **Given** un client consultant les disponibilités le 29 mars 2025 à 23:00 (1h avant la transition DST à 02:00 le 30), **When** il sélectionne un créneau pour le 30 mars à 10:00, **Then** le système utilise correctement UTC+2 pour le calcul du timestamp (08:00 UTC), la réservation est créée sans erreur, et l'heure affichée reste 10:00

---

### User Story 4 - Admin Visualise Horaires Cohérents (Priority: P2)

Un administrateur consultant le dashboard peut visualiser tous les horaires de réservations de manière cohérente avec le contexte de timezone clairement affiché.

**Why this priority**: Important pour le support client et le debugging, mais pas bloquant pour le MVP. Permet à l'équipe d'identifier rapidement les problèmes de timezone si nécessaire.

**Independent Test**: Peut être testé en consultant le dashboard admin avec des réservations dans différents timezones et en vérifiant que les horaires s'affichent correctement avec leur contexte. Délivre la valeur : "Admin peut diagnostiquer les problèmes de timezone facilement".

**Acceptance Scenarios**:

1. **Given** un admin consultant la liste des réservations sur le dashboard, **When** il visualise les colonnes d'horaires, **Then** chaque réservation affiche : la date/heure locale (ex: "30 mars 2025 à 14:00 CEST"), le timestamp UTC (ex: "12:00 UTC"), et la timezone du client (ex: "Europe/Paris")
2. **Given** un admin exportant les réservations en CSV pour analyse, **When** il télécharge le fichier, **Then** les colonnes incluent : `scheduled_date`, `scheduled_time_local`, `scheduled_time_utc`, `timezone`, `is_dst_aware` pour traçabilité complète
3. **Given** un admin filtrant les réservations par date "30 mars 2025" (jour de transition DST), **When** il consulte les résultats, **Then** toutes les réservations de ce jour sont listées correctement avec indication visuelle "Transition DST" et heures cohérentes
4. **Given** un client contactant le support pour un problème d'horaire, **When** l'admin consulte la réservation concernée, **Then** il peut voir tous les détails timezone (heure de création, timezone client, heure UTC stockée, heure locale affichée) pour diagnostiquer le problème

---

### User Story 5 - Migration des Données Existantes (Priority: P1)

Les réservations existantes stockées avec l'ancien format (DATE + TIME séparés sans timezone) doivent être migrées vers le nouveau format avec timezone sans perte de données ni corruption des horaires.

**Why this priority**: Migration critique car des réservations existent déjà en production. Une mauvaise migration causerait des décalages d'horaires pour toutes les réservations existantes. MVP absolu pour le déploiement.

**Independent Test**: Peut être testé en créant des réservations test avec l'ancien format, en exécutant la migration, et en vérifiant que toutes les heures sont préservées correctement. Délivre la valeur : "Données existantes préservées sans décalage".

**Acceptance Scenarios**:

1. **Given** une réservation existante avec `scheduled_date = '2025-03-30'` et `scheduled_time = '14:00:00'` (format ancien), **When** la migration s'exécute, **Then** le nouveau champ `scheduled_datetime` contient `'2025-03-30T14:00:00+01:00'` (ou `+02:00` selon DST), la timezone par défaut `'Europe/Paris'` est appliquée, et les anciens champs sont marqués pour suppression future
2. **Given** 1000 réservations existantes dans la base de données, **When** le script de migration s'exécute, **Then** toutes les réservations sont migrées avec succès, un rapport de migration est généré (nombre total, succès, échecs), et un backup des données originales est créé automatiquement
3. **Given** une réservation avec `scheduled_date` NULL ou `scheduled_time` NULL (données corrompues), **When** la migration s'exécute, **Then** cette réservation est marquée comme "migration_failed", un log d'erreur est créé avec l'ID de la réservation, et la migration continue pour les autres réservations
4. **Given** la migration terminée avec succès, **When** un client ou prestataire consulte une réservation existante, **Then** l'heure affichée est identique à celle affichée avant la migration, aucun décalage horaire n'est visible, et l'expérience utilisateur reste inchangée
5. **Given** des réservations futures créées après le 30 mars 2025 (après transition DST) mais stockées avant la migration, **When** la migration s'exécute, **Then** le système infère correctement si la réservation était en CET (UTC+1) ou CEST (UTC+2) selon la date, et applique le bon offset UTC

---

## Edge Cases

### Edge Case 1: Heure Inexistante (Spring Forward)
**Scenario**: Le 30 mars 2025 à 02:00, l'horloge avance à 03:00 (passage CET → CEST). Les heures entre 02:00:00 et 02:59:59 n'existent pas.

**Test Case**:
- **Given** un client tentant de réserver le "30 mars 2025 à 02:30" (heure inexistante)
- **When** il soumet le formulaire de réservation
- **Then** le système affiche une erreur explicite : "Cette heure n'existe pas en raison du passage à l'heure d'été. Veuillez sélectionner 03:00 ou ultérieur"
- **And** propose automatiquement le créneau le plus proche : "03:00" (première heure valide)

**Implementation Note**: Utiliser `date-fns-tz` qui détecte automatiquement les heures invalides et lève une erreur.

---

### Edge Case 2: Heure Ambiguë (Fall Back)
**Scenario**: Le 27 octobre 2025 à 03:00, l'horloge recule à 02:00 (passage CEST → CET). Les heures entre 02:00:00 et 02:59:59 existent deux fois (une fois en CEST, une fois en CET).

**Test Case**:
- **Given** un client tentant de réserver le "27 octobre 2025 à 02:30" (heure ambiguë)
- **When** il soumet le formulaire de réservation
- **Then** le système utilise par défaut la première occurrence (02:30 CEST = 00:30 UTC)
- **And** affiche un message informatif : "Note : Cette heure se produit deux fois en raison du changement d'heure. Nous avons sélectionné la première occurrence."

**Alternative**: Si possible, bloquer les réservations pendant la période ambiguë (02:00-03:00) le jour de la transition automne.

---

### Edge Case 3: Prestation Chevauchant la Transition DST
**Scenario**: Une prestation de 4 heures programmée de 23:00 le 29 mars à 03:00 le 30 mars chevauche la transition DST (à 02:00).

**Test Case**:
- **Given** une réservation pour un service de 4h démarrant le "29 mars 2025 à 23:00"
- **When** le système calcule l'heure de fin
- **Then** l'heure de fin affichée est "30 mars 2025 à 03:00" (heure locale correcte après DST)
- **And** la durée effective en UTC est bien 3 heures (car 1h est "sautée"), mais la durée affichée au client reste 4h (23:00 → 03:00)

**Implementation Note**: Calculer la durée en utilisant les timestamps UTC pour éviter les erreurs, puis afficher les heures locales au client.

---

### Edge Case 4: Modification de Réservation Après Transition DST
**Scenario**: Un client crée une réservation en février (hiver, UTC+1) pour avril (été, UTC+2), puis modifie la réservation en mai (après la transition).

**Test Case**:
- **Given** une réservation créée le 15 février pour le "30 avril à 14:00" (UTC+2 = 12:00 UTC)
- **When** le client modifie la réservation le 15 mai pour changer la date au "15 mai à 14:00"
- **Then** le système stocke la nouvelle heure avec le bon contexte DST (UTC+2 = 12:00 UTC)
- **And** la modification ne cause aucun décalage horaire accidentel (pas de passage à 15:00 ou 13:00)

---

### Edge Case 5: Client dans un Timezone Différent
**Scenario**: Un client se trouve temporairement dans un fuseau horaire différent (ex: voyage à New York, UTC-5) et réserve un service en France.

**Test Case**:
- **Given** un client dont le navigateur est configuré en timezone "America/New_York" (UTC-5)
- **When** il sélectionne un créneau pour un service en France
- **Then** le système affiche les créneaux en heure locale française (Europe/Paris)
- **And** stocke la réservation avec timezone "Europe/Paris" (pas "America/New_York")
- **And** la notification au prestataire français affiche "14:00" heure locale française

**Implementation Note**: Détecter la timezone du service (basée sur l'adresse de prestation) et l'utiliser pour le stockage, pas la timezone du navigateur client.

---

### Edge Case 6: Service Crossing Midnight
**Scenario**: Un service de 3 heures commence à 22:00 et se termine à 01:00 le lendemain.

**Test Case**:
- **Given** une réservation pour un service de 3h démarrant le "15 mars 2025 à 22:00"
- **When** le système calcule l'heure de fin
- **Then** l'heure de fin affichée est "16 mars 2025 à 01:00" (changement de date)
- **And** le planning du prestataire affiche correctement la prestation sur deux jours (22:00-23:59 le 15, 00:00-01:00 le 16)
- **And** les notifications de rappel sont envoyées le 15 mars (pas le 16)

---

## Technical Requirements

### Database Schema Changes

**Migration Required**:
```sql
-- Phase 1: Add new TIMESTAMPTZ column
ALTER TABLE appointment_bookings
ADD COLUMN scheduled_datetime TIMESTAMPTZ,
ADD COLUMN booking_timezone VARCHAR(50) DEFAULT 'Europe/Paris';

-- Phase 2: Migrate existing data
UPDATE appointment_bookings
SET scheduled_datetime = (scheduled_date + scheduled_time)::timestamp AT TIME ZONE 'Europe/Paris',
    booking_timezone = 'Europe/Paris'
WHERE scheduled_datetime IS NULL;

-- Phase 3: Make new column NOT NULL after migration
ALTER TABLE appointment_bookings
ALTER COLUMN scheduled_datetime SET NOT NULL;

-- Phase 4: (Future) Drop old columns after 1 month
-- ALTER TABLE appointment_bookings DROP COLUMN scheduled_date, DROP COLUMN scheduled_time;
```

**New Tables**:
```sql
CREATE TABLE timezone_migration_log (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT REFERENCES appointment_bookings(id),
  old_scheduled_date DATE,
  old_scheduled_time TIME,
  new_scheduled_datetime TIMESTAMPTZ,
  migration_status VARCHAR(20), -- 'success', 'failed', 'skipped'
  error_message TEXT,
  migrated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Frontend Changes

**Install Dependencies**:
```bash
npm install date-fns-tz
```

**Utilities to Create**:
```typescript
// lib/utils/timezone.ts

import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const PARIS_TZ = 'Europe/Paris'

/**
 * Convert user input (date + time strings) to UTC timestamp with Paris timezone
 */
export function localTimeToUTC(date: string, time: string): Date {
  const dateTimeString = `${date} ${time}`
  return zonedTimeToUtc(dateTimeString, PARIS_TZ)
}

/**
 * Display UTC timestamp as local Paris time
 */
export function utcToLocalTime(utcDate: Date): string {
  return formatInTimeZone(utcDate, PARIS_TZ, 'dd/MM/yyyy à HH:mm', { locale: fr })
}

/**
 * Check if a given date/time exists (not in Spring Forward gap)
 */
export function isValidLocalTime(date: string, time: string): boolean {
  try {
    localTimeToUTC(date, time)
    return true
  } catch {
    return false
  }
}

/**
 * Get the timezone offset for Paris at a given date
 */
export function getParisOffset(date: Date): string {
  return formatInTimeZone(date, PARIS_TZ, 'XXX') // Returns "+01:00" or "+02:00"
}
```

---

### Backend Changes

**Edge Functions to Update**:
- `accept-booking-request`: Fix reference to `scheduled_at` → use `scheduled_datetime`
- `refuse-booking-request`: Same fix
- `send-reminders`: Use `date-fns-tz` for reminder calculation
- All functions reading/writing booking times

**Example Fix**:
```typescript
// BEFORE (BROKEN)
const scheduledDate = new Date(bookingDetails.scheduled_at) // ❌ Column doesn't exist

// AFTER (CORRECT)
import { utcToZonedTime } from 'date-fns-tz'
const scheduledDateTimeUTC = new Date(bookingDetails.scheduled_datetime)
const scheduledDateTimeParis = utcToZonedTime(scheduledDateTimeUTC, 'Europe/Paris')
```

---

### Testing Strategy

**Unit Tests**:
```typescript
// __tests__/timezone.test.ts

describe('Timezone Utils', () => {
  it('should handle Spring Forward transition', () => {
    // 30 March 2025 at 14:00 CEST = 12:00 UTC
    const utc = localTimeToUTC('2025-03-30', '14:00')
    expect(utc.toISOString()).toBe('2025-03-30T12:00:00.000Z')
  })

  it('should reject invalid time during Spring Forward', () => {
    // 30 March 2025 at 02:30 doesn't exist
    expect(isValidLocalTime('2025-03-30', '02:30')).toBe(false)
  })

  it('should handle Fall Back transition', () => {
    // 27 October 2025 at 14:00 CET = 13:00 UTC
    const utc = localTimeToUTC('2025-10-27', '14:00')
    expect(utc.toISOString()).toBe('2025-10-27T13:00:00.000Z')
  })
})
```

**E2E Tests**:
- Create booking on 30 March 2025 at 14:00 → Verify no time shift
- Create booking on 27 October 2025 at 14:00 → Verify no time shift
- Modify booking across DST transition → Verify no corruption
- Contractor receives notification → Verify correct time displayed

---

### Deployment Plan

**Phase 1: Database Migration (Week 1)**
- ✅ Create backup of `appointment_bookings` table
- ✅ Add new columns (`scheduled_datetime`, `booking_timezone`)
- ✅ Run migration script to populate new columns from old data
- ✅ Verify migration success (compare counts, spot-check data)
- ⚠️ Keep old columns (`scheduled_date`, `scheduled_time`) for 1 month as backup

**Phase 2: Backend Updates (Week 1)**
- ✅ Install `date-fns-tz` in Edge Functions
- ✅ Update all 13 Edge Functions to use `scheduled_datetime`
- ✅ Deploy Edge Functions to Supabase
- ✅ Run integration tests

**Phase 3: Frontend Updates (Week 2)**
- ✅ Install `date-fns-tz` in main app
- ✅ Create timezone utility functions
- ✅ Update booking flow to use new utilities
- ✅ Update contractor dashboard time displays
- ✅ Update admin dashboard time displays

**Phase 4: Testing (Week 2)**
- ✅ Run E2E tests with DST dates
- ✅ Manual testing with real user scenarios
- ✅ Load testing with concurrent bookings

**Phase 5: Monitoring (Week 3+)**
- ✅ Deploy to production
- ✅ Monitor for timezone-related errors
- ✅ Collect user feedback
- ✅ After 1 month: Drop old columns if no issues

---

### Success Metrics

**Pre-Implementation (Baseline)**:
- Timezone-related support tickets: ~5-10 per week (legacy app data)
- Incorrect notification times: ~15% (estimated from legacy issues)
- User complaints about time discrepancies: Frequent

**Post-Implementation (Target)**:
- Timezone-related support tickets: 0-1 per week (95% reduction)
- Incorrect notification times: 0% (100% accuracy)
- User complaints: None
- DST transitions: Automatic with zero incidents

**Monitoring**:
- Track `timezone_migration_log` for failed migrations
- Alert on any timezone conversion errors in Edge Functions
- Survey contractors: "Did you receive notifications at the correct time?"

---

## Dependencies

**External Libraries**:
- `date-fns-tz@^3.2.0` (timezone-aware date manipulation)

**Internal Dependencies**:
- Migration must complete before frontend deployment
- All Edge Functions must be updated before removing old columns

**Risk Mitigation**:
- Keep old columns for 1 month as rollback mechanism
- Feature flag: `ENABLE_TIMESTAMPTZ` to toggle between old/new behavior during transition
- Comprehensive backup before migration

---

## Acceptance Criteria Summary

✅ All existing bookings migrated to new format without data loss
✅ All new bookings use TIMESTAMPTZ with timezone context
✅ Spring Forward (30 March 2025) handled correctly (no invalid times)
✅ Fall Back (27 October 2025) handled correctly (no ambiguous times)
✅ Notifications sent at exact times with 0% error rate
✅ Contractor dashboard displays correct times across DST transitions
✅ Admin can view timezone context for all bookings
✅ E2E tests pass for both DST transition dates
✅ Zero timezone-related support tickets for 2 weeks post-deployment

---

## Notes

- **Timezone Assumption**: All services operate in France (`Europe/Paris`). If multi-country support is needed in future, add service-level timezone configuration.
- **User Timezone**: We intentionally ignore user's browser timezone and always use service location timezone (France) to avoid confusion.
- **DST Dates 2025**: Spring Forward = 30 March at 02:00, Fall Back = 27 October at 03:00.
- **Backward Compatibility**: Old columns remain for 1 month to allow rollback if critical issues discovered.
