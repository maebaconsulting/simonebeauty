# Feature Specification: Parcours de Réservation Complet

**Feature Branch**: `003-booking-flow`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Parcours de réservation complet: sélection service et adresse avec autocomplétion Google Places, choix créneau, assignation intelligente prestataire, ajout services additionnels, application codes promo et cartes cadeaux, paiement et confirmation"

## User Scenarios & Testing

### User Story 1 - Sélection Service et Gestion Flexible des Adresses (Priority: P1)

Un client parcourt le catalogue de services, sélectionne "Massage suédois 60 minutes" et doit renseigner l'adresse où le service sera fourni. **Par défaut, son adresse principale est automatiquement pré-remplie**. Il peut néanmoins changer cette adresse en sélectionnant une autre de ses adresses enregistrées ou en saisissant une toute nouvelle adresse (par exemple s'il est en vacances dans une ville couverte par les services). La saisie d'adresse bénéficie d'une autocomplétion intelligente qui suggère des adresses valides au fur et à mesure de la saisie.

**Why this priority**: Point d'entrée obligatoire du parcours. Sans sélection de service et adresse, aucune réservation ne peut être initiée. La flexibilité des adresses permet de servir les clients en déplacement. MVP absolu.

**Independent Test**: Peut être testé en naviguant vers un service, vérifiant que l'adresse par défaut est pré-remplie, et en saisissant/sélectionnant une autre adresse. Délivre la valeur : "Client peut démarrer une réservation à n'importe quelle adresse".

**Acceptance Scenarios**:

1. **Given** un client connecté sur la page d'un service, **When** il clique sur "Réserver maintenant", **Then** il accède à l'étape d'adresse et son adresse principale est automatiquement pré-remplie
2. **Given** un client avec adresse pré-remplie, **When** il clique sur "Changer d'adresse", **Then** toutes ses adresses enregistrées (domicile, travail, autre) s'affichent pour sélection rapide
3. **Given** un client sélectionnant une de ses adresses enregistrées, **When** il clique dessus, **Then** cette adresse remplace l'adresse par défaut et devient l'adresse de la réservation
4. **Given** un client en vacances, **When** il clique sur "Utiliser une nouvelle adresse" et saisit "15 rue" (au moins 3 caractères), **Then** des suggestions d'adresses complètes apparaissent via Google Places API
5. **Given** un client validant une nouvelle adresse, **When** l'adresse est dans la zone de service, **Then** il peut choisir d'enregistrer cette adresse pour usage ultérieur (checkbox optionnelle)
6. **Given** un client validant une adresse, **When** l'adresse est hors zone de service, **Then** un message clair l'informe et propose des zones alternatives ou de s'inscrire à la notification d'extension de zone

---

### User Story 2 - Choix du Créneau Disponible (Priority: P1)

Après avoir renseigné son adresse, le client accède à un calendrier interactif affichant les créneaux disponibles calculés en temps réel par l'algorithme (spec 002). Il sélectionne le créneau qui lui convient.

**Why this priority**: Étape critique sans laquelle aucune date de rendez-vous n'est définie. Core du parcours de réservation.

**Independent Test**: Peut être testé en validant une adresse et vérifiant que le calendrier affiche des créneaux disponibles sélectionnables. Délivre la valeur : "Client choisit quand il veut son service".

**Acceptance Scenarios**:

1. **Given** un client ayant validé son adresse, **When** le calendrier se charge, **Then** les créneaux disponibles des 30 prochains jours s'affichent en moins de 3 secondes
2. **Given** un client consultant le calendrier, **When** un créneau est disponible, **Then** il est affiché en vert et cliquable
3. **Given** un client sélectionnant un créneau, **When** il clique dessus, **Then** le créneau est mis en surbrillance et il passe à l'étape suivante
4. **Given** aucun créneau disponible dans les 7 prochains jours, **When** le calendrier se charge, **Then** un message suggère d'élargir la recherche ou de contacter le support

---

### User Story 3 - Assignation et Sélection du Prestataire (Priority: P2)

Le système assigne automatiquement le prestataire le plus pertinent (selon localisation, spécialités, charge de travail). Le client peut optionnellement voir et choisir parmi d'autres prestataires disponibles pour ce créneau.

**Why this priority**: Assure une expérience personnalisée et optimise l'attribution. Pas MVP strict mais améliore satisfaction et conversion.

**Independent Test**: Peut être testé en validant un créneau et vérifiant qu'un prestataire est assigné automatiquement. Délivre la valeur : "Client obtient le meilleur prestataire disponible".

**Acceptance Scenarios**:

1. **Given** un client ayant sélectionné un créneau, **When** le système assigne un prestataire, **Then** le profil du prestataire (nom, photo, spécialités) s'affiche
2. **Given** plusieurs prestataires disponibles pour le créneau, **When** le client consulte les options, **Then** il peut voir jusqu'à 3 prestataires alternatifs avec leurs profils
3. **Given** un client changeant de prestataire, **When** il sélectionne un autre prestataire, **Then** le parcours continue avec le nouveau prestataire assigné
4. **Given** le prestataire assigné a 4.8/5 d'évaluation, **When** son profil s'affiche, **Then** ses notes et nombre d'avis apparaissent

---

### User Story 4 - Ajout de Services Additionnels (Priority: P3)

Avant de finaliser, le client peut ajouter des services complémentaires (extension de durée, options supplémentaires) pour agrémenter sa réservation.

**Why this priority**: Augmente le panier moyen et la satisfaction mais n'est pas essentiel au parcours minimal. Nice-to-have pour MVP.

**Independent Test**: Peut être testé en ajoutant un service additionnel et vérifiant la mise à jour du prix total. Délivre la valeur : "Client personnalise son expérience".

**Acceptance Scenarios**:

1. **Given** un client ayant sélectionné son créneau, **When** il accède aux options additionnelles, **Then** les services compatibles s'affichent avec leurs prix
2. **Given** un client ajoutant "Extension +30 min", **When** il valide, **Then** le prix total et la durée totale sont mis à jour en temps réel
3. **Given** un service additionnel causant un conflit de disponibilité, **When** le client tente de l'ajouter, **Then** le système propose de recalculer les créneaux compatibles
4. **Given** un client ayant ajouté 2 options, **When** il consulte le récapitulatif, **Then** toutes les options apparaissent avec possibilité de retirer

---

### User Story 5 - Application Codes Promo et Cartes Cadeaux (Priority: P2)

Le client peut appliquer un code promotionnel ou utiliser le solde d'une carte cadeau pour réduire le montant à payer.

**Why this priority**: Levier marketing important et fonctionnalité attendue. Impacte directement le taux de conversion.

**Independent Test**: Peut être testé en appliquant un code promo valide et vérifiant la réduction du prix. Délivre la valeur : "Client bénéficie de réductions".

**Acceptance Scenarios**:

1. **Given** un client au récapitulatif, **When** il saisit un code promo valide "WELCOME10", **Then** une réduction de 10% est appliquée au total
2. **Given** un code promo avec condition d'achat minimum 50€, **When** le panier est à 40€, **Then** un message indique le montant manquant pour activer le code
3. **Given** un client ayant une carte cadeau de 30€, **When** il l'applique à un service de 80€, **Then** il ne paie que 50€ et la carte est débitée de 30€
4. **Given** un client utilisant code promo + carte cadeau, **When** les deux sont appliqués, **Then** l'ordre de priorité est respecté (promo d'abord, puis carte cadeau)

---

### User Story 6 - Paiement et Confirmation Finale (Priority: P1)

Le client finalise sa réservation en fournissant ses informations de paiement. Une pré-autorisation Stripe est effectuée (pas de débit immédiat). Il reçoit une confirmation instantanée.

**Why this priority**: Étape terminale critique. Sans paiement, aucune réservation n'est confirmée. MVP absolu.

**Independent Test**: Peut être testé en fournissant une carte de test Stripe et vérifiant la création de la réservation. Délivre la valeur : "Client a sa réservation confirmée et payée".

**Acceptance Scenarios**:

1. **Given** un client au paiement, **When** il saisit ses informations de carte bancaire, **Then** elles sont validées en temps réel (format, date d'expiration)
2. **Given** un client validant le paiement, **When** la pré-autorisation Stripe réussit, **Then** une réservation est créée avec statut "En attente de confirmation prestataire"
3. **Given** une réservation confirmée, **When** le paiement réussit, **Then** le client reçoit un email de confirmation avec tous les détails
4. **Given** un client ayant sauvegardé une carte, **When** il accède au paiement, **Then** ses cartes enregistrées sont proposées pour paiement en 1-clic

---

### User Story 7 - Réservation Directe via Slug Prestataire (Priority: P2)

Un client reçoit un lien personnalisé d'un prestataire (ex: simone.paris/book/marie-dupont-massage) et accède directement à la page de réservation de ce prestataire spécifique. La page affiche le profil du prestataire, ses services explicitement configurés (via table contractor_services), et uniquement ses disponibilités. Le parcours de réservation reste identique mais pré-filtré sur ce prestataire unique. Le contractor_id est stocké en session (pas le slug) pour garantir la continuité même si le prestataire change de slug pendant la réservation. Les anciennes URLs de prestataires sont redirigées pendant 30 jours.

**Why this priority**: Permet aux prestataires de partager leur lien personnalisé sur leurs réseaux sociaux, cartes de visite, ou site web. Génère du trafic qualifié et améliore l'acquisition client. Important pour le marketing mais pas critique pour le MVP.

**Independent Test**: Peut être testé en accédant à `/book/:contractor_slug`, vérifiant l'affichage du profil prestataire, les services filtrés, et que les créneaux affichés sont uniquement ceux de ce prestataire. Délivre la valeur : "Client réserve directement avec un prestataire spécifique".

**Acceptance Scenarios**:

1. **Given** un client cliquant sur simone.paris/book/marie-dupont-massage, **When** la page se charge, **Then** il voit le profil complet de Marie Dupont (photo, bio, spécialités, évaluations) en haut de page, et une entrée est créée dans contractor_slug_analytics pour tracking
2. **Given** un client sur la page d'un prestataire via slug, **When** il consulte les services disponibles, **Then** seuls les services explicitement activés dans contractor_services pour ce prestataire s'affichent (avec prix et durée custom si configurés)
3. **Given** un client sélectionnant un service sur la page du prestataire, **When** il arrive à l'étape de choix de créneau, **Then** le calendrier affiche uniquement les disponibilités de ce prestataire (pas d'autres prestataires proposés), et le contractor_id est stocké en session
4. **Given** un client ayant sélectionné un créneau via slug prestataire, **When** il arrive à l'étape de confirmation, **Then** le prestataire est verrouillé (pas d'option de changement) et le parcours continue normalement
5. **Given** un client accédant à simone.paris/book/marie-dupont?service=massage-suedois, **When** la page se charge, **Then** le service "Massage suédois" est automatiquement pré-sélectionné (si le prestataire le propose)
6. **Given** un client accédant à simone.paris/book/marie-dupont?service=yoga, **When** Marie ne propose pas de yoga, **Then** un message affiche "Ce prestataire ne propose pas ce service" et la liste complète de ses services s'affiche
7. **Given** un prestataire dont le slug est "marie-dupont", **When** il le modifie en "marie-massage-paris", **Then** l'ancien lien simone.paris/book/marie-dupont redirige automatiquement (301) vers marie-massage-paris pendant 30 jours
8. **Given** un client en cours de réservation sur /book/marie-dupont, **When** Marie change son slug pendant la session, **Then** la réservation continue normalement car le contractor_id (pas le slug) est stocké en session
9. **Given** un client accédant à un ancien slug après 30 jours d'expiration, **When** la page se charge, **Then** une page 404 personnalisée affiche "Ce prestataire a modifié son lien. Veuillez le contacter pour obtenir le nouveau lien."
10. **Given** un client accédant à un slug inexistant, **When** la page se charge, **Then** une page 404 personnalisée suggère de chercher un prestataire ou retourner à l'accueil
11. **Given** un prestataire inactif ou suspendu, **When** un client accède à son slug, **Then** un message indique "Ce prestataire n'est pas disponible actuellement" avec possibilité de chercher d'autres prestataires
12. **Given** un prestataire sans aucune disponibilité dans les 30 prochains jours, **When** un client accède à son slug, **Then** un message affiche "Aucun créneau disponible pour le moment" avec un formulaire pour être notifié par email lors de nouvelles disponibilités
13. **Given** un client complétant une réservation via slug, **When** le paiement est confirmé, **Then** le champ "converted" de contractor_slug_analytics passe à true et booking_id est renseigné pour calcul du taux de conversion

---

### Edge Cases

- **Session expirée pendant le parcours**: Si le client prend 30 minutes pour compléter, le créneau peut être pris entre-temps. Le système doit vérifier la disponibilité avant paiement.
- **Adresse hors zone couverte**: Le client saisit une adresse dans une ville non couverte. Gérer gracieusement avec suggestion.
- **Client en vacances dans une zone couverte**: Un client de Paris utilise les services à Lyon pendant ses vacances. Il doit pouvoir saisir une nouvelle adresse temporaire (hôtel, location) tout en conservant ses adresses habituelles.
- **Adresse principale déplacée hors zone**: Un client déménage et sa nouvelle adresse par défaut est hors zone de service. Comment gérer les réservations futures ?
- **Changement de prix pendant le parcours**: Si un administrateur modifie le prix d'un service pendant qu'un client réserve, quelle version du prix appliquer ?
- **Paiement échoué après plusieurs tentatives**: Après 3 échecs de paiement, bloquer temporairement et suggérer contact support.
- **Code promo expiré en cours de réservation**: Le code était valide au début mais expire pendant le parcours.
- **Client non connecté**: Doit-on permettre la réservation en tant qu'invité ou forcer la connexion/inscription ?
- **Multiple tabs / fenêtres**: Client ouvre 2 réservations du même service en parallèle. Gérer les conflits de créneaux.
- **Prestataire devient indisponible**: Entre la sélection du créneau et le paiement, le prestataire se marque indisponible.
- **Nouvelle adresse non enregistrée**: Client décoche la case "Enregistrer cette adresse" mais utilise souvent cette adresse temporaire. Comment suggérer de l'enregistrer ?

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT afficher un catalogue de services navigable par catégories
- **FR-002**: Le système DOIT permettre à un client de sélectionner un service pour initier une réservation
- **FR-003**: Le système DOIT pré-remplir automatiquement l'adresse principale (par défaut) du client connecté lors de l'étape d'adresse
- **FR-004**: Le système DOIT permettre au client de modifier l'adresse pré-remplie en cliquant sur "Changer d'adresse"
- **FR-005**: Le système DOIT permettre à un client connecté de sélectionner rapidement parmi toutes ses adresses enregistrées (domicile, travail, autre)
- **FR-006**: Le système DOIT afficher un champ de saisie d'adresse avec autocomplétion Google Places API pour les nouvelles adresses
- **FR-007**: Le système DOIT suggérer des adresses complètes après 3 caractères saisis minimum (autocomplétion)
- **FR-008**: Le système DOIT permettre au client d'enregistrer une nouvelle adresse saisie pour usage ultérieur (checkbox optionnelle)
- **FR-009**: Le système DOIT valider que l'adresse est dans une zone de service couverte avant de continuer
- **FR-010**: Le système DOIT afficher un calendrier interactif avec les créneaux disponibles (provenant de spec 002)
- **FR-011**: Le système DOIT permettre de naviguer entre les jours et semaines dans le calendrier
- **FR-012**: Le système DOIT afficher les créneaux disponibles en moins de 3 secondes
- **FR-013**: Le système DOIT permettre au client de sélectionner un créneau disponible
- **FR-014**: Le système DOIT assigner automatiquement le prestataire le plus pertinent pour le créneau sélectionné
- **FR-015**: Le système DOIT afficher le profil du prestataire assigné (nom, photo, spécialités, évaluation)
- **FR-016**: Le système DOIT permettre au client de voir d'autres prestataires disponibles pour ce créneau (si configuré)
- **FR-017**: Le système DOIT afficher les services additionnels compatibles avec le service principal
- **FR-018**: Le système DOIT mettre à jour le prix total en temps réel lors de l'ajout/retrait d'options
- **FR-019**: Le système DOIT permettre d'appliquer un code promotionnel au panier
- **FR-020**: Le système DOIT valider le code promotionnel (validité, conditions, montant)
- **FR-021**: Le système DOIT permettre d'appliquer le solde d'une carte cadeau
- **FR-022**: Le système DOIT calculer correctement l'ordre d'application des réductions (promo puis carte cadeau)
- **FR-023**: Le système DOIT afficher un récapitulatif complet avant paiement (service, date, heure, adresse, prestataire, prix)
- **FR-024**: Le système DOIT intégrer un formulaire de paiement sécurisé via Stripe
- **FR-025**: Le système DOIT effectuer une pré-autorisation (pas capture immédiate) lors du paiement
- **FR-026**: Le système DOIT créer une réservation avec statut "En attente" après pré-autorisation réussie
- **FR-027**: Le système DOIT envoyer un email de confirmation au client
- **FR-028**: Le système DOIT notifier le prestataire de la nouvelle réservation
- **FR-029**: Le système DOIT permettre l'accès à la page de réservation d'un prestataire via la route `/book/:contractor_slug`
- **FR-030**: Le système DOIT afficher le profil complet du prestataire (photo, nom, bio, spécialités, évaluations) sur sa page de réservation dédiée
- **FR-031**: Le système DOIT filtrer les services affichés pour ne montrer que ceux explicitement activés dans la table contractor_services pour ce prestataire (avec prix et durée custom si configurés)
- **FR-032**: Le système DOIT filtrer le calendrier de disponibilités pour n'afficher que les créneaux du prestataire concerné
- **FR-033**: Le système DOIT verrouiller le prestataire sélectionné (pas de changement possible) lors d'une réservation via slug
- **FR-034**: Le système DOIT stocker le contractor_id (pas le slug) dans la session de réservation pour éviter les conflits lors de changement de slug
- **FR-035**: Le système DOIT enregistrer chaque visite sur /book/:slug dans contractor_slug_analytics (contractor_id, slug_used, timestamp, referrer, user_agent, session_id)
- **FR-036**: Le système DOIT marquer les conversions en mettant à jour contractor_slug_analytics (converted: true, booking_id, conversion_timestamp) lors de la confirmation de paiement
- **FR-037**: Le système DOIT vérifier si un slug a été changé en consultant slug_history et rediriger (301) vers le nouveau slug si dans la période de 30 jours
- **FR-038**: Le système DOIT retourner une page 404 personnalisée pour les anciens slugs expirés avec message "Ce prestataire a modifié son lien"
- **FR-039**: Le système DOIT retourner une page 404 personnalisée si le slug n'existe pas avec suggestions de recherche
- **FR-040**: Le système DOIT empêcher l'accès aux pages de prestataires inactifs ou suspendus et afficher un message approprié
- **FR-041**: Le système DOIT accepter un paramètre optionnel ?service=[service_slug] sur l'URL /book/:slug pour pré-sélectionner un service
- **FR-042**: Le système DOIT vérifier que le prestataire propose le service pré-sélectionné via contractor_services, sinon afficher un message d'erreur et la liste complète de ses services
- **FR-043**: Le système DOIT afficher un message "Aucun créneau disponible pour le moment" si le prestataire n'a aucune disponibilité dans les 30 prochains jours, avec formulaire de notification email

### Key Entities

> **Note importante**: Les noms de tables et colonnes ci-dessous sont en français pour faciliter la lecture de la spec. Ils seront traduits en anglais (snake_case) lors de la phase de planification, conformément à la constitution du projet. Les commentaires SQL en français seront ajoutés pour expliquer l'usage des colonnes.

- **Booking Journey Session**: Session temporaire tracking le parcours du client (service sélectionné, adresse, créneau, contractor_id: UUID stocké pour éviter conflits de slug, options, expiration, contractor_slug_locked: boolean indiquant si réservation via slug, slug_analytics_entry_id: pour lier à contractor_slug_analytics)
- **Service Catalog**: Liste des services disponibles avec prix, durée, catégories, photos
- **Contractor Services (contractor_services)**: Table de liaison many-to-many définissant explicitement quels services chaque prestataire propose (contractor_id, service_id, is_active: BOOLEAN, custom_price: DECIMAL NULLABLE, custom_duration: INT NULLABLE, added_at: TIMESTAMP)
- **Client Address (client_addresses)**: Adresses enregistrées du client (type: domicile/travail/autre, rue, ville, code postal, coordonnées GPS, adresse par défaut: boolean, label personnalisé)
- **Service Address**: Adresse sélectionnée pour une réservation spécifique (peut être une adresse enregistrée ou une nouvelle adresse temporaire)
- **Time Slot Selection**: Créneau sélectionné temporairement (date, heure, prestataire assigné)
- **Cart**: Panier avec service principal, options additionnelles, codes promo, prix total calculé
- **Booking Confirmation**: Réservation confirmée (identifiant unique, statut, détails complets, adresse de service, PaymentIntent Stripe, slug_analytics_entry_id: pour marquer la conversion)
- **Contractor Slug (contractors.slug)**: Slug unique du prestataire (VARCHAR(50), UNIQUE, NOT NULL) permettant accès direct via `/book/:slug` (ex: "marie-dupont-massage")
- **Slug History (slug_history)**: Historique des changements de slug pour redirections (id, contractor_id, old_slug, new_slug, created_at, expires_at: created_at + 30 jours, is_active)
- **Contractor Slug Analytics (contractor_slug_analytics)**: Statistiques de visite par slug (id, contractor_id, slug_used, visited_at, referrer, user_agent, session_id, converted: BOOLEAN DEFAULT false, booking_id: UUID NULLABLE, conversion_timestamp: TIMESTAMP NULLABLE)
- **Availability Notification Request (availability_notification_requests)**: Demandes de notification lorsqu'un prestataire sans disponibilité en aura (contractor_id, client_email, requested_at, notified_at: NULLABLE, status: pending/notified/expired)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Les clients peuvent compléter le parcours de réservation en moins de 3 minutes en moyenne
- **SC-002**: Le taux de conversion (service sélectionné → réservation confirmée) atteint au moins 60%
- **SC-003**: Le taux d'abandon du panier est inférieur à 30%
- **SC-004**: 90% des clients trouvent et sélectionnent un créneau en moins de 2 minutes
- **SC-005**: Le temps de chargement du calendrier est inférieur à 3 secondes dans 95% des cas
- **SC-006**: Les suggestions d'adresses apparaissent en moins de 500ms après la saisie
- **SC-007**: 85% des clients utilisent l'autocomplétion d'adresse plutôt que la saisie manuelle complète
- **SC-008**: Le panier moyen augmente de 20% grâce aux services additionnels
- **SC-009**: 40% des réservations utilisent un code promo ou carte cadeau
- **SC-010**: Le taux d'échec de paiement est inférieur à 5%

## Assumptions

- Les clients utilisent des navigateurs modernes supportant JavaScript
- L'API Google Places est disponible et fonctionnelle
- Stripe est configuré et opérationnel pour les pré-autorisations
- Les créneaux affichés sont calculés en temps réel (dépendance spec 002)
- Les clients acceptent les conditions générales avant paiement
- La plupart des clients complètent le parcours en une seule session
- Les prestataires répondent aux nouvelles réservations dans les 24h

## Dependencies

- Spec 002 (Algorithme de disponibilités) pour le calcul des créneaux
- API Google Places pour l'autocomplétion d'adresses
- API Google Geocoding pour valider et normaliser les adresses
- Stripe pour le traitement des paiements (pré-autorisation)
- Service email (Resend) pour les confirmations
- Service de notifications pour alerter les prestataires

## Out of Scope

- Réservation en tant qu'invité (non connecté)
- Réservation récurrente (tous les lundis pendant 3 mois)
- Panier multi-services (réserver plusieurs services différents simultanément)
- Wishlist ou favoris de services
- Comparaison de prestataires côte à côte
- Personnalisation du service (notes spéciales, demandes particulières)
- Réservation pour quelqu'un d'autre (offrir en cadeau)
- Split payment (payer à plusieurs)
