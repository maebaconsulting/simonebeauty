# Feature Specification: Système de Cartes Cadeaux

**Feature Branch**: `011-gift-cards`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Cartes cadeaux avec achat en ligne, codes uniques, solde consultable, utilisation partielle et validité configurable (12 ou 24 mois)"

## User Scenarios & Testing

### User Story 1 - Achat de Carte Cadeau (Priority: P1)

Un client souhaite offrir un massage à sa mère pour son anniversaire. Il accède à la page "Cartes Cadeaux", sélectionne un montant (50€, 100€ ou montant personnalisé), renseigne l'email du bénéficiaire, ajoute un message personnalisé et procède au paiement. Un code unique est généré et envoyé par email au bénéficiaire.

**Why this priority**: L'achat est le point d'entrée obligatoire du système de cartes cadeaux. Sans cette fonctionnalité, aucune carte ne peut être créée. MVP absolu.

**Independent Test**: Peut être testé en achetant une carte cadeau, effectuant le paiement et vérifiant la génération du code unique et l'envoi de l'email. Délivre la valeur : "Client peut offrir des services en cadeau".

**Acceptance Scenarios**:

1. **Given** un client sur la page Cartes Cadeaux, **When** il sélectionne un montant prédéfini (50€, 100€, 150€), **Then** ce montant est affiché dans le panier
2. **Given** un client choisissant "Montant personnalisé", **When** il saisit 75€, **Then** le système accepte tout montant entre 25€ et 500€
3. **Given** un client complétant le formulaire (email bénéficiaire, message optionnel), **When** il valide le paiement, **Then** un code unique à 16 caractères est généré
4. **Given** une carte cadeau payée, **When** la transaction est confirmée, **Then** un email est envoyé au bénéficiaire avec le code, le montant et le message personnalisé

---

### User Story 2 - Consultation du Solde (Priority: P1)

Un bénéficiaire reçoit un code de carte cadeau par email. Il accède à la page de vérification, saisit son code et consulte le solde disponible (100€), la date d'expiration et l'historique d'utilisation.

**Why this priority**: Sans consultation du solde, les utilisateurs ne peuvent pas savoir combien ils peuvent dépenser. Essentiel pour l'utilisation.

**Independent Test**: Peut être testé en saisissant un code de carte cadeau et vérifiant l'affichage du solde, de la validité et de l'historique. Délivre la valeur : "Bénéficiaire connaît le montant disponible".

**Acceptance Scenarios**:

1. **Given** un bénéficiaire avec un code carte cadeau, **When** il saisit le code sur la page de vérification, **Then** le solde actuel, le montant initial et la date d'expiration s'affichent
2. **Given** une carte partiellement utilisée (100€ initial, 30€ utilisés), **When** le solde est consulté, **Then** il affiche "70€ restants sur 100€"
3. **Given** une carte avec historique d'utilisation, **When** le détail est affiché, **Then** chaque utilisation apparaît avec date, montant déduit et service réservé
4. **Given** une carte expirée, **When** le code est vérifié, **Then** un message "Carte expirée le [DATE]" s'affiche et le solde n'est plus utilisable

---

### User Story 3 - Utilisation Lors de la Réservation (Priority: P1)

Un client réserve un massage de 80€. Au moment du paiement, il saisit son code carte cadeau de 100€. Le système déduit 80€ de la carte et il n'a rien à payer. Les 20€ restants sont conservés sur la carte pour une utilisation future.

**Why this priority**: C'est l'objectif final de la carte cadeau : payer un service. Sans cela, les cartes sont inutiles. Critical MVP.

**Independent Test**: Peut être testé en appliquant un code carte cadeau lors du checkout et vérifiant la déduction du montant. Délivre la valeur : "Bénéficiaire peut utiliser sa carte pour réserver".

**Acceptance Scenarios**:

1. **Given** un client au paiement avec panier de 60€, **When** il applique une carte de 100€, **Then** le montant à payer passe à 0€ et la carte conserve 40€ de solde
2. **Given** un client avec panier de 120€ et carte de 50€, **When** il applique la carte, **Then** 50€ sont déduits et il paye les 70€ restants par carte bancaire
3. **Given** un client avec plusieurs cartes cadeaux, **When** il en applique une, **Then** il peut appliquer d'autres cartes jusqu'à couvrir le montant total
4. **Given** un code invalide ou déjà entièrement utilisé, **When** le client tente de l'appliquer, **Then** un message d'erreur clair explique le problème

---

### User Story 4 - Validité Différenciée B2B vs B2C (Priority: P2)

Un administrateur configure les validités des cartes : 24 mois pour les cartes B2C (grand public) et 12 mois pour les cartes B2B (entreprises). Chaque carte respecte sa durée de validité selon son type lors de sa création.

**Why this priority**: Différenciation importante pour les règles business mais pas critique pour le MVP initial. Peut démarrer avec une seule durée puis ajouter la distinction.

**Independent Test**: Peut être testé en créant des cartes B2C et B2B et vérifiant que leurs dates d'expiration correspondent aux règles configurées. Délivre la valeur : "Plateforme gère différents types de cartes avec règles spécifiques".

**Acceptance Scenarios**:

1. **Given** un achat de carte B2C (grand public) le 1er janvier 2025, **When** la carte est créée, **Then** sa date d'expiration est le 1er janvier 2027 (24 mois)
2. **Given** un achat de carte B2B (entreprise) le 1er janvier 2025, **When** la carte est créée, **Then** sa date d'expiration est le 1er janvier 2026 (12 mois)
3. **Given** un administrateur modifiant la durée de validité B2C à 18 mois, **When** une nouvelle carte B2C est créée, **Then** elle expire dans 18 mois (les anciennes cartes conservent leurs 24 mois)
4. **Given** une carte approchant de l'expiration (30 jours restants), **When** le bénéficiaire consulte le solde, **Then** un avertissement "Expire dans 30 jours" est affiché

---

### User Story 5 - Cartes Cadeaux Entreprise en Masse (Priority: P3)

Un responsable RH d'une entreprise souhaite acheter 50 cartes cadeaux de 100€ chacune pour ses employés. Il accède à l'interface B2B, commande 50 cartes, effectue un paiement unique de 5000€ et reçoit un fichier CSV avec les 50 codes uniques à distribuer.

**Why this priority**: Important pour le segment B2B mais pas essentiel pour le lancement. Peut être géré manuellement au début puis automatisé.

**Independent Test**: Peut être testé en passant une commande groupée et vérifiant la génération de multiples codes et l'export CSV. Délivre la valeur : "Entreprises peuvent offrir des cartes à leurs employés facilement".

**Acceptance Scenarios**:

1. **Given** un compte entreprise B2B, **When** il accède à la commande groupée, **Then** il peut spécifier le montant unitaire et la quantité de cartes
2. **Given** une commande de 50 cartes de 100€, **When** le paiement est validé, **Then** 50 codes uniques sont générés instantanément
3. **Given** une commande groupée traitée, **When** l'entreprise télécharge les codes, **Then** un fichier CSV contient code, montant, date d'expiration pour chaque carte
4. **Given** une commande groupée avec logo personnalisé, **When** les emails sont envoyés, **Then** chaque email inclut le logo de l'entreprise et un message personnalisé

---

### Edge Cases

- **Carte perdue ou volée**: Un bénéficiaire perd son code. Peut-il le récupérer ? Système de récupération par email ou blocage et réémission ?
- **Double utilisation simultanée**: Deux personnes tentent d'utiliser le même code au même moment. Le système doit verrouiller la carte pendant la transaction.
- **Remboursement de carte non utilisée**: Un client demande le remboursement d'une carte jamais utilisée. Politique de remboursement à définir.
- **Code facilement devinable**: Si les codes suivent un pattern prévisible, risque de fraude. Génération cryptographiquement sécurisée nécessaire.
- **Extension de validité**: Un bénéficiaire demande une extension car sa carte expire dans 2 jours. Processus manuel ou automatique ?
- **Carte cadeau sur service en promotion**: Si un service est à -20%, la carte cadeau s'applique sur le prix réduit ou le prix original ?
- **Fractionnement pour plusieurs réservations**: Un utilisateur avec carte de 150€ peut-il l'utiliser sur 3 réservations de 50€ chacune ? Oui, avec utilisation partielle.
- **Transfert de carte**: Un bénéficiaire peut-il transférer sa carte à quelqu'un d'autre ? À décider selon la politique commerciale.

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre l'achat de cartes cadeaux avec montants prédéfinis (50€, 100€, 150€) ou personnalisés (25€ à 500€)
- **FR-002**: Le système DOIT générer un code unique à 16 caractères alphanumériques pour chaque carte achetée
- **FR-003**: Le système DOIT garantir que chaque code généré est cryptographiquement unique et non-devinable
- **FR-004**: Le système DOIT traiter le paiement de la carte cadeau via Stripe comme une transaction normale
- **FR-005**: Le système DOIT envoyer un email au bénéficiaire avec le code, le montant, le message personnalisé et les instructions d'utilisation
- **FR-006**: Le système DOIT permettre de consulter le solde d'une carte en saisissant le code
- **FR-007**: Le système DOIT afficher le montant initial, le solde actuel et la date d'expiration lors de la consultation
- **FR-008**: Le système DOIT afficher l'historique complet des utilisations (date, montant, service)
- **FR-009**: Le système DOIT permettre l'utilisation partielle d'une carte (déduction du montant utilisé, conservation du solde)
- **FR-010**: Le système DOIT permettre d'appliquer une carte cadeau lors du checkout de réservation
- **FR-011**: Le système DOIT déduire automatiquement le montant de la carte du total à payer
- **FR-012**: Le système DOIT permettre de combiner plusieurs cartes cadeaux sur une même réservation
- **FR-013**: Le système DOIT permettre de combiner carte cadeau et paiement par carte bancaire si le solde est insuffisant
- **FR-014**: Le système DOIT appliquer une validité de 24 mois pour les cartes B2C (grand public)
- **FR-015**: Le système DOIT appliquer une validité de 12 mois pour les cartes B2B (entreprises)
- **FR-016**: Le système DOIT bloquer l'utilisation d'une carte après sa date d'expiration
- **FR-017**: Le système DOIT permettre aux administrateurs de configurer les durées de validité par type de carte
- **FR-018**: Le système DOIT permettre aux comptes entreprise de commander des cartes en masse (jusqu'à 500 cartes)
- **FR-019**: Le système DOIT générer un fichier CSV avec tous les codes pour les commandes groupées
- **FR-020**: Le système DOIT permettre la personnalisation du message et du logo pour les cartes entreprise
- **FR-021**: Le système DOIT enregistrer chaque transaction utilisant une carte (audit trail complet)
- **FR-022**: Le système DOIT verrouiller temporairement une carte pendant une transaction en cours
- **FR-023**: Le système DOIT afficher un avertissement 30 jours avant l'expiration lors de la consultation du solde
- **FR-024**: Le système DOIT permettre aux administrateurs de révoquer ou désactiver une carte (en cas de fraude)
- **FR-025**: Le système DOIT permettre aux administrateurs de consulter toutes les cartes avec filtres (actives, expirées, utilisées, etc.)

### Key Entities

- **Gift Card (gift_cards)**: Représente une carte cadeau (code unique, montant initial, solde actuel, type B2B/B2C, date de création, date d'expiration, statut actif/expiré/révoqué)
- **Gift Card Transaction (gift_card_transactions)**: Historique d'utilisation (card_id, booking_id, montant déduit, solde restant après transaction, timestamp)
- **Gift Card Purchase (gift_card_purchases)**: Achat de carte (acheteur, bénéficiaire email, montant, message personnalisé, payment_intent Stripe, type B2C/B2B)
- **Bulk Gift Card Order (bulk_gift_card_orders)**: Commande groupée entreprise (company_id, quantité, montant unitaire, statut, CSV généré, logo personnalisé)
- **Gift Card Config**: Configuration des validités (type B2C: 24 mois, type B2B: 12 mois, modifiable par admin)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Les cartes cadeaux représentent au moins 10% du chiffre d'affaires total dans les 6 mois suivant le lancement
- **SC-002**: Le taux d'utilisation des cartes cadeaux atteint 70% avant expiration
- **SC-003**: Le temps moyen de génération et envoi d'une carte cadeau est inférieur à 30 secondes
- **SC-004**: 95% des bénéficiaires utilisent leur carte dans les 90 premiers jours
- **SC-005**: Le taux d'erreur lors de l'application d'un code est inférieur à 2%
- **SC-006**: Les entreprises B2B commandent en moyenne 25 cartes par commande groupée
- **SC-007**: Moins de 1% des cartes sont révoquées pour fraude ou abus
- **SC-008**: Le montant moyen d'une carte cadeau B2C est de 75€
- **SC-009**: Le montant moyen d'une carte cadeau B2B est de 100€
- **SC-010**: 30% des utilisateurs ayant une carte avec solde résiduel effectuent une nouvelle réservation dans les 60 jours

## Assumptions

- Les clients comprennent que les cartes cadeaux ont une date d'expiration
- La majorité des cartes seront utilisées sur une seule réservation (usage partiel sera minoritaire)
- Les entreprises préfèrent recevoir un CSV plutôt que des emails individuels pour les commandes groupées
- Le taux de perte ou oubli de code sera faible (<5%)
- Les bénéficiaires consulteront le solde avant de réserver pour connaître le montant disponible
- Les différences de validité B2C (24 mois) vs B2B (12 mois) sont acceptables pour les clients

## Dependencies

- Stripe pour le traitement des paiements d'achat de cartes - dépendance spec 004
- Service email (Resend) pour envoyer les codes aux bénéficiaires - dépendance spec 001
- Système de réservation pour l'application des cartes au checkout - dépendance spec 003
- Base de données transactionnelle pour garantir l'atomicité des déductions de solde

## Out of Scope

- Cartes cadeaux physiques (impression et envoi postal)
- Cartes cadeaux pour des services spécifiques (uniquement montant en euros)
- Système de cashback ou points de fidélité
- Marketplace de revente de cartes cadeaux non utilisées
- API publique pour partenaires externes vendant des cartes Simone
- Cartes cadeaux récurrentes (abonnement mensuel)
- Personnalisation visuelle des emails de carte cadeau (design unique)
- Extension automatique de validité pour cartes proches de l'expiration
- Système d'alerte proactive par email avant expiration
