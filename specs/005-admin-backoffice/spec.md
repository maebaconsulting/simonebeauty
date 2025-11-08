# Feature Specification: Interface Administrateur Complète

**Feature Branch**: `005-admin-backoffice`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Interface administrateur complète avec dashboard KPIs, gestion utilisateurs et prestataires, validation onboarding, système de tâches internes et CMS pour contenu"

## User Scenarios & Testing

### User Story 1 - Dashboard avec KPIs en Temps Réel (Priority: P1)

Un administrateur se connecte au back-office et accède immédiatement à un dashboard affichant les métriques critiques de la plateforme : nombre de réservations actives, chiffre d'affaires du mois, taux de conversion, prestataires actifs et alertes système. Ces données sont mises à jour en temps réel.

**Why this priority**: Outil de pilotage central pour l'équipe. Sans visibilité sur les KPIs, impossible de prendre des décisions éclairées ou de détecter rapidement les problèmes. MVP absolu pour gérer la plateforme.

**Independent Test**: Peut être testé en se connectant au back-office et vérifiant que les KPIs s'affichent correctement avec des données à jour. Délivre la valeur : "Équipe a visibilité complète sur l'activité".

**Acceptance Scenarios**:

1. **Given** un administrateur connecté au back-office, **When** il accède au dashboard, **Then** les KPIs principaux (réservations du jour, CA du mois, nouveaux clients, prestataires actifs) s'affichent en moins de 2 secondes
2. **Given** un dashboard affiché, **When** une nouvelle réservation est créée, **Then** le compteur de réservations du jour s'incrémente automatiquement sans rafraîchissement manuel
3. **Given** un administrateur consultant les graphiques, **When** il sélectionne une période (7 jours, 30 jours, année), **Then** les graphiques se mettent à jour pour refléter la période choisie
4. **Given** une alerte système (paiement échoué, prestataire en retard), **When** elle est déclenchée, **Then** elle apparaît en notification rouge dans le dashboard avec possibilité d'action rapide

---

### User Story 2 - Gestion Complète des Utilisateurs (Priority: P1)

Un administrateur doit pouvoir rechercher, consulter, modifier et désactiver n'importe quel compte utilisateur (client ou prestataire). Il peut voir l'historique complet des actions, réinitialiser des mots de passe et ajuster les rôles.

**Why this priority**: Essentiel pour le support client et la modération. Sans cette fonctionnalité, impossible de gérer les problèmes utilisateurs rapidement. Critique pour opérations quotidiennes.

**Independent Test**: Peut être testé en recherchant un utilisateur, consultant son profil et modifiant ses informations. Délivre la valeur : "Support peut résoudre tout problème utilisateur".

**Acceptance Scenarios**:

1. **Given** un administrateur dans la section Utilisateurs, **When** il recherche "marie@example.com", **Then** le profil de Marie s'affiche avec toutes ses informations (réservations, paiements, messages)
2. **Given** un administrateur consultant un profil utilisateur, **When** il clique sur "Historique d'activité", **Then** toutes les actions de l'utilisateur (connexions, réservations, paiements) apparaissent triées par date
3. **Given** un administrateur face à un compte problématique, **When** il clique sur "Désactiver le compte", **Then** l'utilisateur est immédiatement déconnecté et ne peut plus se reconnecter
4. **Given** un client ayant oublié son mot de passe et ne recevant pas les emails, **When** l'administrateur clique sur "Réinitialiser mot de passe", **Then** un lien de réinitialisation est généré manuellement et peut être envoyé au client

---

### User Story 3 - Gestion des Candidatures Prestataires (Priority: P2)

Un candidat prestataire remplit un formulaire de candidature depuis le site public (il ne peut PAS s'inscrire directement). L'administrateur consulte les candidatures en attente, étudie les documents fournis, note des commentaires, planifie un entretien, puis approuve ou refuse la candidature. Si approuvé, le système crée automatiquement le compte prestataire et envoie les identifiants de connexion.

**Why this priority**: Processus de qualification essentiel pour garantir la qualité des prestataires. Protège la réputation de la plateforme mais peut être traité en parallèle du MVP client.

**Independent Test**: Peut être testé en soumettant une candidature côté public, la traitant côté admin, et vérifiant la création du compte. Délivre la valeur : "Seuls les prestataires qualifiés sont activés".

**Acceptance Scenarios**:

1. **Given** un administrateur dans "Candidatures prestataires", **When** il consulte la liste, **Then** toutes les candidatures en attente s'affichent avec nom, date de soumission et statut
2. **Given** un administrateur ouvrant une candidature, **When** il consulte le détail, **Then** il voit : informations personnelles, expérience, spécialités, zone, motivations, et tous les documents téléchargés (diplômes, assurance RC Pro, casier judiciaire)
3. **Given** un administrateur étudiant une candidature, **When** il ajoute des commentaires internes et planifie un entretien (date/heure/mode), **Then** le candidat reçoit automatiquement une invitation d'entretien par email avec lien calendrier (.ics)
4. **Given** un administrateur après entretien positif, **When** il clique sur "Approuver et créer compte", **Then** un compte prestataire est automatiquement créé avec identifiants temporaires envoyés par email ET un slug unique auto-généré (ex: "marie-dupont", ou "marie-dupont-2" si conflit)
5. **Given** un administrateur refusant une candidature, **When** il saisit un motif de refus et confirme, **Then** le candidat reçoit un email avec le motif et la candidature est archivée
6. **Given** un administrateur consultant un prestataire actif, **When** il clique sur "Suspendre", **Then** le prestataire ne reçoit plus de nouvelles demandes mais peut honorer les réservations existantes
7. **Given** un administrateur validant un prestataire, **When** il configure ses conditions financières, **Then** il peut définir : taux de commission personnalisé (défaut: 15%), qui paie les frais Stripe (checkbox "Prestataire paie frais Stripe"), date d'effet, et notes commerciales
8. **Given** un administrateur renégociant un contrat, **When** il modifie le taux de commission d'un prestataire actif, **Then** le nouveau taux s'applique aux nouvelles réservations uniquement (existantes conservent l'ancien taux)
9. **Given** un administrateur créant un compte prestataire, **When** le système génère le slug et détecte un conflit (slug déjà existant), **Then** le slug est automatiquement incrémenté avec un suffixe numérique visible dans l'interface admin (ex: "marie-dupont-2")

---

### User Story 3.1 - Gestion des Conditions Financières Prestataires (Priority: P2)

Un administrateur négocie des conditions financières personnalisées avec un prestataire : taux de commission réduit (10% au lieu de 15%) et frais Stripe à la charge du prestataire. Il configure ces paramètres dans le backoffice et le prestataire voit immédiatement ces conditions dans son dashboard.

**Why this priority**: Essentiel pour la flexibilité commerciale. Permet de recruter des prestataires premium avec des conditions attractives. Important pour la croissance.

**Independent Test**: Peut être testé en modifiant les conditions d'un prestataire et vérifiant les calculs de revenus. Délivre la valeur : "Conditions négociées appliquées correctement".

**Acceptance Scenarios**:

1. **Given** un administrateur dans le profil d'un prestataire, **When** il accède à "Conditions financières", **Then** il peut modifier : commission_rate (slider 5% à 30%, défaut 15%), contractor_pays_stripe_fees (checkbox), date_effet (date picker), notes_commerciales (textarea)
2. **Given** un administrateur définissant commission_rate à 10% pour un prestataire VIP, **When** il sauvegarde, **Then** les nouvelles réservations de ce prestataire appliquent 10% de commission au lieu de 15%
3. **Given** un administrateur cochant "Prestataire paie frais Stripe" pour un prestataire, **When** une réservation de 100€ est capturée, **Then** le prestataire reçoit 100€ - 10€ (commission) - 2.90€ (frais Stripe) = 87.10€ au lieu de 90€
4. **Given** un administrateur modifiant les conditions d'un prestataire actif, **When** il change la date d'effet, **Then** le système affiche clairement combien de réservations en cours utilisent l'ancien taux et combien utiliseront le nouveau
5. **Given** un prestataire dont les conditions ont été modifiées, **When** il consulte son dashboard, **Then** il voit un encadré "Vos conditions : Commission 10%, Frais Stripe à votre charge" avec date d'effet

---

### User Story 4 - Système de Tâches Internes pour l'Équipe (Priority: P3)

L'équipe administrative a besoin d'un système de tâches pour coordonner les actions : "Appeler Marie pour résoudre litige", "Valider les documents de Jean", "Vérifier paiement bloqué ID #1234". Les tâches peuvent être assignées, priorisées et suivies.

**Why this priority**: Améliore l'efficacité de l'équipe mais n'est pas critique pour MVP. Peut être remplacé temporairement par un outil externe (Notion, Trello).

**Independent Test**: Peut être testé en créant, assignant et complétant des tâches au sein de l'équipe admin. Délivre la valeur : "Équipe coordonnée et organisée".

**Acceptance Scenarios**:

1. **Given** un administrateur face à un problème utilisateur, **When** il clique sur "Créer une tâche", **Then** une tâche est créée avec titre, description, assignation et priorité (urgent, normale, basse)
2. **Given** un administrateur avec 5 tâches assignées, **When** il accède à son tableau de bord, **Then** ses tâches apparaissent triées par priorité et date d'échéance
3. **Given** un administrateur terminant une tâche, **When** il la marque comme "Complétée", **Then** elle disparaît de la liste active et est archivée avec horodatage
4. **Given** un manager supervisant l'équipe, **When** il consulte la vue "Toutes les tâches", **Then** il voit la charge de travail par membre et les tâches en retard

---

### User Story 5 - Gestion des Réservations et Interventions Manuelles (Priority: P2)

Un administrateur doit pouvoir consulter toutes les réservations, modifier des détails (date, heure, prestataire assigné) en cas de besoin, forcer une confirmation ou une annulation, et créer manuellement des réservations pour des clients sans passer par le parcours classique.

**Why this priority**: Essentiel pour gérer les exceptions et situations d'urgence. Pas MVP strict mais nécessaire pour opérations réelles.

**Independent Test**: Peut être testé en modifiant une réservation existante ou en créant une réservation manuelle. Délivre la valeur : "Admin peut gérer toute exception".

**Acceptance Scenarios**:

1. **Given** un administrateur dans la liste des réservations, **When** il recherche par ID, client ou prestataire, **Then** les réservations correspondantes s'affichent avec tous les détails
2. **Given** un administrateur consultant une réservation en attente, **When** il clique sur "Forcer la confirmation", **Then** la réservation passe en statut Confirmée et le paiement est capturé immédiatement
3. **Given** un administrateur face à un problème de disponibilité, **When** il modifie l'heure d'une réservation confirmée, **Then** toutes les parties (client, prestataire) sont automatiquement notifiées du changement
4. **Given** un administrateur recevant un appel client VIP, **When** il clique sur "Créer réservation manuelle", **Then** il peut bypasser le parcours normal et créer directement une réservation avec tous les détails

---

### User Story 6 - CMS pour Gestion du Contenu (Priority: P3)

Un administrateur peut gérer le contenu de la plateforme sans intervention technique : créer/modifier des services, éditer les pages d'information, gérer les promotions et codes promo, **gérer la liste des spécialités disponibles**, configurer les catégories et filtres.

**Why this priority**: Réduit la dépendance aux développeurs pour les changements de contenu. Nice-to-have pour MVP mais critique à moyen terme.

**Independent Test**: Peut être testé en créant un nouveau service ou en modifiant une page d'information. Délivre la valeur : "Contenu géré de manière autonome".

**Acceptance Scenarios**:

1. **Given** un administrateur dans la section Services, **When** il clique sur "Ajouter un service", **Then** il peut remplir tous les détails (titre, description, prix, durée, photos) via un formulaire WYSIWYG
2. **Given** un administrateur modifiant un service existant, **When** il change le prix, **Then** le nouveau prix est appliqué uniquement aux nouvelles réservations (existantes conservent ancien prix)
3. **Given** un administrateur dans la section Spécialités, **When** il ajoute/modifie une spécialité (ex: "Massage Ayurvédique"), **Then** elle devient immédiatement disponible dans le formulaire de candidature prestataire
4. **Given** un administrateur désactivant une spécialité, **When** il la marque comme "Inactive", **Then** elle n'apparaît plus dans les nouveaux formulaires mais reste visible pour les prestataires existants qui l'ont déjà
5. **Given** un administrateur dans la section Promotions, **When** il crée un code promo "WELCOME15", **Then** il peut configurer le type (pourcentage, montant fixe), validité et conditions d'utilisation
6. **Given** un administrateur éditant une page "Conditions Générales", **When** il publie les modifications, **Then** la page est mise à jour instantanément pour tous les utilisateurs

---

### User Story 7 - Rapports et Exports de Données (Priority: P2)

Un administrateur ou manager doit pouvoir générer des rapports détaillés sur l'activité de la plateforme : rapport financier mensuel, liste des prestataires avec leurs performances, export CSV de toutes les réservations pour analyse externe.

**Why this priority**: Essentiel pour la comptabilité, l'analyse et les décisions stratégiques. Important mais peut être développé en itératif.

**Independent Test**: Peut être testé en générant un rapport financier du mois en cours. Délivre la valeur : "Données exportables pour analyse".

**Acceptance Scenarios**:

1. **Given** un administrateur dans la section Rapports, **When** il sélectionne "Rapport financier mensuel", **Then** un PDF est généré avec CA, commissions, nombre de transactions et graphiques
2. **Given** un administrateur ayant besoin de données pour analyse, **When** il clique sur "Exporter réservations en CSV", **Then** un fichier CSV avec toutes les colonnes pertinentes est téléchargé
3. **Given** un manager évaluant les prestataires, **When** il génère le "Rapport de performance prestataires", **Then** une liste triée par note, nombre de services, CA généré apparaît
4. **Given** un administrateur clôturant le mois, **When** il génère le rapport comptable, **Then** toutes les transactions, remboursements et commissions sont listées avec leurs justificatifs Stripe

---

### User Story 8 - Gestion des Demandes d'Exception Médicale pour Annulations (Priority: P2)

Un client annule sa réservation après la deadline et demande une exception médicale avec justificatif. L'administrateur reçoit une tâche dans le backoffice, consulte le motif et le justificatif uploadé, puis approuve ou rejette la demande. Si approuvé, un remboursement de 100% est émis automatiquement.

**Why this priority**: Essentiel pour traiter les cas sensibles avec empathie tout en évitant les abus. Réduit les litiges et améliore la satisfaction client. Important mais pas MVP strict.

**Independent Test**: Peut être testé en créant une demande d'exception côté client et la traitant côté admin. Délivre la valeur : "Cas médicaux traités humainement".

**Acceptance Scenarios**:

1. **Given** un client créant une demande d'exception médicale avec motif "Grippe sévère" et justificatif médical, **When** il soumet la demande, **Then** une tâche est créée dans backoffice_tasks (type: medical_cancellation, priorité: high, statut: pending)
2. **Given** un administrateur dans "Tâches en attente", **When** il ouvre une demande d'exception médicale, **Then** il voit : détails réservation, motif du client, justificatif uploadé (si fourni), et boutons "Approuver" / "Rejeter"
3. **Given** un administrateur approuvant une demande, **When** il confirme l'approbation, **Then** un remboursement Stripe de 100% est émis automatiquement, le statut passe à "approved", et le client reçoit un email de confirmation
4. **Given** un administrateur rejetant une demande, **When** il saisit un motif de refus et confirme, **Then** le statut passe à "rejected", le client reçoit un email expliquant le refus, et aucun remboursement n'est émis
5. **Given** un administrateur consultant l'historique des exceptions, **When** il accède à la section "Annulations avec exception", **Then** toutes les demandes (approved/rejected/pending) s'affichent avec filtres et recherche

---

### User Story 9 - Capture Manuelle de Paiement et Gestion de Configuration Plateforme (Priority: P2)

Un administrateur consulte une réservation en statut "in_progress" ou "completed_by_contractor" et peut forcer manuellement la capture du paiement. Il peut également gérer les configurations de la plateforme : montants suggérés pour les tips, limites de reprogrammation, délai de capture automatique, et activer/désactiver certaines fonctionnalités.

**Why this priority**: Essentiel pour résoudre les blocages de paiement et ajuster les paramètres business sans redéploiement. Important pour la flexibilité opérationnelle.

**Independent Test**: Peut être testé en forçant une capture et modifiant une configuration. Délivre la valeur : "Admin contrôle paiements et règles métier".

**Acceptance Scenarios**:

1. **Given** un administrateur consultant une réservation en statut "in_progress", **When** il clique sur "Capturer paiement", **Then** le PaymentIntent est capturé immédiatement, le statut passe à "captured", et une entrée est loggée (performed_by_type: admin)
2. **Given** un administrateur forçant une capture, **When** la capture réussit, **Then** les deux parties (client + prestataire) reçoivent une notification de confirmation de paiement
3. **Given** un administrateur dans "Configuration > Pourboires", **When** il modifie tip_suggested_amounts de [5,10,15,20] à [10,15,20,25], **Then** les nouveaux montants sont appliqués immédiatement pour toutes les réservations futures
4. **Given** un administrateur dans "Configuration > Reprogrammation", **When** il change reschedule_max_count de 1 à 2, **Then** les clients peuvent désormais reprogrammer 2 fois au lieu d'1
5. **Given** un administrateur dans "Configuration > Capture Auto", **When** il modifie auto_capture_minutes_after_end de 30 à 60, **Then** les futures captures auto se déclencheront 60 minutes après fin de service
6. **Given** un administrateur désactivant les pourboires (tip_enabled = false), **When** il sauvegarde, **Then** l'option de tip n'apparaît plus pour les clients
7. **Given** un administrateur consultant les logs d'une réservation, **When** il accède à "Historique complet", **Then** tous les événements sont affichés chronologiquement : changements statut, captures, tips, reprogrammations avec détails (qui, quand, métadonnées)
8. **Given** un administrateur consultant la table service_action_logs globale, **When** il filtre par action_type = "capture_manual", **Then** toutes les captures manuelles s'affichent avec admin ayant déclenché l'action
9. **Given** un administrateur modifiant une configuration critique, **When** il sauvegarde, **Then** un log d'audit est créé avec ancienne et nouvelle valeur, timestamp, et admin_id

---

### User Story 10 - Gestion Administrative des Slugs Prestataires (Priority: P3)

Un administrateur peut consulter et modifier les slugs des prestataires depuis le backoffice. Il peut résoudre les conflits de slug (si deux prestataires veulent le même), forcer la modification d'un slug problématique (offensant, trop générique), et consulter l'historique des changements de slug pour chaque prestataire.

**Why this priority**: Nécessaire pour gérer les cas exceptionnels et conflits. Permet de modérer les slugs inappropriés. Nice-to-have pour MVP mais important pour les opérations à moyen terme.

**Independent Test**: Peut être testé en modifiant le slug d'un prestataire et vérifiant que le changement est effectif. Délivre la valeur : "Admin peut gérer les conflits de slug".

**Acceptance Scenarios**:

1. **Given** un administrateur dans le profil d'un prestataire, **When** il accède à la section "Lien de réservation", **Then** il voit le slug actuel, l'URL complète, un bouton "Modifier", et l'historique des changements de slug (ancien slug, nouveau slug, date, qui a modifié)
2. **Given** un administrateur modifiant le slug d'un prestataire, **When** il saisit un nouveau slug et valide, **Then** le système vérifie l'unicité en temps réel et affiche "✓ Disponible" ou "✗ Déjà utilisé"
3. **Given** un administrateur forçant un slug déjà existant, **When** il coche "Forcer et déplacer l'ancien", **Then** le système attribue le slug au prestataire actuel ET incrémente automatiquement l'ancien propriétaire (ex: marie-dupont → marie-dupont-2)
4. **Given** un administrateur détectant un slug offensant (ex: "super-massage-xxx"), **When** il le modifie en "prestataire-[id]" et coche "Notifier prestataire", **Then** le prestataire reçoit un email expliquant la modification et l'invitant à choisir un nouveau slug approprié
5. **Given** un administrateur consultant la liste de tous les prestataires, **When** il applique le filtre "Slugs avec conflit", **Then** tous les prestataires ayant un slug avec suffixe numérique (ex: marie-dupont-2) s'affichent pour résolution manuelle
6. **Given** un administrateur dans "Outils > Gestion des slugs", **When** il accède à la vue globale, **Then** il voit tous les slugs avec possibilité de recherche, tri, et actions groupées (normalisation, résolution conflits)
7. **Given** un administrateur modifiant le slug d'un prestataire actif, **When** le changement est enregistré, **Then** un log d'audit est créé (old_slug, new_slug, admin_id, reason: textarea optionnel, timestamp)

---

### Edge Cases

- **Modification d'une réservation confirmée**: Que se passe-t-il au niveau paiement si l'administrateur change les détails après capture ?
- **Suppression vs. désactivation**: Faut-il permettre la suppression définitive d'utilisateurs ou seulement la désactivation (GDPR) ?
- **Conflits de rôles**: Un utilisateur peut-il être à la fois client et prestataire ? Comment l'administrateur gère-t-il cette dualité ?
- **Permissions granulaires**: Tous les administrateurs ont-ils les mêmes permissions ou faut-il gérer des rôles (admin, manager, support) ?
- **Actions irréversibles**: Comment protéger contre les suppressions accidentelles de données critiques ?
- **Logs d'audit**: Toutes les actions administrateurs doivent-elles être loggées pour traçabilité ?
- **Accès concurrent**: Que se passe-t-il si deux administrateurs modifient le même utilisateur simultanément ?
- **Export de données volumineuses**: Comment gérer l'export de 100,000 réservations sans bloquer l'interface ?
- **CMS et cache**: Les modifications de contenu doivent-elles invalider le cache immédiatement ou avec délai ?
- **Webhooks échoués**: Comment l'administrateur peut-il manuellement retenter un webhook Stripe échoué ?
- **Forcer un slug déjà assigné**: Que se passe-t-il si un admin force le slug "marie-dupont" alors qu'un autre prestataire l'utilise ? Faut-il notification automatique aux deux prestataires ?
- **Slug modifié pendant réservation active**: Si un admin change le slug d'un prestataire qui a des réservations en cours, comment notifier les clients ?
- **Historique de slug perdu**: Faut-il conserver l'historique complet des slugs ou seulement les N derniers changements ?
- **Action groupée sur slugs**: Si un admin normalise 50 slugs d'un coup, comment gérer les notifications sans spammer les prestataires ?
- **Slug réservé**: Faut-il une liste de slugs réservés (ex: "admin", "booking", "support") que les prestataires ne peuvent pas utiliser ?
- **Restauration de slug**: Si un prestataire veut récupérer son ancien slug après modification, comment gérer si quelqu'un d'autre l'a pris entre-temps ?

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT afficher un dashboard avec KPIs en temps réel (réservations, CA, conversions, alertes)
- **FR-002**: Le système DOIT mettre à jour les KPIs automatiquement sans rafraîchissement manuel (polling ou WebSocket)
- **FR-003**: Le système DOIT permettre de filtrer les KPIs par période (jour, semaine, mois, année, personnalisé)
- **FR-004**: Le système DOIT permettre de rechercher un utilisateur par email, nom, ID ou téléphone
- **FR-005**: Le système DOIT afficher l'historique complet d'activité d'un utilisateur (connexions, réservations, paiements)
- **FR-006**: Le système DOIT permettre à un administrateur de modifier les informations d'un utilisateur
- **FR-007**: Le système DOIT permettre à un administrateur de désactiver/réactiver un compte utilisateur
- **FR-008**: Le système DOIT permettre à un administrateur de réinitialiser manuellement le mot de passe d'un utilisateur
- **FR-009**: Le système DOIT afficher une liste de prestataires en attente de validation avec leurs documents
- **FR-010**: Le système DOIT permettre de consulter tous les documents soumis par un prestataire (diplômes, assurances, casier judiciaire)
- **FR-011**: Le système DOIT permettre d'approuver ou refuser un profil prestataire avec message personnalisé
- **FR-012**: Le système DOIT permettre de suspendre temporairement un prestataire actif
- **FR-013**: Le système DOIT permettre de créer, assigner et prioriser des tâches internes pour l'équipe
- **FR-014**: Le système DOIT afficher les tâches assignées à chaque membre de l'équipe
- **FR-015**: Le système DOIT permettre de marquer une tâche comme complétée avec horodatage
- **FR-016**: Le système DOIT permettre de rechercher et filtrer les réservations par statut, date, client ou prestataire
- **FR-017**: Le système DOIT permettre à un administrateur de modifier les détails d'une réservation (date, heure, prestataire)
- **FR-018**: Le système DOIT permettre de forcer la confirmation ou l'annulation d'une réservation
- **FR-019**: Le système DOIT permettre de créer manuellement une réservation en bypassing le parcours client
- **FR-020**: Le système DOIT notifier automatiquement les parties concernées lors de modifications de réservation
- **FR-021**: Le système DOIT permettre de créer et modifier des services via un CMS avec éditeur WYSIWYG
- **FR-022**: Le système DOIT permettre de télécharger et gérer les photos/médias des services
- **FR-023**: Le système DOIT permettre de créer et configurer des codes promo (type, montant, validité, conditions)
- **FR-024**: Le système DOIT permettre d'éditer les pages statiques (CGV, politique de confidentialité, À propos)
- **FR-025**: Le système DOIT permettre de générer des rapports financiers (CA, commissions, transactions)
- **FR-026**: Le système DOIT permettre d'exporter les données en CSV ou PDF pour analyse externe
- **FR-027**: Le système DOIT permettre de générer un rapport de performance par prestataire
- **FR-028**: Le système DOIT logger toutes les actions administrateurs pour audit (qui, quoi, quand)
- **FR-029**: Le système DOIT implémenter des permissions granulaires par rôle (admin, manager, support)
- **FR-030**: Le système DOIT demander confirmation avant toute action critique irréversible

**Capture Manuelle et Gestion de Configuration:**
- **FR-031**: Le système DOIT permettre aux administrateurs de forcer manuellement la capture du paiement pour toute réservation en statut "in_progress" ou "completed_by_contractor"
- **FR-032**: Le système DOIT logger toutes les captures manuelles dans service_action_logs (action_type: capture_manual, performed_by_type: admin, performed_by_id, timestamp)
- **FR-033**: Le système DOIT notifier client ET prestataire lors d'une capture manuelle forcée par admin
- **FR-034**: Le système DOIT permettre aux administrateurs de consulter l'historique complet (service_action_logs) de chaque réservation avec filtres par action_type
- **FR-035**: Le système DOIT afficher une interface de gestion de la configuration plateforme (platform_config) avec sections organisées : Pourboires, Reprogrammation, Capture Auto, Annulations
- **FR-036**: Le système DOIT permettre de modifier tip_suggested_amounts (JSON array) avec validation (min 1€, max 100€ par montant)
- **FR-037**: Le système DOIT permettre d'activer/désactiver les pourboires globalement (tip_enabled: boolean)
- **FR-038**: Le système DOIT permettre de configurer tip_time_limit_days (limite de temps pour donner un tip, null = illimité)
- **FR-039**: Le système DOIT permettre de configurer reschedule_max_count (nombre max de reprogrammations gratuites, null = illimité)
- **FR-040**: Le système DOIT permettre de configurer reschedule_min_hours_before (délai minimum avant prestation pour reprogrammer)
- **FR-041**: Le système DOIT permettre d'activer/désactiver la reprogrammation globalement (reschedule_enabled: boolean)
- **FR-042**: Le système DOIT permettre de configurer auto_capture_minutes_after_end (délai en minutes après fin service pour capture auto, défaut: 30)
- **FR-043**: Le système DOIT logger toutes les modifications de configuration dans un audit log séparé avec old_value, new_value, admin_id, timestamp
- **FR-044**: Le système DOIT valider toutes les valeurs de configuration avant sauvegarde (types, ranges, cohérence)
- **FR-045**: Le système DOIT afficher un aperçu de l'impact lors de modification de config critique (ex: "23 réservations en cours seront affectées")

**Gestion des Slugs Prestataires:**
- **FR-046**: Le système DOIT générer automatiquement un slug unique lors de la création d'un compte prestataire par un admin
- **FR-047**: Le système DOIT gérer les conflits de slug automatiquement en ajoutant un suffixe numérique (ex: marie-dupont-2)
- **FR-048**: Le système DOIT permettre aux administrateurs de consulter le slug actuel et l'historique des changements pour chaque prestataire
- **FR-049**: Le système DOIT permettre aux administrateurs de modifier manuellement le slug d'un prestataire avec validation en temps réel de l'unicité
- **FR-050**: Le système DOIT permettre aux administrateurs de forcer un slug en déplaçant l'ancien propriétaire (option "Forcer et déplacer")
- **FR-051**: Le système DOIT notifier le prestataire par email lorsqu'un admin modifie son slug
- **FR-052**: Le système DOIT afficher une liste filtrable des prestataires ayant des slugs avec suffixe numérique (conflits)
- **FR-053**: Le système DOIT fournir une vue globale "Gestion des slugs" avec recherche, tri, et actions groupées
- **FR-054**: Le système DOIT logger tous les changements de slug dans un audit log (old_slug, new_slug, changed_by: admin/contractor, admin_id, reason, timestamp)
- **FR-055**: Le système DOIT invalider immédiatement l'ancien slug après modification (404 sur ancien lien)

### Key Entities

- **Admin Dashboard Metrics**: Métriques temps réel (nombre de réservations actives, CA du jour/mois/année, taux de conversion, nombre de prestataires actifs, alertes système)
- **User Management Record**: Vue consolidée d'un utilisateur (profil, historique, réservations, paiements, messages, logs d'actions)
- **Contractor Validation Request**: Demande de validation prestataire (documents soumis, statut de vérification, commentaires admin, date de soumission)
- **Internal Task**: Tâche interne équipe (titre, description, assigné à, priorité, statut, date d'échéance, date de complétion)
- **Manual Booking Override**: Réservation créée/modifiée manuellement par admin (détails de modification, raison, administrateur responsable, notifications envoyées)
- **CMS Content Entry**: Entrée de contenu CMS (type: service, page, promotion; contenu, métadonnées, historique de versions, statut de publication)
- **Admin Action Log**: Journal d'audit (administrateur, action effectuée, entité modifiée, horodatage, IP, détails avant/après)
- **Report Template**: Modèle de rapport (type: financier, performance, utilisateurs; paramètres, format d'export, périodicité)
- **Contractor Slug Change Log (contractor_slug_history)**: Historique des changements de slug (contractor_id, old_slug, new_slug, changed_by: admin/contractor, admin_id nullable, reason: TEXT nullable, created_at)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Les administrateurs peuvent accéder au dashboard et consulter les KPIs en moins de 2 secondes
- **SC-002**: Le temps moyen de recherche et consultation d'un profil utilisateur est inférieur à 10 secondes
- **SC-003**: Le délai de validation d'un nouveau prestataire (soumission → approbation) est réduit de 50% grâce à l'interface centralisée
- **SC-004**: 90% des tâches internes sont complétées dans les délais définis
- **SC-005**: Le temps moyen de résolution d'un ticket support nécessitant intervention admin diminue de 60%
- **SC-006**: Les administrateurs peuvent créer ou modifier un service sans intervention technique en moins de 5 minutes
- **SC-007**: 100% des actions administrateurs critiques (modifications réservations, désactivations comptes) sont loggées pour audit
- **SC-008**: Les rapports financiers mensuels peuvent être générés en moins de 10 secondes
- **SC-009**: Le nombre d'erreurs humaines dans la gestion manuelle des réservations diminue de 70% grâce aux validations automatiques
- **SC-010**: L'équipe administrative peut gérer 5x plus de volume de réservations avec la même taille d'équipe grâce à l'automatisation

## Assumptions

- Les administrateurs ont des comptes avec rôle "admin" ou "manager" dans la base de données
- Les permissions sont gérées via Row Level Security (RLS) dans Supabase
- Les KPIs en temps réel peuvent être calculés avec des queries optimisées (indexes, vues matérialisées)
- Les documents des prestataires sont stockés dans Supabase Storage avec accès sécurisé
- Les tâches internes sont stockées dans une table dédiée avec assignation aux utilisateurs admin
- Les logs d'audit sont conservés pendant au moins 2 ans pour conformité
- L'interface back-office est séparée de l'interface client/prestataire (route protégée /admin)
- Les exports de données volumineuses utilisent un système de génération asynchrone avec notification
- Le CMS utilise un éditeur WYSIWYG standard (Tiptap, Draft.js) pour le contenu riche

## Dependencies

- Supabase Auth pour gérer les rôles et permissions admin
- Supabase Database pour toutes les opérations CRUD sur les entités
- Supabase Storage pour les documents prestataires et médias des services
- Supabase Realtime pour la mise à jour automatique des KPIs
- Service de génération PDF pour les rapports (ex: jsPDF, Puppeteer)
- Bibliothèque de graphiques pour les KPIs (ex: Chart.js, Recharts)
- Éditeur WYSIWYG pour le CMS (ex: Tiptap, TinyMCE)
- Service de notification (email via Resend) pour alerter lors de modifications

## Out of Scope

- Interface mobile native pour administrateurs (restera web responsive)
- Intelligence artificielle pour suggestions automatiques de modération
- Chatbot de support intégré dans le back-office
- Système de tickets support complet avec workflow (peut utiliser outil externe temporairement)
- Messagerie interne complète entre membres de l'équipe admin
- Système de permissions ultra-granulaire (niveau champ par champ)
- Intégration avec outils comptables externes (Sage, QuickBooks)
- Analyse prédictive et forecasting automatique
- Multi-langue pour l'interface admin (reste en français uniquement)
- Système de sauvegarde et restauration de données via UI
