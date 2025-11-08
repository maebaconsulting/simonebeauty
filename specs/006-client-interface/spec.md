# Feature Specification: Interface Client Complète

**Feature Branch**: `006-client-interface`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Interface client complète avec gestion profil, historique réservations, adresses favorites, moyens de paiement enregistrés, préférences et notifications"

## User Scenarios & Testing

### User Story 1 - Gestion du Profil Personnel (Priority: P1)

Un client connecté accède à son profil pour consulter et modifier ses informations personnelles : nom, email, téléphone, photo de profil. Il peut mettre à jour ces informations à tout moment.

**Why this priority**: Fonctionnalité de base essentielle pour tout utilisateur. Sans gestion de profil, impossible de maintenir des informations à jour. MVP absolu.

**Independent Test**: Peut être testé en accédant au profil, modifiant le nom et vérifiant la sauvegarde. Délivre la valeur : "Client contrôle ses informations personnelles".

**Acceptance Scenarios**:

1. **Given** un client connecté, **When** il accède à "Mon profil", **Then** toutes ses informations actuelles s'affichent (nom, email, téléphone, photo)
2. **Given** un client modifiant son nom, **When** il clique sur "Enregistrer", **Then** le nom est mis à jour et un message de confirmation s'affiche
3. **Given** un client téléchargeant une photo de profil, **When** il sélectionne une image <5MB, **Then** la photo est uploadée et affichée immédiatement
4. **Given** un client modifiant son email, **When** il saisit un nouvel email, **Then** un code de vérification est envoyé au nouvel email avant validation

---

### User Story 2 - Historique et Suivi des Réservations (Priority: P1)

Un client consulte l'historique complet de ses réservations : passées, en cours et à venir. Il peut voir tous les détails de chaque réservation et accéder aux actions pertinentes (annuler, modifier, contacter le prestataire).

**Why this priority**: Essentiel pour que le client suive ses rendez-vous et gère ses réservations. Sans cela, aucune visibilité sur les services réservés. Critique pour l'expérience utilisateur.

**Independent Test**: Peut être testé en consultant l'historique et vérifiant que toutes les réservations apparaissent avec leurs statuts. Délivre la valeur : "Client voit et gère toutes ses réservations".

**Acceptance Scenarios**:

1. **Given** un client avec 3 réservations (1 à venir, 1 en cours, 1 passée), **When** il accède à "Mes réservations", **Then** les 3 réservations s'affichent organisées par statut
2. **Given** un client consultant une réservation à venir, **When** il clique dessus, **Then** tous les détails s'affichent (service, date, heure, prestataire, adresse, prix)
3. **Given** un client avec réservation à venir dans 3 jours, **When** il clique sur "Annuler", **Then** le système affiche les conditions d'annulation applicables avec le montant de remboursement calculé automatiquement
4. **Given** un client consultant une réservation terminée, **When** elle n'a pas encore été évaluée, **Then** un bouton "Laisser un avis" est affiché

---

### User Story 2.1 - Annulation de Réservation avec Politique Configurable (Priority: P1)

Un client souhaite annuler sa réservation prévue lundi à 10h. Le système consulte les règles d'annulation configurées dans `platform_config`, calcule automatiquement le montant de remboursement selon la deadline applicable (J-1 à 18h par défaut), affiche clairement les conditions, et traite le remboursement Stripe. Si l'annulation est tardive (après deadline), le client peut demander une exception médicale.

**Why this priority**: Fonctionnalité critique pour la satisfaction client. Sans annulation autonome, surcharge du support et frustration. La transparence des conditions réduit les litiges. MVP absolu.

**Independent Test**: Peut être testé en annulant une réservation avant/après deadline et vérifiant les remboursements. Délivre la valeur : "Client annule en toute transparence selon les règles".

**Acceptance Scenarios**:

1. **Given** un client avec réservation lundi 10h, **When** il clique sur "Annuler" dimanche à 17h (avant deadline 18h), **Then** le système affiche "Remboursement intégral (100%)" et demande confirmation
2. **Given** un client confirmant l'annulation avant deadline, **When** il valide, **Then** le remboursement Stripe est émis automatiquement, la réservation passe en statut "Annulée", le prestataire est notifié, et le client reçoit un email de confirmation
3. **Given** un client avec réservation lundi 10h, **When** il clique sur "Annuler" dimanche à 19h (après deadline 18h), **Then** le système affiche "Aucun remboursement (100% facturé)" avec possibilité de demander exception médicale
4. **Given** un client demandant exception médicale, **When** il soumet le formulaire avec motif et justificatif optionnel, **Then** une demande est créée (statut: pending), une tâche backoffice est générée, et il reçoit confirmation que le support traitera sa demande sous 48h
5. **Given** un client avec réservation same-day (créée et RDV le même jour), **When** il tente d'annuler, **Then** le système affiche "Aucun remboursement possible pour les réservations jour J" et bloque l'annulation (sauf exception médicale)
6. **Given** un client consultant ses conditions d'annulation, **When** il accède au détail de sa réservation, **Then** un encadré indique clairement "Annulation gratuite jusqu'au [DATE] à 18h - Après : aucun remboursement"

---

### User Story 2.2 - Confirmation de Paiement Après Service et Pourboire (Priority: P1)

Un client consulte sa réservation dont le service est terminé (statut "completed_by_contractor"). Il peut maintenant déclencher manuellement la capture du paiement en cliquant sur "Confirmer paiement". Une fois le paiement capturé, il peut également donner un pourboire au prestataire en sélectionnant un montant parmi les suggestions affichées (5€, 10€, 15€, 20€).

**Why this priority**: Donne le contrôle au client sur le moment du débit, renforçant la confiance. Le pourboire augmente la satisfaction des prestataires et encourage l'excellence du service. Important pour la différenciation.

**Independent Test**: Peut être testé en complétant un service, déclenchant la capture manuellement, puis ajoutant un tip. Délivre la valeur : "Client contrôle son paiement et peut récompenser l'excellence".

**Acceptance Scenarios**:

1. **Given** un client avec réservation en statut "completed_by_contractor", **When** il consulte le détail, **Then** un bouton "Confirmer paiement" est affiché avec montant à débiter (80€)
2. **Given** un client cliquant sur "Confirmer paiement", **When** il confirme, **Then** le paiement est capturé immédiatement, le statut passe à "captured", et un email de confirmation est envoyé
3. **Given** un client avec réservation en statut "in_progress" (service en cours), **When** il tente de confirmer le paiement, **Then** le bouton est affiché et fonctionnel (capture possible pendant le service)
4. **Given** un client avec réservation en statut "confirmed" (pas encore commencée), **When** il consulte le détail, **Then** le bouton "Confirmer paiement" n'est PAS affiché (capture uniquement après début service)
5. **Given** un client avec réservation "captured", **When** il consulte le détail, **Then** une section "Donner un pourboire" s'affiche avec boutons de montants suggérés (5€, 10€, 15€, 20€)
6. **Given** un client sélectionnant un tip de 10€, **When** il confirme, **Then** le système affiche "Total : 10.00€ (frais Stripe inclus)" et crée un paiement séparé
7. **Given** un tip de 10€ payé avec succès, **When** le paiement est confirmé, **Then** le client voit "Pourboire de 10€ envoyé ✓", le prestataire est notifié, et une entrée est créée dans service_action_logs
8. **Given** une configuration platform_config.tip_time_limit_days = 30, **When** un client tente de tipper 31 jours après le service, **Then** le message "Délai dépassé pour donner un pourboire (30 jours)" s'affiche
9. **Given** un client ayant déjà donné un tip de 15€, **When** il consulte l'historique de la réservation, **Then** le tip apparaît clairement : "Service : 80€ + Pourboire : 15€"

---

### User Story 2.3 - Reprogrammation Gratuite d'une Réservation (Priority: P2)

Un client a un imprévu et souhaite décaler sa réservation prévue jeudi à 14h. Il accède au détail de sa réservation, clique sur "Reprogrammer", et sélectionne une nouvelle date/heure dans le calendrier de disponibilités du même prestataire. La reprogrammation est gratuite (dans la limite configurée, ex: 1 fois) et ne nécessite pas de nouveau paiement.

**Why this priority**: Améliore significativement la flexibilité et la satisfaction client. Réduit les annulations évitables. Important pour la rétention mais pas MVP strict.

**Independent Test**: Peut être testé en reprogrammant une réservation à venir et vérifiant que les dates sont mises à jour sans frais. Délivre la valeur : "Client peut ajuster ses rendez-vous facilement".

**Acceptance Scenarios**:

1. **Given** un client avec réservation à venir dans 5 jours, **When** il clique sur "Reprogrammer", **Then** un calendrier s'affiche avec les créneaux disponibles du même prestataire et même service
2. **Given** un client sélectionnant une nouvelle date dans 7 jours, **When** il confirme la reprogrammation, **Then** le système vérifie que reschedule_count < max_reschedules (config: 1 par défaut)
3. **Given** une reprogrammation validée, **When** les dates sont mises à jour, **Then** la réservation affiche la nouvelle date, l'ancienne date est sauvegardée (original_date_service), reschedule_count += 1, et une entrée est loggée dans service_action_logs
4. **Given** un client et un prestataire, **When** la reprogrammation est confirmée, **Then** les deux parties reçoivent un email/notification avec les nouvelles dates
5. **Given** un client tentant de reprogrammer 12h avant la prestation, **When** il clique sur "Reprogrammer", **Then** le système affiche "Impossible de reprogrammer moins de 24h avant (délai minimum)" et bloque l'action
6. **Given** un client ayant déjà reprogrammé 1 fois, **When** il tente une 2ème reprogrammation, **Then** le système affiche "Limite de reprogrammations atteinte (1/1). Annulez et créez une nouvelle réservation."
7. **Given** une réservation reprogrammée, **When** le client consulte l'historique, **Then** il voit clairement : "Reprogrammée : Initialement prévu le 12/11 à 14h → Nouveau rendez-vous le 19/11 à 10h"
8. **Given** une configuration platform_config.reschedule_enabled = false, **When** un client consulte une réservation, **Then** le bouton "Reprogrammer" n'est pas affiché

---

### User Story 3 - Gestion des Adresses Favorites (Priority: P2)

Un client enregistre plusieurs adresses fréquemment utilisées (domicile, bureau, maison de vacances) pour accélérer le processus de réservation. Il peut ajouter, modifier et supprimer des adresses.

**Why this priority**: Améliore significativement l'expérience pour les clients réguliers. Réduit la friction lors de réservations répétées. Important mais pas MVP strict.

**Independent Test**: Peut être testé en ajoutant une adresse favorite et la réutilisant lors d'une nouvelle réservation. Délivre la valeur : "Réservations plus rapides pour clients réguliers".

**Acceptance Scenarios**:

1. **Given** un client accédant à "Mes adresses", **When** il clique sur "Ajouter une adresse", **Then** un formulaire avec autocomplétion Google Places s'affiche avec possibilité de nommer l'adresse (ex: "Maison de vacances Lyon")
2. **Given** un client avec 2 adresses enregistrées, **When** il consulte la liste, **Then** les adresses s'affichent avec labels, possibilité de définir une adresse par défaut, et actions modifier/supprimer
3. **Given** un client modifiant une adresse existante, **When** il change le nom ou les détails, **Then** les modifications sont sauvegardées et disponibles immédiatement
4. **Given** un client lors d'une nouvelle réservation, **When** il accède à la saisie d'adresse, **Then** son adresse par défaut est pré-remplie et toutes ses adresses favorites apparaissent pour sélection rapide
5. **Given** un client en vacances dans une ville couverte, **When** il démarre une réservation et saisit une nouvelle adresse (hôtel), **Then** il peut choisir de l'enregistrer comme adresse favorite avec un label personnalisé (ex: "Hôtel Lyon 2025")

---

### User Story 4 - Gestion des Moyens de Paiement (Priority: P2)

Un client peut consulter et gérer ses cartes bancaires enregistrées : voir les cartes sauvegardées (masquées), ajouter une nouvelle carte, définir une carte par défaut et supprimer des cartes obsolètes.

**Why this priority**: Facilite les paiements futurs et améliore la conversion. Important pour la rétention mais pas critique pour MVP initial.

**Independent Test**: Peut être testé en ajoutant une carte, la définissant par défaut et l'utilisant pour une réservation. Délivre la valeur : "Paiements simplifiés pour clients fidèles".

**Acceptance Scenarios**:

1. **Given** un client accédant à "Mes moyens de paiement", **When** il consulte la liste, **Then** toutes ses cartes enregistrées s'affichent masquées (•••• 4242) avec type (Visa, Mastercard)
2. **Given** un client ajoutant une nouvelle carte, **When** il saisit les informations, **Then** la carte est tokenisée via Stripe et ajoutée à son compte
3. **Given** un client avec 3 cartes enregistrées, **When** il sélectionne une carte et clique sur "Définir par défaut", **Then** cette carte sera utilisée par défaut pour les futurs paiements
4. **Given** un client supprimant une carte expirée, **When** il confirme la suppression, **Then** la carte est retirée de Stripe et n'apparaît plus dans la liste

---

### User Story 5 - Centre de Notifications et Préférences (Priority: P2)

Un client peut consulter toutes ses notifications (confirmations de réservation, rappels, messages prestataires, promotions) et configurer ses préférences de notification par canal (email, SMS, push).

**Why this priority**: Permet au client de rester informé et de contrôler la communication. Important pour l'engagement mais peut être simplifié pour MVP.

**Independent Test**: Peut être testé en consultant les notifications et modifiant les préférences. Délivre la valeur : "Client informé selon ses préférences".

**Acceptance Scenarios**:

1. **Given** un client accédant au centre de notifications, **When** il consulte la liste, **Then** toutes les notifications récentes s'affichent triées par date (les plus récentes en premier)
2. **Given** un client avec 5 notifications non lues, **When** il accède au centre de notifications, **Then** un badge indique le nombre de notifications non lues
3. **Given** un client accédant aux préférences de notifications, **When** il désactive les emails promotionnels, **Then** il ne recevra plus ces emails mais continuera de recevoir les notifications critiques
4. **Given** un client configurant ses préférences, **When** il active les rappels SMS 24h avant, **Then** il recevra un SMS de rappel avant chaque réservation

---

### User Story 6 - Dashboard d'Accueil Personnalisé (Priority: P3)

Lorsqu'un client se connecte, il accède à un dashboard personnalisé affichant : sa prochaine réservation, ses services favoris, des recommandations, et un accès rapide aux actions fréquentes.

**Why this priority**: Améliore l'expérience et facilite la navigation. Nice-to-have pour MVP mais important pour l'engagement à long terme.

**Independent Test**: Peut être testé en se connectant et vérifiant que le dashboard affiche des informations pertinentes. Délivre la valeur : "Expérience personnalisée et intuitive".

**Acceptance Scenarios**:

1. **Given** un client avec une réservation à venir, **When** il se connecte, **Then** sa prochaine réservation s'affiche en tête du dashboard avec compte à rebours
2. **Given** un client ayant réservé 3 fois le même service, **When** il consulte son dashboard, **Then** ce service apparaît dans "Mes favoris" pour réservation rapide
3. **Given** un nouveau client sans réservation, **When** il se connecte, **Then** le dashboard affiche les services populaires et une invitation à réserver
4. **Given** un client inactif depuis 30 jours, **When** il se connecte, **Then** une section "Recommandations pour vous" affiche des services basés sur son historique

---

### Edge Cases

- **Modification email avec email déjà utilisé**: Que se passe-t-il si le client tente de changer son email pour un email déjà enregistré par un autre utilisateur ?
- **Suppression de la dernière carte**: Peut-on supprimer la dernière carte bancaire ou faut-il en conserver au moins une ?
- **Adresse par défaut supprimée**: Si le client supprime son adresse par défaut, comment le système réagit-il ?
- **Notifications critiques**: Peut-on désactiver toutes les notifications ou certaines (confirmations, rappels) sont-elles obligatoires ?
- **Photo de profil inappropriée**: Comment gérer les photos de profil non conformes (contenu offensant) ?
- **Historique de réservations volumineuses**: Comment afficher efficacement un client avec 200+ réservations historiques ?
- **Annulation d'une réservation déjà commencée**: Que se passe-t-il si le client tente d'annuler une réservation dont l'heure de début est dépassée ?
- **Changement d'email pendant vérification**: Si le client change son email alors qu'un code de vérification est en attente, quel email est valide ?
- **Carte bancaire refusée comme défaut**: Que se passe-t-il si la carte par défaut devient invalide (expirée, annulée) ?
- **Dashboard vide pour nouveau client**: Comment rendre le dashboard engageant pour un client sans historique ni préférences ?

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre à un client de consulter son profil avec toutes ses informations personnelles
- **FR-002**: Le système DOIT permettre à un client de modifier son nom, téléphone et photo de profil
- **FR-003**: Le système DOIT envoyer un code de vérification lors d'un changement d'email
- **FR-004**: Le système DOIT permettre de télécharger une photo de profil (formats: JPG, PNG, max 5MB)
- **FR-005**: Le système DOIT afficher l'historique complet des réservations organisées par statut (à venir, en cours, passées, annulées)
- **FR-006**: Le système DOIT afficher tous les détails d'une réservation (service, date, heure, prestataire, adresse, prix, statut)
- **FR-007**: Le système DOIT permettre d'annuler une réservation à venir avec calcul automatique du remboursement selon platform_config.cancellation_rules
- **FR-007a**: Le système DOIT afficher clairement les conditions d'annulation et le montant de remboursement AVANT confirmation de l'annulation
- **FR-007b**: Le système DOIT permettre de demander une exception médicale si l'annulation est tardive et medical_exception_enabled = true
- **FR-007c**: Le système DOIT créer une cancellation_request avec justificatif optionnel lors d'une demande d'exception médicale
- **FR-007d**: Le système DOIT notifier le prestataire immédiatement lors d'une annulation confirmée et réouvrir automatiquement le créneau
- **FR-008**: Le système DOIT permettre de contacter le prestataire directement depuis une réservation
- **FR-009**: Le système DOIT permettre d'ajouter, modifier et supprimer des adresses favorites avec labels personnalisés
- **FR-010**: Le système DOIT intégrer l'autocomplétion Google Places pour la saisie de nouvelles adresses
- **FR-011**: Le système DOIT permettre de définir une adresse par défaut qui sera automatiquement utilisée lors des réservations
- **FR-012**: Le système DOIT pré-remplir automatiquement l'adresse par défaut lors du parcours de réservation et proposer toutes les adresses favorites pour sélection rapide
- **FR-013**: Le système DOIT afficher toutes les cartes bancaires enregistrées avec masquage (•••• 4242)
- **FR-014**: Le système DOIT permettre d'ajouter une nouvelle carte via Stripe avec tokenisation
- **FR-015**: Le système DOIT permettre de définir une carte par défaut pour les paiements
- **FR-016**: Le système DOIT permettre de supprimer une carte enregistrée (et la retirer de Stripe)
- **FR-017**: Le système DOIT afficher un centre de notifications avec toutes les notifications récentes
- **FR-018**: Le système DOIT indiquer le nombre de notifications non lues via un badge
- **FR-019**: Le système DOIT permettre de configurer les préférences de notifications par canal (email, SMS, push)
- **FR-020**: Le système DOIT envoyer des notifications critiques (confirmations, rappels) indépendamment des préférences
- **FR-021**: Le système DOIT afficher un dashboard personnalisé avec la prochaine réservation si applicable
- **FR-022**: Le système DOIT afficher les services fréquemment réservés comme "Favoris"
- **FR-023**: Le système DOIT afficher des recommandations de services basées sur l'historique du client
- **FR-024**: Le système DOIT marquer les notifications comme lues lorsque consultées

**Capture Manuelle et Pourboire:**
- **FR-025**: Le système DOIT afficher un bouton "Confirmer paiement" uniquement si le statut est "in_progress" ou "completed_by_contractor"
- **FR-026**: Le système DOIT permettre au client de déclencher manuellement la capture du paiement après l'heure_debut
- **FR-027**: Le système DOIT logger la capture manuelle dans service_action_logs (action_type: capture_manual, performed_by_type: client)
- **FR-028**: Le système DOIT afficher une section "Donner un pourboire" uniquement si le statut est "captured"
- **FR-029**: Le système DOIT lire les montants suggérés depuis platform_config.tip_suggested_amounts et les afficher sous forme de boutons
- **FR-030**: Le système DOIT créer un PaymentIntent Stripe séparé pour chaque tip avec le montant sélectionné
- **FR-031**: Le système DOIT afficher clairement "Total : X€ (frais Stripe inclus)" avant confirmation du tip
- **FR-032**: Le système DOIT enregistrer le tip dans la table tips et logger l'action dans service_action_logs
- **FR-033**: Le système DOIT vérifier platform_config.tip_time_limit_days et bloquer les tips après le délai (si configuré)
- **FR-034**: Le système DOIT afficher les tips donnés dans l'historique de la réservation séparément du montant du service

**Reprogrammation:**
- **FR-035**: Le système DOIT afficher un bouton "Reprogrammer" uniquement si platform_config.reschedule_enabled = true et statut = "confirmed"
- **FR-036**: Le système DOIT vérifier platform_config.reschedule_min_hours_before et bloquer la reprogrammation si le délai n'est pas respecté
- **FR-037**: Le système DOIT vérifier reschedule_count < platform_config.reschedule_max_count avant d'autoriser la reprogrammation
- **FR-038**: Le système DOIT afficher un calendrier avec les créneaux disponibles du même prestataire et même service
- **FR-039**: Le système DOIT mettre à jour date_service, heure_debut, heure_fin et sauvegarder original_date_service et original_heure_debut
- **FR-040**: Le système DOIT incrémenter reschedule_count et logger l'action dans service_action_logs (action_type: rescheduled, metadata contenant anciennes et nouvelles dates)
- **FR-041**: Le système DOIT notifier le prestataire et le client avec les nouvelles dates par email et notification in-app
- **FR-042**: Le système DOIT afficher clairement dans l'historique si une réservation a été reprogrammée avec dates originales et nouvelles dates
- **FR-043**: Le système DOIT permettre de supprimer des notifications individuelles ou toutes à la fois

### Key Entities

- **Client Profile (profiles)**: Profil complet du client (nom, email, téléphone, photo, date de création, préférences)
- **Saved Address (client_addresses)**: Adresse favorite du client (label, rue, ville, code postal, pays, coordonnées GPS, adresse par défaut)
- **Notification (notifications)**: Notification pour le client (type, titre, contenu, date, lue/non lue, lien associé)
- **Notification Preferences (notification_preferences)**: Préférences de notification du client (email activé, SMS activé, push activé, types de notifications acceptées)
- **Dashboard Widget**: Composant du dashboard (type: prochaine réservation, favoris, recommandations; données, ordre d'affichage)
- **Booking History View**: Vue consolidée des réservations avec filtres et pagination

## Success Criteria

### Measurable Outcomes

- **SC-001**: Les clients peuvent accéder et modifier leur profil en moins de 30 secondes
- **SC-002**: Le temps de chargement de l'historique de réservations est inférieur à 2 secondes pour 95% des clients
- **SC-003**: 70% des clients réguliers (3+ réservations) enregistrent au moins une adresse favorite
- **SC-004**: 60% des clients avec carte enregistrée utilisent le paiement en 1-clic pour leurs réservations suivantes
- **SC-005**: Le taux de consultation du centre de notifications atteint 50% des clients actifs
- **SC-006**: Le nombre d'appels support pour "Je ne trouve pas ma réservation" diminue de 80% grâce à l'historique clair
- **SC-007**: 80% des clients configurent leurs préférences de notifications dans les 7 jours suivant l'inscription
- **SC-008**: Le taux d'engagement avec le dashboard personnalisé (clics sur widgets) dépasse 40%
- **SC-009**: Le temps moyen pour réserver à nouveau (client régulier) diminue de 50% grâce aux adresses et cartes sauvegardées
- **SC-010**: 90% des clients complètent la mise à jour de leur profil (photo, téléphone) dans le premier mois

## Assumptions

- Les clients ont accès à leur boîte email pour vérifier les changements d'email
- Les photos de profil sont modérées manuellement ou automatiquement si contenu inapproprié
- Les cartes bancaires sont gérées via Stripe Customers et Payment Methods
- Les notifications sont stockées dans une table dédiée et peuvent être paginées
- Les préférences de notifications respectent les obligations légales (notifications critiques toujours envoyées)
- Le dashboard personnalisé utilise des algorithmes simples (fréquence, récence) pour les recommandations
- Les adresses favorites sont limitées à un nombre raisonnable (ex: 10 maximum par client)
- Les notifications sont conservées pendant 90 jours puis archivées ou supprimées

## Dependencies

- Spec 001 (Authentification) pour la gestion du compte et changement d'email
- Spec 003 (Parcours Réservation) pour afficher les détails des réservations
- Spec 004 (Paiement Stripe) pour la gestion des cartes bancaires enregistrées
- API Google Places pour l'autocomplétion des adresses
- Supabase Storage pour le stockage des photos de profil
- Supabase Database pour les tables profiles, client_addresses, notifications, notification_preferences
- Service de notification (Resend pour email, Twilio pour SMS) pour envoyer les notifications configurées
- Service de push notifications (Firebase Cloud Messaging ou similaire) pour notifications push web/mobile

## Out of Scope

- Authentification à deux facteurs (2FA) dans les paramètres de profil
- Export de données personnelles (GDPR) - sera traité dans une spec dédiée
- Suppression complète du compte client - sera traité dans une spec dédiée
- Historique détaillé de toutes les actions du client (audit trail)
- Wishlist ou liste de services souhaités
- Programme de fidélité ou points de récompense
- Intégration avec wallets tiers (Apple Wallet, Google Wallet) pour cartes enregistrées
- Notification push mobile native (PWA push notifications suffisent pour MVP)
- Recommandations basées sur intelligence artificielle avancée
- Partage de profil ou réservations avec d'autres utilisateurs
