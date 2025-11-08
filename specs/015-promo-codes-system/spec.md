# Feature Specification: Système de Codes Promotionnels

**Feature Branch**: `015-promo-codes-system`
**Created**: 2025-11-07
**Status**: ✅ Backend Implémenté | 🚧 Frontend En Attente
**Input**: "Système de codes promo où la plateforme absorbe le coût de la réduction et les prestataires reçoivent leur commission complète sur le prix original"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Utilise Code de Bienvenue (Priority: P1)

Un nouveau client découvre Simone Paris et souhaite réserver son premier service. Il possède un code promotionnel de bienvenue (20% de réduction) reçu via email marketing. Il veut l'appliquer lors du paiement pour bénéficier de la réduction.

**Why this priority**: Fonctionnalité d'acquisition client essentielle. Sans elle, impossible de lancer des campagnes marketing pour attirer de nouveaux utilisateurs. MVP absolu pour le growth.

**Independent Test**: Peut être testé en créant un code "BIENVENUE20", l'appliquant lors d'une réservation, et vérifiant que le prix est réduit de 20% côté client. Délivre la valeur : "Les nouveaux clients bénéficient de réductions attractives".

**Acceptance Scenarios**:

1. **Given** un client sur la page de paiement d'une réservation de 100€, **When** il saisit le code "BIENVENUE20" et clique sur "Appliquer", **Then** le système valide le code en temps réel (<500ms), affiche "Code promo appliqué! Vous économisez 20€", met à jour le prix à 80€, et montre le prix original barré
2. **Given** un client ayant appliqué un code promo, **When** il confirme et paie la réservation, **Then** le montant débité est 80€ (prix réduit), la base de données enregistre `service_amount_original=100€`, `promo_discount_amount=20€`, `service_amount=80€`, et le code est incrémenté (`uses_count++`)
3. **Given** un client ayant déjà utilisé le code "BIENVENUE20" lors d'une réservation précédente, **When** il tente de l'utiliser à nouveau, **Then** le système affiche "Vous avez déjà utilisé ce code promo" et n'applique pas la réduction
4. **Given** un client ayant appliqué un code promo, **When** il clique sur "Retirer le code promo", **Then** le prix revient à 100€ et le champ de saisie est vidé

---

### User Story 2 - Admin Crée Campagne Promo Saisonnière (Priority: P1)

L'équipe marketing souhaite lancer une campagne pour la Saint-Valentin avec un code promotionnel offrant 25% de réduction (plafonnée à 40€) sur tous les massages duo, valable du 1er au 14 février, avec un maximum de 200 utilisations.

**Why this priority**: Sans interface admin pour créer/gérer les codes, impossible d'utiliser le système. Critique pour l'autonomie marketing. MVP absolu.

**Independent Test**: Peut être testé en créant le code via l'interface admin, vérifiant qu'il apparaît dans la liste, et tentant de l'utiliser côté client. Délivre la valeur : "L'équipe marketing peut lancer des campagnes promotionnelles en autonomie".

**Acceptance Scenarios**:

1. **Given** un admin connecté au backoffice, **When** il navigue vers "Promotions > Nouveau code promo", **Then** un formulaire complet s'affiche avec tous les champs (code, description, type de réduction, valeur, plafond, période, limites, restrictions)
2. **Given** un admin remplissant le formulaire avec : Code="VALENTIN25", Type="Pourcentage", Valeur=25%, Plafond=40€, Catégorie="Massage Duo", Période=01/02-14/02, Max=200 utilisations, **When** il clique sur "Créer le code promo", **Then** le code est créé en base avec `is_active=true`, une notification de succès s'affiche, et il est redirigé vers la liste des codes
3. **Given** un admin consultant la liste des codes promo, **When** il filtre par "Actifs" et "Type: Pourcentage", **Then** seuls les codes actifs de type pourcentage sont affichés avec colonnes : Code, Description, Valeur, Utilisations (X/Max), Statut
4. **Given** un admin voulant temporairement désactiver un code, **When** il clique sur le toggle "Actif/Inactif" d'un code, **Then** `is_active` passe à `false`, le code n'est plus utilisable côté client, mais reste visible dans l'interface admin

---

### User Story 3 - Prestataire Voit Transparence Commission (Priority: P2)

Un prestataire consulte ses transactions et remarque qu'un client a utilisé un code promo. Il veut comprendre l'impact sur sa rémunération et être rassuré que sa commission reste calculée sur le prix original du service.

**Why this priority**: Essentiel pour la confiance des prestataires. Sans transparence, risque de conflits et plaintes. Critique pour la satisfaction prestataire.

**Independent Test**: Peut être testé en créant une réservation avec code promo et vérifiant que le dashboard prestataire affiche clairement le calcul de commission sur le montant original. Délivre la valeur : "Les prestataires ont confiance dans le système de rémunération".

**Acceptance Scenarios**:

1. **Given** un prestataire consultant ses transactions, **When** il ouvre le détail d'une réservation avec code promo utilisé, **Then** il voit : Prix original (120€), Code promo utilisé (BIENVENUE20), Réduction client (-24€), Montant payé par client (96€), et **Commission prestataire calculée sur 120€** (pas 96€)
2. **Given** un prestataire visualisant son dashboard financier, **When** il consulte la section "Statistiques", **Then** il voit : "X% de vos clients ont utilisé un code promo" et une info-bulle expliquant "Votre commission est toujours calculée sur le prix original. La réduction est prise en charge par la plateforme."
3. **Given** un prestataire filtrant ses transactions, **When** il sélectionne "Avec code promo uniquement", **Then** seules les réservations ayant `promo_code_id IS NOT NULL` sont affichées avec un badge "Code promo"

---

### User Story 4 - Admin Analyse ROI des Campagnes (Priority: P2)

L'équipe marketing veut évaluer la performance des codes promotionnels : combien ont été utilisés, quel a été le coût pour la plateforme, et quel chiffre d'affaires ils ont généré pour calculer le ROI.

**Why this priority**: Nécessaire pour optimiser les budgets marketing et prendre des décisions data-driven. Important mais pas bloquant pour le lancement initial.

**Independent Test**: Peut être testé en créant plusieurs codes, simulant des utilisations, et vérifiant que les KPIs s'affichent correctement dans le dashboard analytics. Délivre la valeur : "L'équipe marketing peut mesurer le ROI de ses campagnes".

**Acceptance Scenarios**:

1. **Given** un admin accédant à "Promotions > Analytics", **When** la page se charge, **Then** il voit des KPIs : Codes actifs (12), Utilisations totales (347), Coût total plateforme (4.580€), CA généré via promos (47.890€), ROI (945%)
2. **Given** un admin consultant le tableau "Top 5 codes", **When** il trie par "Coût plateforme" décroissant, **Then** il voit : Code, Utilisations, Coût total, Coût moyen, Taux de conversion
3. **Given** un admin voulant exporter les données, **When** il clique sur "Exporter en CSV", **Then** un fichier CSV est téléchargé avec toutes les utilisations : date, code, utilisateur, montant original, réduction, montant final
4. **Given** un admin analysant un code spécifique, **When** il clique sur "Détails" d'un code (ex: BIENVENUE20), **Then** il voit : graphique d'utilisation dans le temps, liste des utilisateurs, statistiques (127 utilisations, 2.540€ de coût, taux de conversion 82%)

---

### User Story 5 - Client Reçoit Message d'Erreur Clair (Priority: P3)

Un client tente d'utiliser un code promo mais celui-ci est invalide (expiré, épuisé, montant minimum non atteint, etc.). Il doit comprendre pourquoi le code ne fonctionne pas avec un message d'erreur explicite.

**Why this priority**: Améliore l'UX mais pas bloquant. Les clients peuvent toujours réserver sans code promo. Nice to have pour réduire la frustration.

**Independent Test**: Peut être testé en créant différents scénarios d'erreur et vérifiant que les messages sont clairs et actionnables. Délivre la valeur : "Moins de frustration client et moins de tickets support".

**Acceptance Scenarios**:

1. **Given** un client saisissant un code inexistant (ex: "FAKEPROMO"), **When** il clique sur "Appliquer", **Then** le système affiche "Ce code promo n'existe pas" en rouge sous le champ
2. **Given** un client saisissant un code expiré (ex: "NOEL2024" avec `valid_until` dépassée), **When** il clique sur "Appliquer", **Then** le système affiche "Ce code promo a expiré le 31/12/2024"
3. **Given** un client saisissant un code épuisé (ex: "LIMITE100" avec `uses_count=100` et `max_uses=100`), **When** il clique sur "Appliquer", **Then** le système affiche "Ce code promo a atteint sa limite d'utilisation"
4. **Given** un client avec un panier de 40€ tentant d'utiliser un code avec `min_order_amount=50€`, **When** il clique sur "Appliquer", **Then** le système affiche "Montant minimum requis : 50€ (votre panier : 40€)"
5. **Given** un client réservant un massage mais tentant d'utiliser un code restreint aux soins visage, **When** il clique sur "Appliquer", **Then** le système affiche "Ce code promo n'est pas valable pour ce service"

---

### Edge Cases

- **Annulation avec code promo**: Que se passe-t-il si un client annule une réservation qui avait un code promo ? → Le compteur `uses_count` est décrémenté (trigger SQL), le client peut réutiliser le code si `max_uses_per_user` le permet
- **Code promo + pourboire**: Comment gérer un pourboire sur une réservation avec code promo ? → Le pourboire est calculé sur le montant **original** (avant réduction) pour être équitable envers le prestataire
- **Modification de réservation avec promo**: Un client modifie une réservation (changement de date/service) qui avait un code promo, le code reste-t-il applicable ? → Si le nouveau service est éligible et que la période de validité est respectée, le code reste appliqué ; sinon, il est retiré et le client est notifié
- **Code promo partiellement utilisé**: Un client utilise un code "SIMONE10" (10€ fixe) sur un service de 8€, que se passe-t-il ? → La réduction est plafonnée au montant du service (8€), le service devient gratuit, mais la plateforme perd 8€ (pas 10€)
- **Concurrence de codes**: Un client tente d'appliquer deux codes promo simultanément, que se passe-t-il ? → Le système n'autorise qu'un seul code par réservation (`promo_code_id` est unique), si un code est déjà appliqué et qu'un second est saisi, le premier est remplacé
- **Fraude - brute force**: Un utilisateur tente de valider 50 codes différents en 5 minutes pour trouver un code valide, comment le système réagit ? → Rate limiting (max 5 validations/minute), captcha après 5 échecs, blocage temporaire (15min) après 10 tentatives, alert admin si pattern suspect
- **Code promo pour service à 0€**: Que se passe-t-il si un service est déjà gratuit (offre spéciale) et qu'un code promo est appliqué ? → Le système autorise la validation mais `promo_discount_amount=0€` car pas de réduction possible
- **Changement de plafond après utilisation**: Un admin modifie `max_uses` de 100 à 50 alors qu'il y a déjà 70 utilisations, que se passe-t-il ? → Le code devient automatiquement inutilisable (`uses_count=70 > max_uses=50`), validation retourne erreur "Code épuisé"

## Requirements *(mandatory)*

### Functional Requirements

#### Gestion des Codes Promo (Admin)

- **FR-001**: Le système DOIT permettre aux administrateurs de créer un nouveau code promo avec : code unique (alphanumériques, max 50 caractères), description, type de réduction (pourcentage ou montant fixe), valeur de réduction, plafond optionnel (pour pourcentage), période de validité (date de début et fin), limites d'utilisation (max global et max par utilisateur), restrictions (montant minimum, premier achat uniquement, services spécifiques, catégories spécifiques)
- **FR-002**: Le système DOIT valider l'unicité du code promo lors de la création (contrainte UNIQUE sur `promo_codes.code`)
- **FR-003**: Les administrateurs DOIVENT pouvoir désactiver temporairement un code promo sans le supprimer (`is_active = false`)
- **FR-004**: Le système DOIT afficher une liste paginée de tous les codes promo avec filtres (actif/inactif, type, expiré/valide) et tri (date création, utilisations, coût)
- **FR-005**: Les administrateurs DOIVENT pouvoir éditer un code promo existant (uniquement si `uses_count = 0` pour éviter incohérences)
- **FR-006**: Les administrateurs DOIVENT pouvoir dupliquer un code promo existant pour créer une nouvelle campagne similaire
- **FR-007**: Le système DOIT empêcher la suppression d'un code promo ayant des utilisations enregistrées (`uses_count > 0`)

#### Validation et Application (Client)

- **FR-008**: Le système DOIT fournir un champ de saisie de code promo sur la page de paiement/checkout
- **FR-009**: Le système DOIT valider le code promo en temps réel (<500ms) via la fonction `validate_promo_code()` qui vérifie : existence du code, statut actif, période de validité, limites d'utilisation, éligibilité utilisateur, montant minimum, restrictions de service/catégorie
- **FR-010**: Le système DOIT calculer la réduction selon le type : pour "percentage" → `discount_amount = MIN(service_amount × discount_value/100, max_discount_amount)`, pour "fixed_amount" → `discount_amount = MIN(discount_value, service_amount)`
- **FR-011**: Le système DOIT afficher le prix original barré, la réduction, et le prix final lors de l'application d'un code promo
- **FR-012**: Le système DOIT permettre au client de retirer un code promo appliqué et revenir au prix original
- **FR-013**: Le système DOIT afficher des messages d'erreur explicites et actionnables en cas d'invalidité (code inexistant, expiré, épuisé, déjà utilisé, montant minimum, service non éligible)
- **FR-014**: Le système DOIT n'autoriser qu'un seul code promo par réservation (pas de cumul)

#### Traçabilité et Compteurs

- **FR-015**: Le système DOIT incrémenter `promo_codes.uses_count` lors de la création d'une réservation avec code promo (trigger `trg_promo_usage_on_booking`)
- **FR-016**: Le système DOIT créer une entrée dans `promo_code_usage` pour tracer chaque utilisation (promo_code_id, booking_id, user_id, montants, date)
- **FR-017**: Le système DOIT décrémenter `uses_count` en cas d'annulation de réservation et supprimer l'entrée de traçabilité (trigger `trg_promo_usage_on_cancel`)
- **FR-018**: Le système DOIT persister les montants suivants dans `appointment_bookings` : `service_amount_original` (prix avant réduction), `promo_discount_amount` (montant de la réduction), `service_amount` (prix final payé par client)

#### Calculs Financiers

- **FR-019**: Le système DOIT calculer la commission prestataire sur le montant **ORIGINAL** du service, PAS sur le montant réduit (formule : `COALESCE(service_amount_original, service_amount) × (100 - commission_rate) / 100`)
- **FR-020**: Le système DOIT calculer le coût marketing pour la plateforme comme étant égal à `promo_discount_amount`
- **FR-021**: Le système DOIT créer un PaymentIntent Stripe avec le montant **réduit** (`service_amount`) et inclure les metadata : `service_amount_original`, `promo_code_id`, `promo_discount_amount`
- **FR-022**: Le système DOIT calculer le pourboire suggéré sur le montant **original** du service pour être équitable envers le prestataire

#### Analytics et Reporting

- **FR-023**: Le système DOIT fournir une page analytics avec KPIs : nombre de codes actifs, utilisations totales, coût total plateforme, CA généré via promos, ROI
- **FR-024**: Le système DOIT afficher un tableau "Top codes" triable par : utilisations, coût plateforme, taux de conversion
- **FR-025**: Le système DOIT permettre l'export CSV de toutes les utilisations avec colonnes : date, code, utilisateur, service, montant original, réduction, montant final
- **FR-026**: Le système DOIT afficher pour chaque code : graphique d'utilisation dans le temps, liste des utilisateurs, statistiques détaillées

#### Sécurité et Anti-Fraude

- **FR-027**: Le système DOIT implémenter un rate limiting : max 5 validations de code promo par minute par utilisateur
- **FR-028**: Le système DOIT demander un captcha après 5 tentatives de validation échouées consécutives
- **FR-029**: Le système DOIT bloquer temporairement (15 minutes) un utilisateur après 10 tentatives échouées
- **FR-030**: Le système DOIT alerter les administrateurs en cas de pattern frauduleux détecté (>20 tentatives/heure, >10 codes différents/heure)
- **FR-031**: Le système DOIT sanitizer les inputs de code promo (alphanumériques uniquement, majuscules, trim)

#### Notifications

- **FR-032**: Le système DOIT inclure les informations de code promo dans l'email de confirmation client (prix original barré, réduction, montant économisé)
- **FR-033**: Le système DOIT inclure une info-bulle dans l'email prestataire expliquant que sa commission est calculée sur le prix original si un code promo a été utilisé
- **FR-034**: Le système DOIT permettre aux administrateurs d'envoyer des campagnes email avec codes promo personnalisés

### Key Entities *(include if feature involves data)*

- **PromoCode**: Représente un code promotionnel avec ses règles (code unique, type de réduction, valeur, plafond, période de validité, limites d'utilisation, restrictions). Relations : 1-N avec PromoCodeUsage, 1-N avec AppointmentBooking
- **PromoCodeUsage**: Enregistre chaque utilisation d'un code promo (quel code, quelle réservation, quel utilisateur, quels montants, quand). Relations : N-1 avec PromoCode, 1-1 avec AppointmentBooking, N-1 avec User
- **AppointmentBooking** (étendu): Réservation avec nouvelles colonnes pour gérer les codes promo (montant original, ID du code utilisé, montant de réduction). Relations : N-1 avec PromoCode, N-1 avec User (client), N-1 avec Contractor

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: À 1 mois de lancement, 15% des réservations utilisent un code promo
- **SC-002**: Le taux de conversion des réservations avec code promo est > 25% (vs <20% sans promo)
- **SC-003**: Le ROI des campagnes promotionnelles est > 400% (4€ de CA pour 1€ de coût promo)
- **SC-004**: Le Coût d'Acquisition Client (CAC) via codes promo est < 20€ par nouveau client
- **SC-005**: Les prestataires ont un taux de satisfaction > 90% concernant la transparence des commissions avec codes promo (sondage trimestriel)
- **SC-006**: 0 erreur de calcul de commission signalée par les prestataires
- **SC-007**: Le temps de validation d'un code promo est < 500ms dans 95% des cas
- **SC-008**: Le taux de frustration client lié aux codes promo (tickets support) est < 2% du total des utilisations
- **SC-009**: À 3 mois, 30% des clients ayant utilisé un code promo reviennent pour réserver sans code promo (indicateur de rétention)
- **SC-010**: Les administrateurs peuvent créer un nouveau code promo en moins de 2 minutes (test d'utilisabilité)

## Technical Constraints

- **TC-001**: La fonction `validate_promo_code()` doit retourner un résultat en <500ms pour 95% des appels (performance)
- **TC-002**: La base de données doit supporter jusqu'à 1000 codes promo actifs simultanément sans dégradation (scalabilité)
- **TC-003**: Le système doit gérer jusqu'à 10.000 utilisations de codes promo par jour sans dégradation (scalabilité)
- **TC-004**: Les triggers SQL (`trg_promo_usage_on_booking`, `trg_promo_usage_on_cancel`) ne doivent pas ajouter plus de 100ms au temps de création/annulation de réservation (performance)
- **TC-005**: Les vues financières (`contractor_financial_summary`, `contractor_transaction_details`) doivent se rafraîchir en <2 secondes même avec 100.000 réservations (performance)

## Dependencies

### Upstream Dependencies (Must exist before this feature)

- **DEP-001**: Spec 007 - Interface Prestataire (dashboard pour afficher transparence commission)
- **DEP-002**: Spec 003 - Booking Flow (page checkout pour saisir code promo)
- **DEP-003**: Spec 004 - Stripe Payment (PaymentIntent avec metadata promo)
- **DEP-004**: Spec 005 - Admin Backoffice (interface de gestion codes promo)

### Downstream Dependencies (Will use this feature)

- **DEP-005**: Spec 011 - Gift Cards (potentiel cumul carte cadeau + code promo - à clarifier)
- **DEP-006**: Spec 012 - B2B Features (codes promo spécifiques entreprises)
- **DEP-007**: Email Marketing System (envoi de campagnes avec codes personnalisés)

## Implementation Status

### ✅ Phase 1: Backend (COMPLETE)

- [x] **Migration SQL**: `20250107130000_add_promo_codes_system.sql`
- [x] **Tables créées**: `promo_codes`, `promo_code_usage`
- [x] **Table étendue**: `appointment_bookings` (+3 colonnes)
- [x] **Fonction de validation**: `validate_promo_code()` avec toute la logique métier
- [x] **Vues financières**: `contractor_financial_summary`, `contractor_transaction_details` (mises à jour)
- [x] **Triggers**: `trg_promo_usage_on_booking`, `trg_promo_usage_on_cancel`
- [x] **Données de test**: 3 codes promo (BIENVENUE20, SIMONE10, NOEL2024)
- [x] **Tests de validation**: Tous scénarios testés avec succès
- [x] **Documentation technique**: [PROMO_CODES_SYSTEM.md](../../docs/PROMO_CODES_SYSTEM.md)
- [x] **Spécifications complètes**: [PROMO_CODES_SPECIFICATIONS.md](../../docs/PROMO_CODES_SPECIFICATIONS.md)
- [x] **Résumé exécutif**: [PROMO_CODES_COMPLETE.md](../../docs/PROMO_CODES_COMPLETE.md)

### 🚧 Phase 2: Frontend (TODO)

**Estimation**: 29-39 heures sur 4 sprints

#### Sprint 1 (1 semaine) - Checkout Client
- [ ] **FR-008, FR-009**: Champ de saisie code promo avec validation temps réel
- [ ] **FR-011**: Affichage prix original barré vs prix réduit
- [ ] **FR-012**: Bouton "Retirer le code promo"
- [ ] **FR-013**: Messages d'erreur explicites
- [ ] **FR-032**: Email confirmation client avec infos promo
- **Temps estimé**: 6 heures

#### Sprint 2 (1 semaine) - Dashboard Admin (Gestion)
- [ ] **FR-001**: Formulaire création code promo
- [ ] **FR-002**: Validation unicité code
- [ ] **FR-003**: Toggle actif/inactif
- [ ] **FR-004**: Liste paginée avec filtres
- [ ] **FR-005**: Édition code promo
- [ ] **FR-006**: Duplication code promo
- [ ] **FR-007**: Protection suppression
- **Temps estimé**: 16 heures

#### Sprint 3 (1 semaine) - Dashboard Admin (Analytics) + Prestataire
- [ ] **FR-023**: Page analytics avec KPIs
- [ ] **FR-024**: Tableau "Top codes" triable
- [ ] **FR-025**: Export CSV
- [ ] **FR-026**: Détails code avec graphiques
- [ ] **User Story 3**: Dashboard prestataire avec transparence
- [ ] **FR-033**: Email prestataire avec info-bulle
- **Temps estimé**: 12 heures

#### Sprint 4 (3 jours) - Edge Functions + Sécurité
- [ ] **FR-021**: Mise à jour `create-payment-intent` (Stripe metadata)
- [ ] **FR-027, FR-028, FR-029, FR-030**: Rate limiting, captcha, blocage, alerts
- [ ] **FR-031**: Sanitization inputs
- [ ] **Nouvelle fonction**: `regularize-promo-commission` (audit)
- [ ] **Tests E2E**: Tous scénarios utilisateur
- **Temps estimé**: 8 heures

## Documentation References

- **Technical Guide**: [docs/PROMO_CODES_SYSTEM.md](../../docs/PROMO_CODES_SYSTEM.md) - Guide technique complet avec modèle financier, schéma DB, fonctions SQL, vues, flow, tests, intégration frontend
- **Complete Specifications**: [docs/PROMO_CODES_SPECIFICATIONS.md](../../docs/PROMO_CODES_SPECIFICATIONS.md) - Spécifications exhaustives (12 sections) : règles métier, user stories, architecture, impacts, UI mockups, scénarios, erreurs, analytics, sécurité, évolutions futures
- **Executive Summary**: [docs/PROMO_CODES_COMPLETE.md](../../docs/PROMO_CODES_COMPLETE.md) - Résumé exécutif avec checklist, roadmap Phase 2, métriques succès, quick start développeurs
- **Migration SQL**: [supabase/migrations/20250107130000_add_promo_codes_system.sql](../../supabase/migrations/20250107130000_add_promo_codes_system.sql) - Migration complète (tables, fonctions, vues, triggers, seed data)
- **Main Specifications**: [docs/specifications-simone-fusionnees.md](../../docs/specifications-simone-fusionnees.md) - Spécifications principales du produit (section 4.3, 10.1)
- **Project Constitution**: [.specify/constitution.md](../../.specify/constitution.md) - Principes du projet (ID strategy, naming, sécurité)

---

**Last Updated**: 2025-11-07
**Version**: 1.0
**Status**: ✅ Backend Production Ready | 🚧 Frontend Sprint Planning Required
