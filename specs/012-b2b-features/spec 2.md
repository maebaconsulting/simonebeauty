# Feature Specification: Fonctionnalités Entreprise B2B

**Feature Branch**: `012-b2b-features`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Fonctionnalités entreprise avec services dédiés, tarifs négociés, facturation mensuelle, codes promo entreprise et cartes cadeaux personnalisées"

## User Scenarios & Testing

### User Story 1 - Création Compte Entreprise et Tarifs Négociés (Priority: P1)

Une responsable RH d'une entreprise de 150 employés contacte Simone pour offrir des services bien-être à ses équipes. Un administrateur crée un compte entreprise B2B, négocie des tarifs (-15% sur tous les services) et les configure dans le système. L'entreprise peut désormais réserver des services à ces tarifs préférentiels.

**Why this priority**: Le compte entreprise avec tarification spécifique est le socle de toute l'offre B2B. Sans cela, impossible de différencier B2B et B2C. MVP absolu.

**Independent Test**: Peut être testé en créant un compte entreprise, configurant des tarifs réduits et vérifiant leur application lors de la réservation. Délivre la valeur : "Entreprises bénéficient de tarifs avantageux".

**Acceptance Scenarios**:

1. **Given** un administrateur créant un compte entreprise, **When** il configure un tarif réduit de -15%, **Then** tous les services affichent le prix réduit pour cette entreprise
2. **Given** un employé se connectant avec email entreprise (@company.com), **When** il réserve un service, **Then** le tarif entreprise s'applique automatiquement
3. **Given** plusieurs entreprises avec tarifs différents (-10%, -15%, -20%), **When** chaque employé réserve, **Then** son tarif spécifique est appliqué
4. **Given** un compte entreprise avec budget mensuel plafonné à 5000€, **When** le budget est atteint, **Then** les nouvelles réservations sont bloquées jusqu'au mois suivant

---

### User Story 2 - Facturation Mensuelle Groupée (Priority: P1)

Une entreprise a effectué 45 réservations dans le mois par différents employés. À la fin du mois, un administrateur génère une facture unique consolidant toutes les prestations, avec détail par employé, service et date. La facture est envoyée au service comptable de l'entreprise.

**Why this priority**: Facturation groupée est essentielle pour les entreprises qui ne veulent pas 45 paiements séparés. Critical pour adoption B2B.

**Independent Test**: Peut être testé en effectuant plusieurs réservations entreprise et générant la facture mensuelle consolidée. Délivre la valeur : "Entreprises reçoivent une facture unique simplifiée".

**Acceptance Scenarios**:

1. **Given** une entreprise avec 20 réservations en janvier, **When** la facture mensuelle est générée, **Then** elle liste toutes les prestations avec employé, service, date et prix
2. **Given** une facture mensuelle de 3500€, **When** elle est générée, **Then** le montant total, la TVA (20%) et le total TTC sont calculés automatiquement
3. **Given** une facture générée, **When** elle est envoyée, **Then** un PDF est créé et envoyé au contact comptable de l'entreprise
4. **Given** une entreprise avec paiement différé 30 jours, **When** la facture est créée, **Then** la date d'échéance est le dernier jour du mois suivant

---

### User Story 3 - Codes Promo Entreprise Dédiés (Priority: P2)

Une entreprise souhaite offrir un code promo "WELLBEING2025" à ses 200 employés donnant -20% supplémentaires sur tous les services pendant 3 mois. Un administrateur crée ce code réservé uniquement aux emails @company.com avec limite de 200 utilisations.

**Why this priority**: Permet des campagnes marketing ciblées pour les entreprises. Important mais pas critical pour MVP initial.

**Independent Test**: Peut être testé en créant un code promo B2B, l'appliquant lors d'une réservation entreprise et vérifiant la réduction. Délivre la valeur : "Entreprises peuvent lancer des campagnes promotionnelles ciblées".

**Acceptance Scenarios**:

1. **Given** un code promo entreprise créé, **When** un employé l'applique, **Then** la réduction s'ajoute au tarif entreprise déjà négocié (cumul des réductions)
2. **Given** un code limité à 50 utilisations, **When** la 50ème utilisation est faite, **Then** le code devient inactif pour de nouvelles utilisations
3. **Given** un code valable du 1er au 31 mars, **When** un employé tente de l'utiliser le 1er avril, **Then** le code est refusé avec message "Code expiré"
4. **Given** un code réservé aux emails @company.com, **When** un utilisateur externe tente de l'utiliser, **Then** le système refuse avec message "Code réservé aux employés Company"

---

### User Story 4 - Services Dédiés Entreprise (Priority: P2)

Une entreprise négocie l'accès à des services exclusifs non disponibles au grand public : "Massage assis en entreprise 15min" et "Séance de méditation de groupe". Ces services apparaissent uniquement pour les employés de cette entreprise.

**Why this priority**: Différenciateur fort pour l'offre B2B mais pas essentiel au lancement. Peut être ajouté progressivement.

**Independent Test**: Peut être testé en créant un service dédié entreprise et vérifiant qu'il n'apparaît que pour les utilisateurs autorisés. Délivre la valeur : "Entreprises ont accès à des services sur-mesure".

**Acceptance Scenarios**:

1. **Given** un service marqué "B2B Only" pour Company A, **When** un employé de Company A consulte le catalogue, **Then** ce service apparaît dans sa liste
2. **Given** un utilisateur B2C, **When** il consulte le catalogue, **Then** les services B2B n'apparaissent pas
3. **Given** un service "Massage en entreprise sur site", **When** configuré pour plusieurs entreprises, **Then** chacune peut réserver avec ses propres tarifs négociés
4. **Given** un service dédié avec prestataires spécifiques, **When** l'entreprise réserve, **Then** seuls les prestataires autorisés pour ce service apparaissent

---

### User Story 5 - Account Manager et Support Dédié (Priority: P3)

Une grande entreprise (500+ employés) dispose d'un account manager dédié. Les employés peuvent contacter directement cet account manager pour des demandes spécifiques, et celui-ci a accès à un dashboard B2B pour suivre l'utilisation et les budgets.

**Why this priority**: Service premium pour grandes entreprises. Nice-to-have qui peut être géré manuellement au début.

**Independent Test**: Peut être testé en assignant un account manager à une entreprise et vérifiant son accès au dashboard B2B. Délivre la valeur : "Grandes entreprises bénéficient d'un accompagnement personnalisé".

**Acceptance Scenarios**:

1. **Given** une entreprise avec account manager assigné, **When** un employé accède au support, **Then** les coordonnées de l'account manager sont affichées en priorité
2. **Given** un account manager connecté, **When** il accède au dashboard, **Then** il voit l'utilisation mensuelle, le budget consommé et la liste des employés actifs
3. **Given** un account manager consultant les stats, **When** il exporte un rapport, **Then** un CSV contient toutes les réservations du mois avec détails
4. **Given** une entreprise approchant de son budget mensuel, **When** 90% est consommé, **Then** l'account manager reçoit une alerte automatique

---

### Edge Cases

- **Employé quittant l'entreprise**: Si un employé change d'entreprise, comment gérer ses réservations futures avec ancien tarif ? Annulation ou maintien ?
- **Fusion d'entreprises**: Deux entreprises avec tarifs différents fusionnent. Comment unifier leurs comptes et conditions ?
- **Facturation multi-devises**: Une entreprise internationale avec employés en France et UK. Facturation en EUR ou GBP ?
- **Budget partagé inter-départements**: Une entreprise veut segmenter le budget par département (RH, IT, Sales). Sous-comptes nécessaires ?
- **Utilisation personnelle vs professionnelle**: Un employé peut-il utiliser son compte entreprise pour usage personnel en payant plein tarif ?
- **Codes promo cumulables**: Un employé a un code promo entreprise ET un code personnel. Peut-il cumuler les deux ?
- **Facturation rétroactive**: Une réservation de décembre est modifiée en janvier. Sur quelle facture apparaît-elle ?
- **Tarifs différenciés par service**: Une entreprise négocie -20% sur massages mais -10% sur soins visage. Granularité nécessaire.

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre la création de comptes entreprise B2B distincts des comptes B2C
- **FR-002**: Le système DOIT permettre de configurer des tarifs négociés par entreprise (pourcentage de réduction ou prix fixes)
- **FR-003**: Le système DOIT appliquer automatiquement les tarifs entreprise aux employés identifiés (via domaine email)
- **FR-004**: Le système DOIT permettre de définir un budget mensuel maximum par entreprise
- **FR-005**: Le système DOIT bloquer les réservations lorsque le budget mensuel est épuisé
- **FR-006**: Le système DOIT regrouper toutes les réservations d'une entreprise sur une facture mensuelle unique
- **FR-007**: Le système DOIT générer automatiquement une facture PDF en fin de mois avec détails des prestations
- **FR-008**: Le système DOIT calculer automatiquement TVA et totaux sur les factures
- **FR-009**: Le système DOIT permettre de configurer des conditions de paiement différé (30, 60 ou 90 jours)
- **FR-010**: Le système DOIT envoyer la facture au contact comptable de l'entreprise par email
- **FR-011**: Le système DOIT permettre de créer des codes promo réservés à une entreprise spécifique
- **FR-012**: Le système DOIT permettre de cumuler code promo entreprise et tarif négocié (ou définir la priorité)
- **FR-013**: Le système DOIT limiter les codes promo par nombre d'utilisations ou durée de validité
- **FR-014**: Le système DOIT restreindre les codes promo par domaine email (@company.com)
- **FR-015**: Le système DOIT permettre de créer des services visibles uniquement pour certaines entreprises
- **FR-016**: Le système DOIT permettre d'assigner des prestataires dédiés à des services B2B spécifiques
- **FR-017**: Le système DOIT afficher les services B2B uniquement aux utilisateurs autorisés
- **FR-018**: Le système DOIT permettre d'assigner un account manager à une entreprise
- **FR-019**: Le système DOIT fournir un dashboard B2B pour l'account manager (utilisation, budget, employés)
- **FR-020**: Le système DOIT permettre à l'account manager d'exporter des rapports d'utilisation
- **FR-021**: Le système DOIT envoyer des alertes lorsque 90% du budget mensuel est consommé
- **FR-022**: Le système DOIT permettre de consulter l'historique des factures entreprise
- **FR-023**: Le système DOIT supporter plusieurs contacts par entreprise (RH, comptable, account manager)
- **FR-024**: Le système DOIT permettre la gestion de cartes cadeaux B2B avec validité 12 mois (voir spec 011)
- **FR-025**: Le système DOIT permettre de configurer des règles de tarification différenciées par service

### Key Entities

- **Corporate Account (corporate_accounts)**: Compte entreprise (nom, SIRET, domaine email, tarifs négociés, budget mensuel, conditions paiement, contacts)
- **Corporate Pricing (corporate_pricing)**: Tarifs spécifiques par entreprise et service (company_id, service_id, réduction %, prix fixe, validité)
- **Corporate Invoice (corporate_invoices)**: Facture mensuelle (company_id, mois/année, montant HT, TVA, total TTC, statut payé/impayé, date échéance)
- **Corporate Invoice Line (corporate_invoice_lines)**: Ligne de facture (invoice_id, booking_id, employé, service, date, prix)
- **Corporate Promo Code (corporate_promo_codes)**: Code promo entreprise (code, company_id, réduction, utilisations max, validité, domaine email autorisé)
- **Corporate Service**: Service dédié B2B (service_id, companies autorisées, prestataires assignés, tarif spécifique)
- **Account Manager Assignment**: Association account manager - entreprise (manager_user_id, company_id, date début)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Au moins 10 entreprises (20+ employés chacune) utilisent la plateforme dans les 6 mois suivant le lancement B2B
- **SC-002**: Le revenu B2B représente 30% du chiffre d'affaires total après 1 an
- **SC-003**: Le taux de rétention des comptes entreprise atteint 85% après 12 mois
- **SC-004**: Les entreprises B2B ont un panier moyen 3x supérieur aux clients B2C
- **SC-005**: Le temps de génération d'une facture mensuelle est inférieur à 5 minutes
- **SC-006**: 95% des factures sont payées dans les délais convenus
- **SC-007**: Les account managers gèrent en moyenne 5-8 entreprises chacun
- **SC-008**: Le taux d'utilisation des codes promo entreprise atteint 60% des employés éligibles
- **SC-009**: Les services dédiés B2B représentent 40% des réservations entreprise
- **SC-010**: Le taux de satisfaction des account managers (NPS) dépasse 70

## Assumptions

- Les entreprises préfèrent la facturation mensuelle groupée aux paiements individuels
- Les tarifs négociés restent fixes pendant au moins 12 mois (renégociation annuelle)
- Les budgets mensuels sont suffisants pour couvrir l'utilisation moyenne des employés
- L'authentification par domaine email (@company.com) est fiable pour identifier les employés
- Les account managers peuvent gérer 5-8 entreprises sans surcharge de travail
- Les conditions de paiement différé (30-90 jours) sont acceptables pour le cash flow

## Dependencies

- Système d'authentification pour identifier les utilisateurs entreprise - dépendance spec 001
- Système de réservation pour appliquer les tarifs spéciaux - dépendance spec 003
- Stripe pour la gestion des paiements différés et factures - dépendance spec 004
- Système de cartes cadeaux B2B avec validité 12 mois - dépendance spec 011
- Service email pour envoi des factures - dépendance spec 001

## Out of Scope

- Intégration avec systèmes ERP/comptabilité externes (SAP, Oracle)
- Plateforme de self-service complète pour les RH (gestion autonome des employés)
- Système de validation hiérarchique (manager approuve les réservations)
- Budgets individuels par employé (uniquement budget global entreprise)
- Analytics avancées avec prédictions d'utilisation
- Système de gamification pour encourager l'utilisation (badges, challenges)
- Application mobile dédiée B2B
- Contrats numériques et signature électronique
- Support multi-entités juridiques pour groupes internationaux
