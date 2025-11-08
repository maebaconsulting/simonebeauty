# Feature Specification: Synchronisation Calendriers Externes

**Feature Branch**: `014-calendar-sync`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Synchronisation bidirectionnelle calendriers externes Google Calendar et Outlook avec import indisponibilités et export réservations confirmées"

## User Scenarios & Testing

### User Story 1 - Connexion et Autorisation Google Calendar (Priority: P1)

Un prestataire souhaite synchroniser son Google Calendar avec Simone pour éviter les doubles réservations. Il accède aux paramètres, clique sur "Connecter Google Calendar", est redirigé vers Google OAuth, autorise l'accès et revient sur Simone. La connexion est confirmée et active.

**Why this priority**: Connexion OAuth est le prérequis pour toute synchronisation. Sans cela, aucune intégration n'est possible. MVP absolu.

**Independent Test**: Peut être testé en initiant la connexion Google Calendar, complétant OAuth et vérifiant que le compte est lié. Délivre la valeur : "Prestataire peut connecter son calendrier externe".

**Acceptance Scenarios**:

1. **Given** un prestataire non connecté, **When** il clique sur "Connecter Google Calendar", **Then** il est redirigé vers la page d'autorisation Google OAuth
2. **Given** un prestataire sur la page OAuth Google, **When** il autorise l'accès à son calendrier, **Then** il est redirigé vers Simone avec token d'authentification
3. **Given** une connexion Google réussie, **When** le prestataire consulte ses paramètres, **Then** son email Google est affiché avec statut "Connecté" et bouton "Déconnecter"
4. **Given** une erreur OAuth (refus utilisateur), **When** le prestataire annule l'autorisation, **Then** un message explique que la connexion a échoué et propose de réessayer

---

### User Story 2 - Import des Indisponibilités depuis Calendrier Externe (Priority: P1)

Un prestataire a déjà 5 événements personnels dans son Google Calendar (RDV médecin, vacances, etc.). Après connexion, le système importe automatiquement ces événements comme indisponibilités et bloque ces créneaux pour les réservations Simone.

**Why this priority**: C'est l'objectif principal de la synchronisation : éviter les conflits. Critical pour que le prestataire n'ait pas à ressaisir ses indisponibilités. MVP essentiel.

**Independent Test**: Peut être testé en créant des événements dans Google Calendar, connectant le compte et vérifiant que les événements apparaissent comme indisponibilités dans Simone. Délivre la valeur : "Prestataire évite les doubles réservations automatiquement".

**Acceptance Scenarios**:

1. **Given** un Google Calendar avec 3 événements futurs, **When** le prestataire connecte son calendrier, **Then** ces 3 événements sont importés et créent des indisponibilités dans Simone
2. **Given** un événement Google "Vacances" du 10 au 15 janvier, **When** il est synchronisé, **Then** tous les créneaux du 10 au 15 janvier sont marqués indisponibles
3. **Given** un événement récurrent "Yoga tous les mardis 18h-19h", **When** il est synchronisé, **Then** chaque mardi 18h-19h est bloqué pour les 3 prochains mois
4. **Given** un événement Google supprimé, **When** la synchronisation se rafraîchit, **Then** l'indisponibilité correspondante est retirée dans Simone

---

### User Story 3 - Export des Réservations vers Calendrier Externe (Priority: P1)

Un client réserve un massage avec un prestataire pour le 15 janvier à 14h. Automatiquement, un événement "Réservation Simone - Massage 60min - Client: Marie D." est créé dans le Google Calendar du prestataire avec tous les détails (adresse, téléphone client, instructions).

**Why this priority**: Permet au prestataire de voir toutes ses réservations dans son calendrier principal. Critical pour organisation et productivité.

**Independent Test**: Peut être testé en créant une réservation pour un prestataire connecté et vérifiant qu'elle apparaît dans son Google Calendar. Délivre la valeur : "Prestataire voit toutes ses réservations dans son calendrier habituel".

**Acceptance Scenarios**:

1. **Given** une réservation confirmée pour un prestataire connecté, **When** elle est créée, **Then** un événement est automatiquement ajouté à son Google Calendar
2. **Given** un événement créé dans Google Calendar, **When** il est consulté, **Then** il contient titre, horaires, adresse, nom du client et instructions spéciales
3. **Given** une réservation annulée, **When** l'annulation est traitée, **Then** l'événement correspondant est supprimé du Google Calendar
4. **Given** une réservation modifiée (changement d'heure), **When** la modification est sauvegardée, **Then** l'événement Google Calendar est mis à jour avec la nouvelle heure

---

### User Story 4 - Synchronisation Bidirectionnelle en Temps Réel (Priority: P2)

Un prestataire ajoute un événement "RDV dentiste 15h-16h" dans son Google Calendar. Dans les 5 minutes, cet événement est détecté par Simone et le créneau 15h-16h devient automatiquement indisponible pour les réservations.

**Why this priority**: La synchronisation temps réel améliore significativement l'UX mais n'est pas critique si une synchronisation toutes les heures suffit au début.

**Independent Test**: Peut être testé en créant un événement externe et vérifiant qu'il apparaît dans Simone en <5 minutes. Délivre la valeur : "Changements externes sont reflétés rapidement dans Simone".

**Acceptance Scenarios**:

1. **Given** un prestataire ajoutant un événement à son Google Calendar, **When** 5 minutes s'écoulent, **Then** l'événement est importé et bloque le créneau dans Simone
2. **Given** un prestataire modifiant un événement externe (nouvelle heure), **When** la synchronisation se déclenche, **Then** l'indisponibilité dans Simone est mise à jour
3. **Given** une erreur de synchronisation (Google API indisponible), **When** le système détecte l'erreur, **Then** il réessaie automatiquement dans 15 minutes
4. **Given** un prestataire avec 50 événements externes, **When** la synchronisation s'exécute, **Then** seuls les événements des 90 prochains jours sont importés (optimisation)

---

### User Story 5 - Support Microsoft Outlook/Office 365 (Priority: P2)

Un prestataire utilise Outlook pour son calendrier professionnel. Il connecte son compte Microsoft via OAuth et bénéficie de la même synchronisation bidirectionnelle que Google Calendar.

**Why this priority**: Important pour couvrir les utilisateurs Outlook mais pas critical pour MVP si Google Calendar représente 70%+ des utilisateurs.

**Independent Test**: Peut être testé en connectant un compte Outlook et vérifiant l'import/export des événements. Délivre la valeur : "Prestataires Outlook peuvent aussi synchroniser leur calendrier".

**Acceptance Scenarios**:

1. **Given** un prestataire cliquant sur "Connecter Outlook", **When** il autorise via Microsoft OAuth, **Then** son calendrier Outlook est connecté avec succès
2. **Given** un calendrier Outlook connecté, **When** des événements existent, **Then** ils sont importés comme indisponibilités (même comportement que Google)
3. **Given** une nouvelle réservation Simone, **When** elle est confirmée, **Then** elle est exportée vers le calendrier Outlook du prestataire
4. **Given** un prestataire avec calendrier Outlook et Google connectés, **When** il consulte ses paramètres, **Then** les deux connexions sont affichées indépendamment avec possibilité de déconnecter chacune

---

### User Story 6 - Gestion des Conflits et Détection (Priority: P2)

Le système détecte qu'un prestataire a un événement externe "Déjeuner 12h-14h" et une réservation Simone existante à 13h (créée avant la synchronisation). Un conflit est détecté et signalé au prestataire pour résolution manuelle.

**Why this priority**: Protège contre les doubles réservations mais peut être géré manuellement au début. Important pour la fiabilité à long terme.

**Independent Test**: Peut être testé en créant un conflit volontaire et vérifiant la détection et notification. Délivre la valeur : "Système prévient les doubles réservations même avec synchronisation tardive".

**Acceptance Scenarios**:

1. **Given** un événement externe et une réservation Simone se chevauchant, **When** la synchronisation s'exécute, **Then** un conflit est détecté et le prestataire est notifié
2. **Given** un conflit détecté, **When** le prestataire consulte ses notifications, **Then** il voit les détails des deux événements avec options (garder Simone, garder externe, annuler l'un)
3. **Given** un prestataire résolvant un conflit en annulant la réservation Simone, **When** il confirme, **Then** le client est notifié de l'annulation et remboursé
4. **Given** un conflit résolu, **When** le prestataire a fait son choix, **Then** le conflit disparaît de la liste et les calendriers sont cohérents

---

### Edge Cases

- **Token OAuth expiré**: Le token Google expire après 60 jours. Comment le renouveler automatiquement sans interaction utilisateur ?
- **Calendrier avec 500+ événements**: Un prestataire très occupé a des centaines d'événements. Limiter l'import aux 90 prochains jours pour éviter surcharge.
- **Événements toute la journée**: Un événement Google "Congés" sans heures précises. L'interpréter comme 00h-23h59 et bloquer toute la journée.
- **Multiples calendriers Google**: Un utilisateur a 3 calendriers (perso, pro, famille). Permettre de sélectionner lequel synchroniser.
- **Synchronisation en boucle**: Un événement Simone exporté vers Google est réimporté comme indisponibilité. Éviter avec flag "source: simone".
- **Changement de fuseau horaire**: Prestataire voyage et son calendrier Google change de fuseau. Gérer correctement les conversions.
- **Limite API Google**: Google limite à 1000 requêtes/jour/utilisateur. Implémenter backoff et caching intelligent.
- **Déconnexion pendant synchronisation**: Prestataire déconnecte son calendrier pendant qu'une synchro est en cours. Annuler proprement et nettoyer.

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre la connexion via Google OAuth 2.0 pour accéder au Google Calendar
- **FR-002**: Le système DOIT permettre la connexion via Microsoft OAuth pour accéder à Outlook/Office 365
- **FR-003**: Le système DOIT stocker de manière sécurisée les tokens OAuth (chiffrement au repos)
- **FR-004**: Le système DOIT renouveler automatiquement les tokens OAuth avant expiration
- **FR-005**: Le système DOIT importer tous les événements des calendriers externes des 90 prochains jours
- **FR-006**: Le système DOIT créer une indisponibilité dans Simone pour chaque événement externe importé
- **FR-007**: Le système DOIT respecter les événements récurrents et créer des indisponibilités pour chaque occurrence
- **FR-008**: Le système DOIT supprimer les indisponibilités lorsque les événements externes sont supprimés
- **FR-009**: Le système DOIT mettre à jour les indisponibilités lorsque les événements externes sont modifiés
- **FR-010**: Le système DOIT exporter chaque réservation confirmée vers le calendrier externe du prestataire
- **FR-011**: Le système DOIT inclure dans l'événement exporté : titre, horaires, adresse, nom client, téléphone, instructions
- **FR-012**: Le système DOIT supprimer l'événement externe lorsqu'une réservation Simone est annulée
- **FR-013**: Le système DOIT mettre à jour l'événement externe lorsqu'une réservation Simone est modifiée
- **FR-014**: Le système DOIT synchroniser les calendriers au minimum toutes les 5 minutes
- **FR-015**: Le système DOIT utiliser des webhooks Google/Microsoft pour synchronisation temps réel quand disponible
- **FR-016**: Le système DOIT marquer les événements exportés avec un flag source pour éviter réimport en boucle
- **FR-017**: Le système DOIT détecter les conflits entre événements externes et réservations Simone
- **FR-018**: Le système DOIT notifier le prestataire lorsqu'un conflit est détecté
- **FR-019**: Le système DOIT permettre au prestataire de résoudre manuellement les conflits
- **FR-020**: Le système DOIT gérer les événements "toute la journée" en bloquant 00h-23h59
- **FR-021**: Le système DOIT permettre au prestataire de sélectionner quel(s) calendrier(s) synchroniser (si multiples)
- **FR-022**: Le système DOIT convertir correctement les fuseaux horaires entre calendrier externe et Simone
- **FR-023**: Le système DOIT implémenter un backoff exponentiel en cas d'échec API (rate limiting)
- **FR-024**: Le système DOIT permettre de déconnecter un calendrier externe et supprimer les indisponibilités importées
- **FR-025**: Le système DOIT logger toutes les synchronisations pour debugging (timestamp, nb événements, erreurs)

### Key Entities

- **Calendar Connection (calendar_connections)**: Connexion à un calendrier externe (user_id, provider Google/Outlook, token OAuth chiffré, refresh_token, expiration, statut actif/erreur)
- **Synchronized Event (calendar_sync_events)**: Événement importé depuis calendrier externe (event_id externe, calendar_id, titre, début, fin, récurrence, source, unavailability_id créée)
- **Sync Log (calendar_sync_logs)**: Historique de synchronisation (connection_id, timestamp, nb événements importés, nb exportés, erreurs, durée)
- **Conflict (calendar_conflicts)**: Conflit détecté (event_externe_id, booking_id, type conflit, statut: pending/resolved, résolution choisie)
- **Exported Booking (calendar_exported_bookings)**: Réservations exportées (booking_id, calendar_connection_id, external_event_id, date export, statut synced/failed)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Au moins 40% des prestataires connectent un calendrier externe dans les 3 mois suivant le lancement
- **SC-002**: Le taux d'échec de synchronisation est inférieur à 2%
- **SC-003**: Le délai moyen de synchronisation (changement externe → reflété dans Simone) est inférieur à 5 minutes
- **SC-004**: Le nombre de doubles réservations diminue de 90% pour les prestataires utilisant la synchronisation
- **SC-005**: 95% des événements externes sont correctement importés comme indisponibilités
- **SC-006**: 98% des réservations Simone sont correctement exportées vers les calendriers externes
- **SC-007**: Le taux de renouvellement automatique des tokens OAuth réussit à 99%
- **SC-008**: Les conflits détectés sont résolus dans les 24h dans 85% des cas
- **SC-009**: Le système supporte au moins 1000 prestataires avec calendriers connectés sans dégradation
- **SC-010**: Le taux de satisfaction des prestataires utilisant la synchronisation dépasse 4.5/5

## Assumptions

- Les prestataires utilisent majoritairement Google Calendar (70%) et Outlook (25%)
- Les tokens OAuth peuvent être renouvelés automatiquement sans intervention utilisateur
- Les webhooks Google/Microsoft sont fiables pour notifications temps réel
- Les limites de rate limiting des APIs externes (Google/Microsoft) sont suffisantes pour l'usage prévu
- Les prestataires consultent et résolvent les conflits détectés dans un délai raisonnable
- La synchronisation toutes les 5 minutes est acceptable (vs. temps réel absolu)

## Dependencies

- Google Calendar API v3 pour accès aux événements Google
- Microsoft Graph API pour accès aux calendriers Outlook/Office 365
- Système d'indisponibilités Simone pour créer les blocages - dépendance spec 002
- Système de réservations pour exporter les événements - dépendance spec 003
- Service de stockage sécurisé pour tokens OAuth chiffrés
- Job scheduler pour synchronisations périodiques (cron, background workers)

## Out of Scope

- Synchronisation avec Apple iCloud Calendar
- Support d'autres calendriers (Yahoo, CalDAV, etc.)
- Synchronisation des notes et pièces jointes d'événements
- Gestion des calendriers partagés (plusieurs prestataires accédant au même calendrier)
- Synchronisation des rappels (reminders)
- Import d'événements passés (historique >90 jours)
- Catégorisation automatique des événements externes (pro vs. perso)
- Modification d'événements externes depuis Simone (one-way seulement)
- Synchronisation sélective par type d'événement (importer seulement certains types)
