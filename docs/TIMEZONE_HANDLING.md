# 🌍 Gestion des Fuseaux Horaires - Documentation Utilisateur

**Version**: 1.0.0
**Date**: 10 Novembre 2025
**Statut**: ✅ Implémenté

---

## 📖 Vue d'Ensemble

Le système de réservation Simone Paris utilise une gestion robuste des fuseaux horaires pour garantir que:
- ✅ Les horaires affichés sont toujours corrects
- ✅ Les notifications sont envoyées au bon moment
- ✅ Les transitions heure d'été/hiver sont gérées automatiquement
- ✅ Aucun décalage de 1-2h comme dans l'application legacy

---

## 🎯 Principes de Base

### Timezone Unique: France (Europe/Paris)

Tous les services opèrent en France. Le système utilise **`Europe/Paris`** comme timezone de référence.

**Pourquoi ce choix?**
- Tous les prestataires sont en France
- Tous les services sont fournis en France
- Évite la confusion pour les utilisateurs

### Stockage UTC, Affichage Local

**En Base de Données:**
- Timestamps stockés en **UTC** (Universal Time Coordinated)
- Colonne: `scheduled_datetime TIMESTAMPTZ`
- Exemple: `2025-03-30 12:00:00+00` (UTC)

**Affichage Utilisateur:**
- Converti automatiquement en **heure locale Paris**
- Exemple: "30 mars 2025 à 14:00" (heure de Paris)

### DST (Daylight Saving Time) Automatique

Le système gère automatiquement les transitions heure d'été/hiver:
- **Spring Forward** (30 mars 2025): 02:00 → 03:00 (UTC+1 → UTC+2)
- **Fall Back** (27 octobre 2025): 03:00 → 02:00 (UTC+2 → UTC+1)

**Impact pour vous:** Aucun! Tout est géré automatiquement.

---

## 👤 Guide Utilisateur: Clients

### Réserver un Créneau

#### 1. Sélection du Service
- Allez sur "Réserver un service"
- Choisissez votre service (massage, ménage, etc.)

#### 2. Saisie de l'Adresse
- Entrez votre adresse complète
- Le système vérifie la zone de service

#### 3. Choix du Créneau Horaire

**Ce que vous voyez:**
- Calendrier avec dates disponibles
- Créneaux horaires en **heure locale Paris**
- Ex: "Mardi 30 mars à 14:00"

**Ce qui se passe en arrière-plan:**
- L'heure est convertie en UTC pour stockage
- "30 mars à 14:00 CEST" → "30 mars à 12:00 UTC"
- Le prestataire reçoit l'heure correcte dans sa notification

#### 4. Confirmation

**Vous recevez:**
- Email de confirmation avec l'heure correcte: "14:00"
- SMS de rappel J-1: "Rappel: rendez-vous demain à 14:00"

**Le prestataire reçoit:**
- Notification immédiate: "Nouvelle réservation pour demain à 14:00"

### Cas Spécial: Transition DST (30 Mars)

**Scénario**: Vous voulez réserver le 30 mars à 02:30.

**Problème**: Cette heure n'existe pas (Spring Forward: 02:00 → 03:00)

**Ce qui se passe:**
1. Vous sélectionnez "30 mars"
2. Vous essayez de choisir "02:30"
3. ❌ Message d'erreur: "Cette heure n'existe pas en raison du passage à l'heure d'été"
4. ✅ Suggestion: "Veuillez sélectionner 03:00 ou ultérieur"

**Solution**: Choisissez 03:00 ou une heure ultérieure.

### Consulter vos Réservations

**Dashboard Client:**
- Allez sur "Mes réservations"
- Toutes les heures affichées en heure locale Paris
- Format: "Mardi 30 mars 2025 à 14:00"

**Détails d'une Réservation:**
- Date et heure: "30/03/2025 à 14:00"
- Adresse: Votre adresse de service
- Prestataire: Nom du professionnel
- Statut: Confirmé / En attente / Complété

---

## 👨‍🔧 Guide Utilisateur: Prestataires

### Recevoir une Nouvelle Réservation

**Notification Immédiate:**
- Email: "Nouvelle demande de réservation"
- Détails: "Date: Mardi 30 mars 2025 à 14:00"
- **Important**: L'heure affichée est TOUJOURS l'heure locale correcte

**SMS (si activé):**
```
Nouvelle demande de réservation!

Service: Massage suédois
Date: mardi 30 mars 2025 à 14:00
Adresse: 123 Rue de la Paix, Paris

Connectez-vous pour accepter ou refuser.
Simone Paris
```

### Dashboard Prestataire

**Vue Planning:**
- Calendrier mensuel
- Réservations affichées aux heures correctes
- Aucun décalage même après transition DST

**Liste des Réservations:**
- Filtrées par statut: Pending / Confirmed / Completed
- Heures toujours en heure locale Paris
- Trier par date (croissant/décroissant)

### Configurer vos Disponibilités

**Horaires Hebdomadaires:**
1. Allez sur "Mon planning"
2. Configurez vos horaires par jour:
   - Lundi: 09:00 - 18:00
   - Mardi: 09:00 - 18:00
   - etc.

**Important**: Ces horaires sont en heure locale Paris et restent cohérents toute l'année.

**Exemple avec DST:**
- Vous configurez "09:00 - 18:00" en février
- Le 30 mars (passage DST), vos créneaux restent "09:00 - 18:00"
- Aucun ajustement manuel nécessaire

### Bloquer des Créneaux (Indisponibilités)

1. Cliquez sur "Bloquer un créneau"
2. Sélectionnez date et heures
3. Raison (optionnel): "Congés", "Rendez-vous personnel", etc.

**Important**: Si vous bloquez un créneau le 30 mars pendant Spring Forward:
- Heures 02:00-03:00 ne sont pas disponibles
- Le système vous empêche de sélectionner ces heures

---

## 🛠️ Guide Technique: Développeurs

### Utiliser les Utilities Timezone

#### Import

```typescript
import {
  localTimeToUTC,
  utcToLocalTime,
  isValidLocalTime,
  formatForDisplay,
  PARIS_TZ,
} from '@/lib/utils/timezone'
```

#### Convertir Heure Locale → UTC

```typescript
// User sélectionne: "30 mars 2025" et "14:00"
const date = '2025-03-30'
const time = '14:00'

// Convertir en UTC pour stockage
const utc = localTimeToUTC(date, time)
// Returns: Date object representing 2025-03-30T12:00:00.000Z

// Stocker dans DB
await supabase
  .from('appointment_bookings')
  .insert({
    scheduled_datetime: utc.toISOString(),
    booking_timezone: PARIS_TZ,
  })
```

#### Afficher UTC en Heure Locale

```typescript
// Récupérer depuis DB
const { data: booking } = await supabase
  .from('appointment_bookings')
  .select('scheduled_datetime')
  .single()

// Convertir UTC → heure locale pour affichage
const utcDate = new Date(booking.scheduled_datetime)
const localTime = utcToLocalTime(utcDate)
// Returns: "30/03/2025 à 14:00"

// Ou format personnalisé
const longFormat = utcToLocalTime(utcDate, "EEEE d MMMM yyyy 'à' HH:mm")
// Returns: "mardi 30 mars 2025 à 14:00"
```

#### Valider une Heure

```typescript
// Avant de créer une réservation, vérifier si l'heure est valide
const date = '2025-03-30'
const time = '02:30'  // Heure n'existe pas (Spring Forward gap)

if (!isValidLocalTime(date, time)) {
  // Afficher erreur à l'utilisateur
  console.error('Invalid time during Spring Forward')

  // Suggérer alternative
  const validTime = getValidTime(date, time)  // Returns: "03:00"
  console.log('Suggested time:', validTime)
}
```

#### Formatter pour Affichage

```typescript
const utcDate = new Date('2025-03-30T12:00:00.000Z')

// Style court (par défaut)
formatForDisplay(utcDate, 'short')
// "30/03/2025 à 14:00"

// Style long
formatForDisplay(utcDate, 'long')
// "mardi 30 mars 2025 à 14:00"

// Style complet
formatForDisplay(utcDate, 'full')
// "mardi 30 mars 2025 à 14:00 (heure de Paris)"
```

### Edge Functions

#### Accéder à scheduled_datetime

```typescript
// ❌ AVANT (BROKEN)
const { data: booking } = await supabase
  .from('appointment_bookings')
  .select('scheduled_at')  // ← Colonne n'existe plus!
  .single()

// ✅ APRÈS (CORRECT)
const { data: booking } = await supabase
  .from('appointment_bookings')
  .select('scheduled_datetime, booking_timezone')
  .single()

// Convertir pour affichage dans notification
const scheduledTime = new Date(booking.scheduled_datetime)
const timeStr = scheduledTime.toLocaleTimeString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Paris',  // ← Important!
})
```

### Tests

#### Tester Transitions DST

```typescript
import { localTimeToUTC, isDST } from '@/lib/utils/timezone'

describe('DST Transitions', () => {
  it('should handle Spring Forward correctly', () => {
    // 30 mars 2025 à 14:00 CEST = 12:00 UTC
    const utc = localTimeToUTC('2025-03-30', '14:00')
    expect(utc.toISOString()).toBe('2025-03-30T12:00:00.000Z')
    expect(isDST(utc)).toBe(true)  // Summer time (UTC+2)
  })

  it('should reject invalid times during Spring Forward', () => {
    // 02:30 n'existe pas le 30 mars
    expect(() => localTimeToUTC('2025-03-30', '02:30')).toThrow()
  })

  it('should handle Fall Back correctly', () => {
    // 27 octobre 2025 à 14:00 CET = 13:00 UTC
    const utc = localTimeToUTC('2025-10-27', '14:00')
    expect(utc.toISOString()).toBe('2025-10-27T13:00:00.000Z')
    expect(isDST(utc)).toBe(false)  // Winter time (UTC+1)
  })
})
```

---

## ❓ FAQ

### Q: Pourquoi mes anciens bookings affichent-ils toujours la bonne heure?

**R**: La migration automatique a converti toutes les anciennes réservations au nouveau format timezone-aware. Vos données ont été préservées avec leur contexte timezone correct.

### Q: Que se passe-t-il si j'essaie de réserver à 02:30 le 30 mars?

**R**: Cette heure n'existe pas (Spring Forward: 02:00 → 03:00). Le système affiche un message d'erreur et vous suggère 03:00 comme alternative.

### Q: Les notifications sont-elles envoyées à la bonne heure?

**R**: Oui! Le système calcule automatiquement l'heure correcte en tenant compte du fuseau horaire et des transitions DST. Plus de décalages de 1-2h comme dans l'app legacy.

### Q: Comment savoir si une date est en heure d'été ou d'hiver?

**R**: Vous n'avez pas besoin de le savoir! Le système gère tout automatiquement. L'heure affichée est toujours l'heure locale correcte.

### Q: Puis-je réserver pour quelqu'un dans un autre fuseau horaire?

**R**: Non. Tous les services sont fournis en France et utilisent l'heure de Paris. Si vous êtes en voyage à l'étranger et réservez un service en France, les heures affichées seront en heure de Paris.

### Q: Que se passe-t-il avec mes disponibilités lors du passage DST?

**R**: Rien! Vos horaires configurés (ex: 09:00-18:00) restent identiques. Le système ajuste automatiquement les créneaux disponibles en tenant compte du nouveau décalage UTC.

---

## 🐛 Problèmes Connus & Solutions

### Problème: "L'heure affichée ne correspond pas"

**Symptômes**:
- Vous avez réservé à 14:00
- L'email affiche 13:00 ou 15:00

**Cause Possible**:
- Ancien code non migré
- Cache navigateur

**Solution**:
1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Se déconnecter et se reconnecter
3. Si persiste, contacter le support

### Problème: "Impossible de sélectionner certaines heures le 30 mars"

**Symptômes**:
- Heures 02:00-02:59 désactivées le 30 mars

**Cause**:
- Ces heures n'existent pas (Spring Forward)

**Solution**:
- **C'est normal!** Sélectionnez 03:00 ou ultérieur

### Problème: "Les tests échouent sur les dates DST"

**Symptômes**:
- Tests unitaires échouent pour 30 mars ou 27 octobre

**Cause Possible**:
- Tests ne spécifient pas le timezone
- Utilisation de `new Date()` sans timezone

**Solution**:
```typescript
// ❌ INCORRECT
const date = new Date('2025-03-30 14:00')  // Ambiguë

// ✅ CORRECT
import { localTimeToUTC } from '@/lib/utils/timezone'
const date = localTimeToUTC('2025-03-30', '14:00')
```

---

## 📊 Métriques & Monitoring

### KPIs à Surveiller

**Précision des Horaires:**
- **Target**: 100% des notifications envoyées à l'heure exacte
- **Mesure**: Comparer heure envoi vs heure planifiée

**Tickets Support:**
- **Target**: 0-1 ticket/semaine timezone-related
- **Baseline Legacy**: 5-10 tickets/semaine

**Transitions DST:**
- **Target**: 0 incidents lors des transitions (30 mars, 27 octobre)
- **Baseline Legacy**: Multiples incidents

### Dashboard Admin

Les administrateurs peuvent surveiller:
- Nombre de réservations créées par heure
- Distribution des créneaux horaires
- Taux d'erreurs de validation timezone
- Logs de migration (table `timezone_migration_log`)

---

## 🔗 Ressources

### Documentation Externe

- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [date-fns-tz Documentation](https://date-fns.org/docs/Time-Zones)
- [PostgreSQL TIMESTAMPTZ](https://www.postgresql.org/docs/current/datatype-datetime.html)

### Documentation Interne

- [TIMEZONE_DEPLOYMENT_GUIDE.md](../TIMEZONE_DEPLOYMENT_GUIDE.md) - Guide de déploiement
- [TIMEZONE_IMPLEMENTATION_PROGRESS.md](../TIMEZONE_IMPLEMENTATION_PROGRESS.md) - Progression technique
- [specs/016-timezone-management/spec.md](../specs/016-timezone-management/spec.md) - Spécification complète

### Outils

- [Time.is](https://time.is/Paris) - Vérifier l'heure exacte à Paris
- [TimeAndDate.com](https://www.timeanddate.com/time/change/france/paris) - Dates de transitions DST

---

## 📞 Support

### Problèmes Utilisateurs (Clients/Prestataires)

**Email**: support@simone.paris
**Délai de Réponse**: 24h ouvrées

### Problèmes Techniques (Développeurs)

**Contact**: Dan (équipe technique)
**GitHub**: Ouvrir une issue avec label `timezone`

### Escalation Urgente

Si problème critique affectant les réservations:
1. Contacter l'équipe technique immédiatement
2. Fournir: ID réservation, heure attendue vs affichée, screenshots
3. Vérifier les logs: `supabase functions logs send-booking-reminders`

---

**Version**: 1.0.0
**Dernière Mise à Jour**: 10 Novembre 2025
**Prochaine Révision**: Après transition DST 30 mars 2025
