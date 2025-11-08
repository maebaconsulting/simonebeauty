# Feature Specification: Système de Paiement Stripe Complet

**Feature Branch**: `004-stripe-payment`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Système de paiement Stripe complet avec pré-autorisation, capture différée après confirmation, gestion automatique des commissions, Stripe Connect pour prestataires, et remboursements automatisés selon politique d'annulation"

## User Scenarios & Testing

### User Story 1 - Pré-autorisation au Moment de la Réservation (Priority: P1)

Un client finalise sa réservation en saisissant ses informations de carte bancaire. Le système crée une pré-autorisation Stripe (PaymentIntent avec `capture_method: manual`) qui bloque le montant sur la carte sans le débiter immédiatement. Cela garantit que les fonds sont disponibles tout en protégeant le client contre un débit prématuré.

**Why this priority**: Cœur du système de paiement. Sans pré-autorisation, impossible de garantir les fonds tout en respectant le principe de ne jamais débiter avant confirmation du service. MVP absolu.

**Independent Test**: Peut être testé en complétant une réservation avec une carte de test Stripe et vérifiant qu'un PaymentIntent en statut "requires_capture" est créé. Délivre la valeur : "Fonds réservés sans débit immédiat".

**Acceptance Scenarios**:

1. **Given** un client au paiement avec un panier de 80€, **When** il valide sa carte bancaire, **Then** un PaymentIntent Stripe de 80€ est créé avec `capture_method: manual` et statut `requires_capture`
2. **Given** un client avec carte bancaire valide mais solde insuffisant, **When** il tente le paiement, **Then** la pré-autorisation échoue et un message clair s'affiche
3. **Given** un client ayant réussi la pré-autorisation, **When** il consulte ses réservations, **Then** sa réservation apparaît en statut "En attente de confirmation prestataire"
4. **Given** un client avec carte bancaire expirée, **When** il tente le paiement, **Then** l'erreur est détectée en temps réel avant soumission au serveur

---

### User Story 2 - Capture Manuelle et Automatique avec Workflow Flexible (Priority: P1)

Le prestataire clique sur "Terminé" après avoir fourni le service, ce qui change le statut de la réservation en "completed_by_contractor". Le client peut alors déclencher manuellement la capture du paiement, ou le backoffice peut forcer la capture, ou le système déclenche automatiquement la capture 30 minutes après l'heure de fin prévue du service. Toutes les actions sont loggées pour traçabilité complète.

**Why this priority**: Finalise le cycle de paiement avec flexibilité maximale. Permet au client de contrôler le moment du débit, tout en garantissant la capture automatique pour éviter les oublis. Essentiel au modèle économique et à la confiance client.

**Independent Test**: Peut être testé en complétant un service, cliquant "Terminé" côté prestataire, puis déclenchant la capture manuellement ou attendant la capture auto. Délivre la valeur : "Client débité uniquement après service fourni, avec contrôle et garantie automatique".

**Acceptance Scenarios**:

1. **Given** une réservation confirmée avec pré-autorisation de 80€, **When** l'heure de début est passée, **Then** le statut passe automatiquement à "in_progress"
2. **Given** une réservation in_progress, **When** le prestataire clique sur "Terminé", **Then** le statut passe à "completed_by_contractor" et une entrée est ajoutée dans service_action_logs (action_type: completed_by_contractor)
3. **Given** une réservation completed_by_contractor, **When** le client clique sur "Confirmer paiement", **Then** le PaymentIntent est capturé immédiatement, le statut passe à "captured", et une entrée est loggée (action_type: capture_manual, performed_by_type: client)
4. **Given** une réservation in_progress ou completed_by_contractor, **When** un admin backoffice clique sur "Capturer paiement", **Then** la capture est déclenchée immédiatement et loggée (performed_by_type: admin)
5. **Given** une réservation completed_by_contractor non capturée, **When** 30 minutes se sont écoulées après heure_fin, **Then** un job automatique déclenche la capture et loge l'action (action_type: capture_auto, performed_by_type: system)
6. **Given** une réservation dont la capture a été tentée, **When** la capture échoue, **Then** le système retente 3 fois avec délai exponentiel, loge chaque tentative, et alerte le support si échec définitif
7. **Given** un client tentant de capturer avant heure_debut, **When** il clique sur "Confirmer paiement", **Then** le système affiche un message d'erreur "Paiement capturable uniquement après le début du service"
8. **Given** un prestataire qui ne clique jamais sur "Terminé", **When** 30 minutes après heure_fin sont écoulées, **Then** la capture auto se déclenche quand même pour garantir le paiement

---

### User Story 3 - Calcul et Transfert des Commissions via Stripe Connect (Priority: P2)

Après capture réussie du paiement, le système calcule automatiquement la commission plateforme (15% par défaut) et transfère le montant net au compte Stripe Connect du prestataire, moins les frais Stripe.

**Why this priority**: Automatise la distribution des revenus et garantit la transparence financière. Pas MVP strict mais essentiel pour le lancement commercial.

**Independent Test**: Peut être testé en complétant une réservation payée et vérifiant que le prestataire reçoit 85% du montant (après commission) sur son compte Connect. Délivre la valeur : "Prestataire payé automatiquement".

**Acceptance Scenarios**:

1. **Given** un paiement capturé de 100€, **When** le calcul de commission s'effectue, **Then** 15€ sont retenus par la plateforme et 85€ sont transférés au prestataire (avant frais Stripe)
2. **Given** un prestataire avec taux de commission négocié à 10%, **When** le paiement est capturé, **Then** le système applique le taux personnalisé de 10%
3. **Given** un prestataire sans compte Stripe Connect configuré, **When** une capture réussit, **Then** le système met le transfert en attente et notifie le prestataire de configurer son compte
4. **Given** un service avec commission différente (20% pour service premium), **When** le paiement est capturé, **Then** la commission spécifique du service est appliquée

---

### User Story 4 - Remboursement Automatisé selon Politique d'Annulation Configurable (Priority: P2)

Un client annule sa réservation prévue lundi à 10h le dimanche à 17h30. Le système consulte la configuration de la plateforme (`platform_config.cancellation_rules`), calcule automatiquement le montant du remboursement selon les règles actives (deadline J-1 à 18h → 100% si avant, 0% si après), et émet un remboursement Stripe si applicable. Le client peut demander une exception médicale avec justificatif si l'annulation est tardive.

**Why this priority**: Protège à la fois clients et prestataires. Réduit drastiquement la charge du support. Les règles configurables permettent d'ajuster la politique sans redéploiement. Important mais pas critique pour MVP initial.

**Independent Test**: Peut être testé en créant puis annulant une réservation à différents moments et vérifiant les montants remboursés selon la config. Délivre la valeur : "Remboursements équitables et automatiques avec flexibilité business".

**Acceptance Scenarios**:

1. **Given** une réservation lundi 10h annulée dimanche 17h (avant deadline 18h) avec règles time_based actives, **When** l'annulation est confirmée, **Then** un remboursement de 100% est automatiquement émis vers la carte du client
2. **Given** une réservation lundi 10h annulée dimanche 19h (après deadline 18h), **When** l'annulation est confirmée, **Then** 0% est remboursé (100% facturé) et le client peut demander exception médicale
3. **Given** une réservation créée et annulée le même jour (same-day booking), **When** l'annulation est confirmée, **Then** 0% est remboursé selon la règle same_day_refund_percent
4. **Given** un client demandant exception médicale après deadline, **When** il soumet motif + justificatif optionnel, **Then** une entrée est créée dans cancellation_requests (statut: pending), une tâche backoffice est générée, et le client reçoit confirmation de traitement sous 48h
5. **Given** un admin validant une exception médicale, **When** il approuve la demande, **Then** un remboursement de 100% est émis et le client est notifié
6. **Given** aucune règle time_based active dans platform_config, **When** une annulation est demandée, **Then** le système applique les règles fallback (48h avant → 100%, sinon 0%)
7. **Given** un remboursement de 50€ émis, **When** le refund Stripe est créé, **Then** le client reçoit le montant sous 5-10 jours ouvrés et un email de confirmation avec détail du pourcentage appliqué

---

### User Story 5 - Gestion des Cartes Enregistrées (Priority: P3)

Un client régulier souhaite enregistrer sa carte bancaire pour payer en 1-clic lors de ses prochaines réservations, sans ressaisir ses informations à chaque fois.

**Why this priority**: Réduit la friction lors des réservations récurrentes et améliore la conversion. Nice-to-have pour MVP.

**Independent Test**: Peut être testé en enregistrant une carte lors d'un paiement et la réutilisant pour une nouvelle réservation. Délivre la valeur : "Paiement plus rapide pour clients fidèles".

**Acceptance Scenarios**:

1. **Given** un client au moment du paiement, **When** il coche "Enregistrer cette carte", **Then** la carte est tokenisée et sauvegardée via Stripe Customer avec SetupIntent
2. **Given** un client avec 2 cartes enregistrées, **When** il accède au paiement, **Then** ses cartes apparaissent avec masquage (•••• 4242) et possibilité de sélection
3. **Given** un client sélectionnant une carte enregistrée, **When** il confirme le paiement, **Then** la pré-autorisation est créée sans ressaisie du CVV (si configuré)
4. **Given** un client voulant supprimer une carte enregistrée, **When** il accède à son profil, **Then** il peut retirer la carte qui sera supprimée de Stripe

---

### User Story 6 - Pourboire (Tip) au Prestataire (Priority: P2)

Un client satisfait du service souhaite donner un pourboire au prestataire après la prestation. Il accède au détail de sa réservation terminée, sélectionne un montant parmi les suggestions configurées dans la plateforme (ex: 5€, 10€, 15€, 20€), et confirme. Le système crée un PaymentIntent séparé, le pourboire est transféré à 100% au prestataire (après déduction des frais Stripe), et aucune commission plateforme n'est appliquée sur le tip.

**Why this priority**: Augmente la satisfaction et la rémunération des prestataires. Encourage l'excellence du service. Important pour la fidélisation mais pas MVP strict.

**Independent Test**: Peut être testé en complétant un service et ajoutant un tip, puis vérifiant que le prestataire reçoit 100% du montant net. Délivre la valeur : "Prestataires récompensés directement pour qualité".

**Acceptance Scenarios**:

1. **Given** un client consultant une réservation captured, **When** il accède à la section "Pourboire", **Then** il voit des boutons avec montants suggérés configurés dans platform_config.tip_suggested_amounts (ex: 5€, 10€, 15€, 20€)
2. **Given** un client sélectionnant un tip de 10€, **When** il confirme, **Then** le système calcule les frais Stripe (~0.29€), affiche le total (10€ dont 0.29€ frais), et crée un PaymentIntent séparé
3. **Given** un PaymentIntent de tip créé, **When** le paiement réussit, **Then** une entrée est créée dans la table tips (amount: 10.00, stripe_fee: 0.29, total_charged: 10.29, status: succeeded)
4. **Given** un tip de 10€ capturé avec succès, **When** le transfert Stripe Connect s'effectue, **Then** le prestataire reçoit 10.00€ - 0.29€ = 9.71€ (100% du montant net, 0% de commission plateforme)
5. **Given** un client ayant déjà donné un tip, **When** il consulte l'historique de la réservation, **Then** le montant du tip est affiché séparément du montant du service
6. **Given** un prestataire consultant son dashboard financier, **When** il voit ses revenus, **Then** les tips reçus sont affichés séparément : "Revenus services: 1,200€ + Tips reçus: 45€ = Total: 1,245€"
7. **Given** une configuration platform_config.tip_time_limit_days = 30, **When** un client tente de tipper 31 jours après le service, **Then** le système affiche "Délai dépassé pour donner un pourboire (limite: 30 jours)"
8. **Given** une configuration platform_config.tip_enabled = false, **When** un client accède au détail d'une réservation, **Then** la section pourboire n'est pas affichée
9. **Given** un tip en cours de paiement, **When** le paiement échoue, **Then** le statut du tip passe à "failed", une entrée est loggée dans service_action_logs, et le client est notifié

---

### User Story 7 - Webhooks Stripe pour Synchronisation d'État (Priority: P1)

Le système écoute les webhooks Stripe pour synchroniser automatiquement l'état des paiements, captures, remboursements et litiges. Cela garantit que l'état dans la base de données reflète toujours la réalité Stripe.

**Why this priority**: Critique pour la fiabilité du système. Sans webhooks, les états peuvent diverger entre Stripe et la base de données. MVP absolu pour éviter les incohérences.

**Independent Test**: Peut être testé en simulant des événements Stripe (payment_intent.succeeded, charge.refunded) et vérifiant la mise à jour de la base. Délivre la valeur : "État de paiement toujours synchronisé".

**Acceptance Scenarios**:

1. **Given** un webhook `payment_intent.succeeded` reçu, **When** le système le traite, **Then** le statut de la réservation passe à "Confirmée" et les métadonnées de paiement sont mises à jour
2. **Given** un webhook `payment_intent.payment_failed` reçu, **When** le système le traite, **Then** le statut de la réservation passe à "Échec de paiement" et le client est notifié
3. **Given** un webhook `charge.refunded` reçu, **When** le système le traite, **Then** le statut de la réservation passe à "Remboursée" et le montant remboursé est enregistré
4. **Given** un webhook avec signature invalide, **When** le système le reçoit, **Then** il est rejeté avec erreur 401 pour éviter les attaques

---

### Edge Cases

- **Capture partielle**: Que se passe-t-il si le prestataire modifie le prix du service après pré-autorisation ? Faut-il capturer le montant initial ou recalculer ?
- **Pré-autorisation expirée**: Les pré-autorisations Stripe expirent après 7 jours. Comment gérer une confirmation tardive du prestataire ?
- **Refund échoué**: Si le remboursement Stripe échoue (carte annulée), comment créditer le client ? Carte cadeau ?
- **Disputes et chargebacks**: Si un client conteste le paiement auprès de sa banque, comment gérer la dispute Stripe ?
- **Double capture**: Comment éviter qu'une capture soit déclenchée deux fois (idempotence) ?
- **Commission négative**: Un code promo de 100% génère un service gratuit. Quelle commission appliquer ?
- **Stripe Connect non configuré**: Comment gérer les réservations si le prestataire n'a pas encore configuré son compte Connect ?
- **Devise et conversion**: Si un client paie en USD mais le prestataire est en EUR, comment gérer la conversion ?
- **Frais Stripe variables**: Les frais Stripe varient selon le type de carte (nationale vs. internationale). Comment ajuster les calculs ?
- **3D Secure requis**: Comment gérer les paiements nécessitant une authentification 3D Secure ?

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT créer un PaymentIntent Stripe avec `capture_method: manual` lors de chaque réservation
- **FR-002**: Le système DOIT valider la carte bancaire via Stripe avant de créer la réservation
- **FR-003**: Le système DOIT stocker l'identifiant du PaymentIntent dans la table bookings
- **FR-004**: Le système DOIT passer automatiquement le statut à "in_progress" lorsque l'heure_debut est passée
- **FR-004a**: Le système DOIT permettre au prestataire de cliquer "Terminé" pour passer le statut à "completed_by_contractor" sans déclencher la capture
- **FR-004b**: Le système DOIT permettre au client de déclencher manuellement la capture uniquement si le statut est "in_progress" ou "completed_by_contractor" et l'heure_debut est passée
- **FR-004c**: Le système DOIT permettre aux admins de déclencher manuellement la capture à tout moment après l'heure_debut
- **FR-004d**: Le système DOIT déclencher automatiquement la capture 30 minutes après heure_fin si le statut n'est pas encore "captured" (configurable via platform_config.auto_capture_minutes_after_end)
- **FR-004e**: Le système DOIT logger toutes les actions de changement de statut et de capture dans service_action_logs (action_type, performed_by_type, performed_by_id, old_value, new_value, metadata, timestamp)
- **FR-005**: Le système DOIT annuler automatiquement la pré-autorisation si aucune confirmation dans les 48h
- **FR-006**: Le système DOIT calculer la commission plateforme après chaque capture réussie en lisant le taux depuis contractors.commission_rate
- **FR-007**: Le système DOIT transférer le montant net au compte Stripe Connect du prestataire (montant - commission - frais Stripe si contractor_pays_stripe_fees = true)
- **FR-008**: Le système DOIT appliquer le taux de commission stocké dans contractors.commission_rate (défaut: 15.0%)
- **FR-009**: Le système DOIT vérifier contractors.contractor_pays_stripe_fees pour déterminer qui paie les frais Stripe (false = plateforme paie, true = prestataire paie)
- **FR-009a**: Le système DOIT permettre aux admins de modifier commission_rate et contractor_pays_stripe_fees pour chaque prestataire individuellement
- **FR-010**: Le système DOIT stocker les règles d'annulation dans platform_config.cancellation_rules (type: time_based/fallback, heure_rdv_seuil, deadline_hour, pourcentages de remboursement, medical_exception_enabled, actif)
- **FR-011**: Le système DOIT consulter platform_config.cancellation_rules pour calculer le montant de remboursement lors d'une annulation
- **FR-012**: Le système DOIT détecter si une réservation est same-day (créée et RDV le même jour) et appliquer same_day_refund_percent (défaut: 0%)
- **FR-013**: Le système DOIT comparer l'heure de la réservation avec heure_rdv_seuil (défaut: 14h) pour déterminer la deadline applicable
- **FR-014**: Le système DOIT calculer la deadline comme J-1 à deadline_hour (défaut: 18h) pour déterminer le pourcentage de remboursement
- **FR-015**: Le système DOIT appliquer refund_percent_before_deadline (défaut: 100%) si annulation avant deadline
- **FR-016**: Le système DOIT appliquer refund_percent_after_deadline (défaut: 0%) si annulation après deadline
- **FR-017**: Le système DOIT utiliser les règles fallback (fallback_hours_before: 48h) si aucune règle time_based n'est active
- **FR-018**: Le système DOIT permettre au client de demander une exception médicale lors d'une annulation tardive si medical_exception_enabled = true
- **FR-019**: Le système DOIT créer une entrée dans cancellation_requests (statut: pending) avec motif et justificatif optionnel lors d'une demande d'exception
- **FR-020**: Le système DOIT créer automatiquement une tâche dans backoffice_tasks (type: medical_cancellation) assignée au support
- **FR-021**: Le système DOIT afficher le montant facturé temporairement et informer le client que le remboursement dépend de la validation admin
- **FR-022**: Le système DOIT permettre aux admins de consulter les demandes d'exception médicale dans le backoffice
- **FR-023**: Le système DOIT permettre aux admins d'approuver ou rejeter une exception médicale avec motif
- **FR-024**: Le système DOIT émettre un refund Stripe de 100% si l'exception médicale est approuvée
- **FR-025**: Le système DOIT notifier le client par email du résultat de sa demande d'exception (approuvée/rejetée avec motif)
- **FR-026**: Le système DOIT émettre un refund Stripe lors d'une annulation avec remboursement > 0%
- **FR-027**: Le système DOIT enregistrer tous les événements de paiement (pré-autorisation, capture, remboursement) dans un journal d'audit
- **FR-028**: Le système DOIT implémenter un webhook endpoint pour écouter les événements Stripe
- **FR-029**: Le système DOIT valider la signature des webhooks Stripe pour garantir leur authenticité
- **FR-030**: Le système DOIT mettre à jour l'état de la réservation en fonction des webhooks reçus
- **FR-031**: Le système DOIT gérer l'idempotence des webhooks (éviter traitement en double)
- **FR-032**: Le système DOIT permettre aux clients d'enregistrer leurs cartes bancaires via Stripe Customer
- **FR-033**: Le système DOIT tokeniser les cartes enregistrées (jamais stocker de données de carte en clair)
- **FR-034**: Le système DOIT permettre aux clients de sélectionner une carte enregistrée lors du paiement
- **FR-035**: Le système DOIT permettre aux clients de supprimer leurs cartes enregistrées
- **FR-036**: Le système DOIT gérer les paiements nécessitant 3D Secure (Strong Customer Authentication)
- **FR-037**: Le système DOIT retenter automatiquement une capture échouée (maximum 3 tentatives)
- **FR-038**: Le système DOIT notifier le support en cas d'échec de capture après 3 tentatives
- **FR-039**: Le système DOIT permettre aux administrateurs de déclencher manuellement une capture ou un remboursement
- **FR-040**: Le système DOIT afficher un récapitulatif transparent des frais dans le dashboard prestataire : montant service brut, commission plateforme (selon contractors.commission_rate), frais Stripe (si contractors.contractor_pays_stripe_fees = true), montant net transféré

**Pourboires (Tips):**
- **FR-041**: Le système DOIT permettre aux clients de donner un pourboire après qu'une réservation soit en statut "captured"
- **FR-042**: Le système DOIT lire les montants suggérés depuis platform_config.tip_suggested_amounts (JSON array, ex: [5, 10, 15, 20])
- **FR-043**: Le système DOIT créer un PaymentIntent Stripe séparé pour chaque tip avec transfer_data pointant vers le compte Stripe Connect du prestataire
- **FR-044**: Le système DOIT calculer les frais Stripe sur le tip (~2.9% + 0.25€) et les déduire du montant transféré au prestataire
- **FR-045**: Le système DOIT transférer 100% du montant net du tip au prestataire (0% de commission plateforme)
- **FR-046**: Le système DOIT enregistrer chaque tip dans la table tips (reservation_id, client_id, contractor_id, amount, stripe_fee, total_charged, stripe_payment_intent_id, status, created_at)
- **FR-047**: Le système DOIT vérifier platform_config.tip_enabled avant d'afficher l'option de pourboire
- **FR-048**: Le système DOIT vérifier platform_config.tip_time_limit_days et bloquer les tips après le délai configuré (null = illimité)
- **FR-049**: Le système DOIT afficher les tips séparément des revenus de service dans le dashboard prestataire
- **FR-050**: Le système DOIT logger chaque tentative de tip (succès/échec) dans service_action_logs

**Logging et Audit:**
- **FR-051**: Le système DOIT créer une table service_action_logs pour enregistrer toutes les actions sur les réservations
- **FR-052**: Le système DOIT logger : changements de statut, captures (manuelles/auto), tips ajoutés, annulations, reprogrammations avec metadata complètes (IP, user_agent, montants, raisons)
- **FR-053**: Le système DOIT permettre aux admins de consulter l'historique complet des actions pour chaque réservation
- **FR-054**: Le système DOIT conserver les logs indéfiniment pour audit et conformité légale

### Key Entities

- **Payment Transaction (payment_transactions)**: Enregistre tous les mouvements financiers (type: pre_authorization, capture, refund, transfer; montant, statut, timestamps, PaymentIntent ID Stripe)
- **Stripe PaymentIntent**: Représentation d'une intention de paiement Stripe (ID, montant, devise, statut, metadata liée à la réservation)
- **Contractor Commission Settings (contractors.commission_*)**: Configuration commission du prestataire stockée directement dans la table contractors (commission_rate: decimal default 15.0, contractor_pays_stripe_fees: boolean default false, date_effet, notes_commerciales)
- **Stripe Connected Account**: Compte Stripe Connect du prestataire pour recevoir les paiements (account ID, statut d'onboarding, balance disponible)
- **Saved Payment Method (saved_payment_methods)**: Cartes enregistrées du client (Payment Method ID Stripe, type de carte, 4 derniers chiffres, date d'expiration, carte par défaut)
- **Cancellation Policy Configuration (platform_config.cancellation_rules)**: Configuration flexible des règles d'annulation (type: time_based/fallback, heure_rdv_seuil: 14h, deadline_hour: 18h, same_day_refund_percent: 0%, refund_percent_before_deadline: 100%, refund_percent_after_deadline: 0%, medical_exception_enabled: boolean, fallback_hours_before: 48, actif: boolean)
- **Cancellation Request (cancellation_requests)**: Demande d'annulation avec exception médicale (réservation_id, demandé_le, motif, medical_justification: text, justificatif_file_path, statut: pending/approved/rejected, traité_par_admin_id, traité_le, refund_amount, refund_percent_applied)
- **Tip (tips)**: Pourboire donné par un client à un prestataire (reservation_id, client_id, contractor_id, amount: montant tip, stripe_fee: frais Stripe déduits, total_charged: montant total facturé au client, stripe_payment_intent_id, status: pending/succeeded/failed, created_at)
- **Service Action Log (service_action_logs)**: Journal d'audit de toutes les actions sur les réservations (reservation_id, action_type: status_change/capture_manual/capture_auto/tip_added/rescheduled/cancelled/completed_by_contractor, performed_by_type: client/contractor/admin/system, performed_by_id, old_value: JSONB, new_value: JSONB, metadata: JSONB avec IP/user_agent/montants/raisons, created_at)
- **Platform Config - Tips**: Configuration des pourboires dans platform_config (tip_enabled: boolean, tip_suggested_amounts: JSON array [5,10,15,20], tip_time_limit_days: int nullable pour limite de temps)
- **Platform Config - Auto Capture**: Configuration capture automatique (auto_capture_enabled: boolean, auto_capture_minutes_after_end: int default 30)
- **Reservation Status**: États enrichis de la réservation (confirmed, in_progress, completed_by_contractor, captured, cancelled, refunded) avec timestamps pour chaque transition

## Success Criteria

### Measurable Outcomes

- **SC-001**: Le taux de succès de pré-autorisation atteint au moins 95% pour les cartes valides
- **SC-002**: Le temps de traitement d'un paiement (validation → pré-autorisation créée) est inférieur à 3 secondes
- **SC-003**: La capture automatique après confirmation prestataire s'effectue en moins de 5 secondes
- **SC-004**: 100% des webhooks Stripe sont traités avec succès (ou retentative automatique en cas d'erreur temporaire)
- **SC-005**: Les remboursements automatisés sont émis dans les 2 heures suivant l'annulation
- **SC-006**: Le taux de disputes et chargebacks est inférieur à 0.5% grâce à la clarté du processus
- **SC-007**: Les prestataires reçoivent leurs paiements dans les 24h suivant la capture (selon paramètres Stripe Connect)
- **SC-008**: Le nombre de tickets support liés aux paiements diminue de 70% grâce à l'automatisation
- **SC-009**: 60% des clients réguliers utilisent une carte enregistrée pour leurs paiements
- **SC-010**: Le système gère au moins 1000 transactions simultanées sans dégradation de performance

## Assumptions

- Stripe est configuré en mode live avec accès aux API PaymentIntents et Connect
- Les comptes Stripe Connect des prestataires sont configurés en mode "Express" ou "Standard"
- Les webhooks Stripe sont correctement configurés et accessibles publiquement via HTTPS
- Le délai de pré-autorisation Stripe (7 jours) est suffisant pour la confirmation des prestataires
- La politique de remboursement est acceptée par les clients lors de la réservation
- Les frais Stripe (2.9% + 0.25€ par transaction en Europe) sont inclus dans les calculs de commission
- Les prestataires acceptent le délai de transfert Stripe Connect (J+2 à J+7 selon configuration)
- La devise principale de la plateforme est l'Euro (EUR)

## Dependencies

- API Stripe (PaymentIntents, Customers, PaymentMethods, SetupIntents)
- API Stripe Connect (Accounts, Transfers, Payouts)
- Webhooks Stripe (payment_intent.*, charge.*, account.*, payout.*)
- Base de données PostgreSQL pour les transactions et configurations de commission
- Service de notification (email via Resend) pour confirmer paiements et remboursements
- Edge Function pour gérer les webhooks et la logique de capture/remboursement
- Spec 003 (Parcours Réservation) pour le contexte de la réservation au moment du paiement

## Out of Scope

- Paiement par virement bancaire ou chèque
- Paiement en plusieurs fois (split payment)
- Paiement via wallet digital (Apple Pay, Google Pay) - sera traité dans une évolution future
- Gestion des devises multiples et conversion automatique
- Factures PDF générées automatiquement (traité dans une spec séparée)
- Comptabilité avancée et exports comptables
- Gestion des notes de frais pour clients B2B
- Programmes de fidélité avec cashback ou points
- Intégration avec d'autres processeurs de paiement (PayPal, etc.)
