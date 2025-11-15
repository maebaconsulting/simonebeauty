# 🚀 Guide de Déploiement - Gestion des Fuseaux Horaires

**Feature**: `016-timezone-management`
**Date**: 10 Novembre 2025
**Durée Estimée**: 2-3 heures
**Niveau de Risque**: 🟡 Moyen (Migration de données)

---

## 📋 Pré-requis

### Vérifications Obligatoires

- [ ] Backup complet de la base de données effectué
- [ ] Accès Supabase avec droits admin
- [ ] Accès Vercel pour déploiement frontend
- [ ] Environnement de test disponible (recommandé)
- [ ] `date-fns-tz@3.2.0` installé (✅ Déjà fait)

### Outils Nécessaires

```bash
# Vérifier PostgreSQL client installé
psql --version

# Vérifier Supabase CLI (optionnel mais recommandé)
supabase --version
```

---

## 🎯 Plan de Déploiement (Ordre Strict)

### Phase 1: Backup & Préparation (15 min)

#### 1.1 Créer Backups

```bash
# Backup complet via Supabase Dashboard
# OU via pg_dump si accès direct

PGPASSWORD='MoutBinam@007' pg_dump \
  -h db.xpntvajwrjuvsqsmizzb.supabase.co \
  -U postgres \
  -d postgres \
  -t appointment_bookings \
  -t contractor_schedules \
  -t contractor_unavailabilities \
  > backups/timezone_migration_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Vérifier État Actuel

```sql
-- Compter bookings existants
SELECT COUNT(*) as total_bookings,
       COUNT(*) FILTER (WHERE scheduled_date IS NOT NULL) as with_date,
       COUNT(*) FILTER (WHERE scheduled_time IS NOT NULL) as with_time
FROM appointment_bookings;

-- Vérifier colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointment_bookings'
  AND column_name IN ('scheduled_date', 'scheduled_time', 'scheduled_datetime');
```

**✅ Checkpoint**: Notez le nombre total de bookings. Vous devrez le recomparer après migration.

---

### Phase 2: Migration Base de Données (30 min)

#### 2.1 Appliquer Migration 1/4 - Ajouter Colonnes

```bash
PGPASSWORD='MoutBinam@007' psql \
  -h db.xpntvajwrjuvsqsmizzb.supabase.co \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20250111000030_add_timezone_columns.sql
```

**Vérification**:
```sql
-- Vérifier colonnes créées
\d appointment_bookings
```

#### 2.2 Appliquer Migration 2/4 - Table de Log

```bash
PGPASSWORD='MoutBinam@007' psql \
  -h db.xpntvajwrjuvsqsmizzb.supabase.co \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20250111000031_create_migration_log.sql
```

**Vérification**:
```sql
-- Vérifier table créée
SELECT * FROM timezone_migration_log LIMIT 1;
```

#### 2.3 Appliquer Migration 3/4 - Migrer Données ⚠️ CRITIQUE

```bash
PGPASSWORD='MoutBinam@007' psql \
  -h db.xpntvajwrjuvsqsmizzb.supabase.co \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20250111000032_migrate_booking_times.sql
```

**Attendez-vous à voir:**
```
NOTICE: =============================================================================
NOTICE: TIMEZONE MIGRATION COMPLETED
NOTICE: =============================================================================
NOTICE: Total bookings processed: X
NOTICE: Successfully migrated: X
NOTICE: Failed migrations: 0
NOTICE: Skipped (null values): 0
NOTICE: =============================================================================
```

**⚠️ SI ÉCHECS:**
```sql
-- Voir les échecs
SELECT * FROM get_failed_migrations();

-- Voir statistiques
SELECT * FROM migration_stats;
```

**✅ Checkpoint**: Migration DOIT afficher "Failed migrations: 0". Si échecs, NE PAS continuer.

#### 2.4 Vérifier Migration Réussie

```sql
-- 1. Comparer nombre total (doit être identique au backup)
SELECT COUNT(*) as total_migrated
FROM appointment_bookings
WHERE scheduled_datetime IS NOT NULL;

-- 2. Spot-check 10 bookings aléatoires
SELECT
  id,
  scheduled_date,
  scheduled_time,
  scheduled_datetime,
  -- Vérifier que la conversion est correcte
  (scheduled_datetime AT TIME ZONE 'Europe/Paris')::date as converted_date,
  (scheduled_datetime AT TIME ZONE 'Europe/Paris')::time as converted_time,
  -- Comparer les deux
  CASE
    WHEN scheduled_date = (scheduled_datetime AT TIME ZONE 'Europe/Paris')::date THEN '✅ DATE OK'
    ELSE '❌ DATE MISMATCH'
  END as date_check,
  CASE
    WHEN scheduled_time = (scheduled_datetime AT TIME ZONE 'Europe/Paris')::time THEN '✅ TIME OK'
    ELSE '❌ TIME MISMATCH'
  END as time_check
FROM appointment_bookings
WHERE scheduled_datetime IS NOT NULL
ORDER BY RANDOM()
LIMIT 10;
```

**✅ Checkpoint**: Tous les checks doivent afficher "✅ OK". Si mismatch, investiguer avant de continuer.

#### 2.5 Appliquer Migration 4/4 - Set NOT NULL

```bash
PGPASSWORD='MoutBinam@007' psql \
  -h db.xpntvajwrjuvsqsmizzb.supabase.co \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20250111000033_set_datetime_not_null.sql
```

**✅ Checkpoint**: La colonne `scheduled_datetime` est maintenant NOT NULL.

---

### Phase 3: Déployer Edge Functions (20 min)

#### 3.1 Vérifier Credentials

```bash
# Exporter token Supabase (si pas déjà fait)
export SUPABASE_ACCESS_TOKEN="sbp_e493e7684112e0d83272644113079f06e179c4a6"

# Vérifier connexion
supabase projects list
```

#### 3.2 Déployer Functions

```bash
cd /Users/dan/Documents/SOFTWARE/myProjects/simone\ _v2.1/webclaude

# Déployer accept-booking-request
supabase functions deploy accept-booking-request

# Déployer send-booking-reminders
supabase functions deploy send-booking-reminders
```

**Vérification**:
```bash
# Voir logs de déploiement
supabase functions logs accept-booking-request --tail

# Tester la function
curl -X POST \
  https://xpntvajwrjuvsqsmizzb.supabase.co/functions/v1/accept-booking-request \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"request_id": 1}'
```

**✅ Checkpoint**: Functions déployées sans erreurs.

---

### Phase 4: Déployer Frontend (20 min)

#### 4.1 Tests Locaux (Optionnel mais Recommandé)

```bash
# Lancer tests
npm test

# Build local
npm run build

# Vérifier pas d'erreurs
```

#### 4.2 Déployer sur Vercel

```bash
# Option 1: Via Git (recommandé)
git add .
git commit -m "feat(timezone): implement timezone-aware booking system

- Add TIMESTAMPTZ columns to appointment_bookings
- Migrate existing data to timezone-aware format
- Update Edge Functions to use scheduled_datetime
- Add timezone utilities with DST support
- Fixes #XXX (legacy app timezone issues)"

git push origin 016-timezone-management

# Option 2: Via Vercel CLI
vercel --prod
```

**Vérification**:
- Ouvrir le deployment URL
- Vérifier la console du navigateur (pas d'erreurs)
- Créer une réservation test

**✅ Checkpoint**: Frontend déployé et accessible.

---

### Phase 5: Tests Post-Déploiement (30 min)

#### 5.1 Test Fonctionnel Basique

**Test 1: Créer une Réservation**
1. Aller sur `/booking/services`
2. Sélectionner un service
3. Saisir une adresse
4. Sélectionner créneau "Demain 14:00"
5. Confirmer la réservation

**Vérifier en DB:**
```sql
SELECT
  id,
  scheduled_datetime,
  booking_timezone,
  (scheduled_datetime AT TIME ZONE 'Europe/Paris')::time as local_time
FROM appointment_bookings
ORDER BY created_at DESC
LIMIT 1;
```

**Attendu**: `local_time` doit afficher "14:00:00"

**Test 2: Notification Contractor**
1. Contractor reçoit notification par email
2. Email affiche "14:00" (pas 13:00 ni 12:00)

**Test 3: Dashboard Contractor**
1. Contractor se connecte
2. Réservation s'affiche à "14:00"

#### 5.2 Test DST (Si date proche de transition)

**Test DST Spring Forward (si proche du 30 mars):**
```sql
-- Créer un booking de test pour le 30 mars 2025 à 14:00
INSERT INTO appointment_bookings (
  client_id,
  service_id,
  address_id,
  scheduled_datetime,
  booking_timezone,
  status
) VALUES (
  'TEST_CLIENT_UUID',
  1,
  1,
  '2025-03-30 14:00:00+02:00'::timestamptz,  -- 14:00 CEST = 12:00 UTC
  'Europe/Paris',
  'pending'
);

-- Vérifier conversion
SELECT
  id,
  scheduled_datetime,
  scheduled_datetime AT TIME ZONE 'Europe/Paris' as paris_time,
  scheduled_datetime AT TIME ZONE 'UTC' as utc_time
FROM appointment_bookings
WHERE id = LAST_INSERT_ID();
```

**Attendu**:
- `paris_time`: "2025-03-30 14:00:00"
- `utc_time`: "2025-03-30 12:00:00"

#### 5.3 Test Heures Invalides (Spring Forward)

**Tenter de réserver le 30 mars à 02:30** (heure n'existe pas):
1. Sélectionner "30 mars 2025"
2. Essayer de sélectionner "02:30"
3. **Attendu**: Message d'erreur + suggestion "03:00"

---

### Phase 6: Monitoring Initial (48h)

#### 6.1 Surveiller Erreurs

```bash
# Logs Vercel
vercel logs --follow

# Logs Supabase Functions
supabase functions logs accept-booking-request --tail
supabase functions logs send-booking-reminders --tail
```

#### 6.2 Vérifier Métriques

```sql
-- Réservations créées post-migration
SELECT COUNT(*) as new_bookings
FROM appointment_bookings
WHERE created_at > NOW() - INTERVAL '48 hours'
  AND scheduled_datetime IS NOT NULL;

-- Vérifier aucun NULL ne s'est glissé
SELECT COUNT(*) as null_datetime_count
FROM appointment_bookings
WHERE scheduled_datetime IS NULL
  AND created_at > NOW() - INTERVAL '48 hours';
```

**Attendu**: `null_datetime_count = 0`

#### 6.3 Surveiller Support Tickets

- [ ] Jour 1: Vérifier 0 tickets timezone-related
- [ ] Jour 2: Vérifier 0 tickets timezone-related
- [ ] Semaine 1: Vérifier tendance positive

---

## 🚨 Plan de Rollback (En Cas de Problème Critique)

### Scénario 1: Données Corrompues Détectées

```bash
# 1. Restaurer le backup
PGPASSWORD='MoutBinam@007' psql \
  -h db.xpntvajwrjuvsqsmizzb.supabase.co \
  -U postgres \
  -d postgres \
  < backups/timezone_migration_backup_YYYYMMDD_HHMMSS.sql

# 2. Supprimer nouvelles colonnes
psql -c "ALTER TABLE appointment_bookings DROP COLUMN scheduled_datetime;"
psql -c "ALTER TABLE appointment_bookings DROP COLUMN booking_timezone;"
psql -c "DROP TABLE timezone_migration_log;"
```

### Scénario 2: Edge Functions Causent Erreurs

```bash
# Rollback vers version précédente
supabase functions deploy accept-booking-request --version PREVIOUS_VERSION
```

### Scénario 3: Frontend Cassé

```bash
# Rollback Vercel vers deployment précédent
vercel rollback
```

---

## ✅ Checklist Finale

### Avant Déploiement
- [ ] Backups effectués
- [ ] État actuel documenté (nombre de bookings)
- [ ] Tests locaux passent
- [ ] Équipe informée du déploiement

### Pendant Déploiement
- [ ] Migration DB complétée avec 0 échecs
- [ ] Spot-checks passent (date/time cohérents)
- [ ] Edge Functions déployées
- [ ] Frontend déployé
- [ ] Tests post-déploiement passent

### Après Déploiement (48h)
- [ ] Monitoring actif
- [ ] 0 tickets timezone-related
- [ ] Métriques normales
- [ ] Pas de NULL scheduled_datetime

### Après 1 Mois
- [ ] Système stable
- [ ] 0 incidents DST
- [ ] Cleanup: Supprimer anciennes colonnes
- [ ] Cleanup: Supprimer migration log

---

## 📞 Support & Debugging

### Logs Utiles

```bash
# Voir migrations appliquées
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
WHERE version LIKE '202501110%'
ORDER BY version;

# Voir dernières réservations créées
SELECT id, scheduled_datetime, booking_timezone, created_at
FROM appointment_bookings
ORDER BY created_at DESC
LIMIT 10;

# Statistiques migration
SELECT * FROM migration_stats;
```

### Contacts

- **Database Issues**: Dan (vous)
- **Edge Functions**: Supabase Support
- **Frontend**: Vercel Support

---

## 🎉 Succès Attendus

Après déploiement réussi:
- ✅ Toutes les réservations affichent l'heure correcte
- ✅ Notifications envoyées au bon moment (0 décalage)
- ✅ Transitions DST gérées automatiquement
- ✅ 0 tickets timezone-related
- ✅ Tests E2E passent sur dates DST 2025

**🎯 Objectif**: Résoudre définitivement les problèmes de timezone de l'app legacy.

---

**Dernière Mise à Jour**: 10 Novembre 2025
**Prochaine Révision**: Après déploiement production
