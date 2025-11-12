# Feature Specification: Interface Prestataire Complète

**Feature Branch**: `007-contractor-interface`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Interface prestataire avec gestion planning et disponibilités, acceptation/refus réservations, suivi revenus et commissions, paramètres profil professionnel"

## User Scenarios & Testing

### User Story 0 - Processus d'Onboarding Prestataire (Priority: P1)

Un candidat prestataire ne peut PAS s'inscrire directement comme un client. Il doit d'abord remplir un formulaire de candidature depuis le site web public, fournir un maximum d'informations de qualification (expérience, diplômes, assurances, spécialités, zone d'intervention). Sa demande est étudiée par l'équipe admin qui planifie un entretien. Suite à l'entretien et validation, son compte est créé par l'administrateur et il reçoit ses identifiants de connexion.

**Why this priority**: Processus de qualification critique pour garantir la qualité des prestataires. Sans cela, n'importe qui pourrait devenir prestataire. Protège la réputation de la plateforme. MVP absolu.

**Independent Test**: Peut être testé en soumettant une candidature, la validant côté admin, et vérifiant que le prestataire peut se connecter uniquement après validation. Délivre la valeur : "Seuls les prestataires qualifiés accèdent à la plateforme".

**Acceptance Scenarios**:

1. **Given** un visiteur sur la page "/rejoindre-simone", **When** il clique sur "Postuler maintenant", **Then** un formulaire multi-étapes (5 étapes) s'affiche avec : (Étape 1) informations personnelles (prénom, nom, email, téléphone, type de structure: société/personnel, adresse séparée en rue/ville/code postal/pays), (Étape 2) profil professionnel avec **sélection de spécialités prédéfinies selon la profession**, (Étape 3) planning hebdomadaire avec sélecteurs d'horaires par jour (créneaux de travail et pauses) et zones géographiques, (Étape 4) motivation (optionnelle), (Étape 5) upload de documents (CV, certifications, portfolio - optionnels, 5MB max)
2. **Given** un candidat remplissant le formulaire multi-étapes, **When** il valide chaque étape (validation Zod en temps réel) et soumet à l'étape finale, **Then** les fichiers sont uploadés dans Supabase Storage (bucket: job-applications), une tâche backoffice est créée (table: backoffice_tasks, type: job_application), et deux emails sont envoyés (confirmation au candidat + notification à l'équipe contact@simone.paris)
3. **Given** un administrateur consultant les candidatures en attente, **When** il ouvre un profil candidat, **Then** il peut voir tous les documents, noter des commentaires et planifier un entretien
4. **Given** un administrateur après entretien positif, **When** il clique sur "Approuver et créer compte", **Then** un compte prestataire est créé, un email avec identifiants temporaires est envoyé, et le candidat peut se connecter
5. **Given** un candidat dont la candidature est refusée, **When** l'admin clique sur "Refuser avec motif", **Then** le candidat reçoit un email expliquant le refus
6. **Given** un prestataire nouvellement approuvé, **When** il se connecte pour la première fois, **Then** il est guidé à travers un onboarding obligatoire (configuration horaires, Stripe Connect, profil pro)

---

### User Story 1 - Gestion du Planning et Disponibilités (Priority: P1)

Un prestataire configure ses horaires de travail hebdomadaires et peut bloquer des créneaux spécifiques (pause déjeuner, congés, rendez-vous personnels). Il consulte son planning en temps réel avec toutes ses réservations confirmées.

**Why this priority**: Fondamental pour l'algorithme de disponibilités (spec 002). Sans configuration des horaires, aucun créneau ne peut être proposé aux clients. MVP absolu.

**Independent Test**: Peut être testé en configurant des horaires et vérifiant qu'ils sont respectés lors de la recherche de créneaux. Délivre la valeur : "Prestataire contrôle sa disponibilité".

**Acceptance Scenarios**:

1. **Given** un prestataire accédant à "Mon planning", **When** il configure ses horaires (lundi-vendredi 9h-18h), **Then** ces horaires sont enregistrés et utilisés pour calculer les créneaux disponibles
2. **Given** un prestataire consultant son planning hebdomadaire, **When** il visualise la semaine, **Then** toutes ses réservations confirmées apparaissent avec code couleur selon le statut
3. **Given** un prestataire voulant bloquer un créneau, **When** il sélectionne une date/heure et clique sur "Bloquer", **Then** ce créneau devient indisponible pour les clients
4. **Given** un prestataire avec 3 réservations le même jour, **When** il consulte son planning, **Then** il voit les temps de trajet estimés entre chaque rendez-vous

---

### User Story 2 - Acceptation et Refus des Réservations (Priority: P1)

Un prestataire reçoit une notification lorsqu'une nouvelle réservation est créée. Il peut consulter les détails et accepter ou refuser la demande dans les 24h avec un message optionnel au client.

**Why this priority**: Processus critique du workflow de réservation. Sans validation prestataire, le système ne peut pas fonctionner en mode confirmé. Essentiel au modèle.

**Independent Test**: Peut être testé en créant une réservation côté client et la validant côté prestataire. Délivre la valeur : "Prestataire valide ses rendez-vous".

**Acceptance Scenarios**:

1. **Given** un prestataire recevant une nouvelle demande de réservation, **When** il accède à "Demandes en attente", **Then** la demande apparaît avec tous les détails (client, service, date, adresse, montant)
2. **Given** un prestataire consultant une demande, **When** il clique sur "Accepter", **Then** la réservation est confirmée, le paiement est capturé et le client reçoit une confirmation
3. **Given** un prestataire ne pouvant pas honorer une demande, **When** il clique sur "Refuser" avec motif, **Then** la pré-autorisation est annulée et le client est notifié avec le motif
4. **Given** un prestataire ne répondant pas dans les 24h, **When** le délai expire, **Then** la demande est automatiquement annulée et le client en est informé

---

### User Story 2.1 - Marquage de Service Terminé (Priority: P1)

Un prestataire termine une prestation et clique sur le bouton "Terminé" dans son interface. Cela change le statut de la réservation de "in_progress" à "completed_by_contractor", signalant au client que le service est terminé. Cela ne déclenche PAS automatiquement la capture du paiement - celle-ci sera effectuée par le client, le backoffice, ou automatiquement 30 minutes plus tard. L'action est enregistrée dans les logs pour traçabilité.

**Why this priority**: Permet au prestataire de signaler la fin du service et déclenche la séquence de capture. Critique pour le workflow de paiement flexible. MVP absolu.

**Independent Test**: Peut être testé en cliquant "Terminé" et vérifiant que le statut change sans déclencher la capture immédiate. Délivre la valeur : "Prestataire signale la fin du service proprement".

**Acceptance Scenarios**:

1. **Given** un prestataire avec une réservation en statut "in_progress", **When** il clique sur "Terminé", **Then** le statut passe à "completed_by_contractor" et une notification est envoyée au client
2. **Given** un prestataire cliquant sur "Terminé", **When** le changement de statut s'effectue, **Then** une entrée est créée dans service_action_logs (action_type: completed_by_contractor, performed_by_type: contractor, timestamp)
3. **Given** une réservation passée à "completed_by_contractor", **When** 5 minutes se sont écoulées, **Then** le paiement n'est toujours PAS capturé (attente 30min ou action manuelle)
4. **Given** un prestataire avec réservation "completed_by_contractor", **When** il consulte son dashboard, **Then** la réservation apparaît dans "En attente de paiement" avec badge orange
5. **Given** un client recevant la notification "Service terminé", **When** il consulte sa réservation, **Then** il voit le bouton "Confirmer paiement" et "Donner un pourboire" (après capture)

---

### User Story 3 - Suivi des Revenus, Commissions et Pourboires (Priority: P2)

Un prestataire consulte un tableau de bord financier affichant ses revenus du mois, les commissions retenues par la plateforme, les pourboires reçus (affichés séparément), les paiements à venir et l'historique complet des transactions. Les tips sont clairement distingués des revenus de service pour transparence totale.

**Why this priority**: Important pour la transparence financière et la confiance. Les tips séparés motivent l'excellence du service. Pas MVP strict mais essentiel pour l'adoption par les prestataires.

**Independent Test**: Peut être testé en complétant des réservations avec tips et vérifiant que les montants s'affichent correctement séparés. Délivre la valeur : "Prestataire voit ses gains clairement avec tips distincts".

**Acceptance Scenarios**:

1. **Given** un prestataire accédant à "Mes revenus", **When** il consulte le dashboard, **Then** il voit 3 montants distincts : "Revenus services : 1,200€ + Tips reçus : 45€ = Total : 1,245€"
2. **Given** un prestataire avec 5 réservations complétées ce mois dont 2 avec tips, **When** il consulte l'historique, **Then** chaque transaction affiche : service avec montant brut, commission, frais Stripe (si applicable), montant net service, ET tip reçu (si applicable) avec frais Stripe déduits
3. **Given** un prestataire consultant une transaction de 100€ avec tip de 10€, **When** il voit le détail, **Then** l'affichage montre : "Service : 100€ - Commission 15€ - Frais Stripe 2.90€ = Net service : 82.10€ | Pourboire : 10€ - Frais Stripe 0.29€ = Net tip : 9.71€ | Total net : 91.81€"
4. **Given** un prestataire dont le contrat stipule que les frais Stripe sont à sa charge (contractor_pays_stripe_fees = true), **When** il consulte une transaction, **Then** le détail affiche clairement "Frais Stripe : 2.90€ (à votre charge)" pour le service, mais les frais du tip (0.29€) sont TOUJOURS déduits du tip
5. **Given** un prestataire avec Stripe Connect configuré, **When** un paiement est capturé ET un tip reçu, **Then** le dashboard affiche 2 lignes distinctes : "Paiement service : 82.10€" et "Pourboire : 9.71€" avec dates de transfert estimées
6. **Given** un prestataire ayant reçu 3 paiements avec tips, **When** il exporte l'historique en CSV, **Then** le fichier contient des colonnes séparées : montant_service_brut, commission, frais_stripe_service, net_service, montant_tip, frais_stripe_tip, net_tip, total_net
7. **Given** un prestataire consultant ses statistiques, **When** il accède à "Mes performances", **Then** il voit le taux de tips : "Tips reçus sur 40% de vos prestations (moyenne : 12€ par tip)"
8. **Given** un prestataire recevant un tip de 15€, **When** le tip est confirmé, **Then** il reçoit une notification : "🎉 Vous avez reçu un pourboire de 15€ de [Client] pour le service du [Date]"
9. **Given** un prestataire consultant ses conditions financières, **When** il accède à "Mon contrat", **Then** il voit clairement : taux de commission négocié (15%), frais Stripe à sa charge (oui/non), et mention "Les pourboires sont transférés à 100% (après frais Stripe)"

---

### User Story 4 - Profil Professionnel et Portfolio (Priority: P2)

Un prestataire gère son profil professionnel : bio, spécialités, certifications, photos de ses réalisations, zone d'intervention. Ces informations sont visibles par les clients lors de la réservation.

**Why this priority**: Différenciateur clé pour les prestataires. Améliore la conversion et permet aux clients de choisir. Important mais pas critique pour MVP.

**Independent Test**: Peut être testé en modifiant le profil et vérifiant que les changements apparaissent côté client. Délivre la valeur : "Prestataire se démarque".

**Acceptance Scenarios**:

1. **Given** un prestataire accédant à "Mon profil pro", **When** il modifie sa bio et ses spécialités, **Then** les modifications sont sauvegardées et visibles immédiatement pour les clients
2. **Given** un prestataire téléchargeant 5 photos de réalisations, **When** il les ajoute à son portfolio, **Then** elles s'affichent dans son profil avec possibilité de réorganisation
3. **Given** un prestataire définissant sa zone d'intervention, **When** il sélectionne "Paris et 20km alentours", **Then** il n'apparaîtra que pour les clients dans cette zone
4. **Given** un prestataire avec certifications, **When** il télécharge ses diplômes, **Then** ils sont visibles par les clients (avec badge "Certifié" si validé par admin)

---

### User Story 5 - Configuration Stripe Connect pour Paiements (Priority: P1)

Un prestataire doit configurer son compte Stripe Connect pour recevoir ses paiements. Le système guide à travers le processus d'onboarding Stripe et affiche le statut de configuration.

**Why this priority**: Obligatoire pour que le prestataire reçoive ses paiements. Sans cela, impossible de monétiser. MVP critique.

**Independent Test**: Peut être testé en complétant l'onboarding Stripe Connect. Délivre la valeur : "Prestataire peut recevoir ses paiements".

**Acceptance Scenarios**:

1. **Given** un nouveau prestataire sans compte Stripe, **When** il accède à "Mes paiements", **Then** un bouton "Configurer mon compte de paiement" avec explications s'affiche
2. **Given** un prestataire cliquant sur "Configurer", **When** il est redirigé vers Stripe Connect, **Then** il complète l'onboarding (informations bancaires, identité, vérifications)
3. **Given** un prestataire ayant complété l'onboarding, **When** il revient sur la plateforme, **Then** son statut affiche "Compte vérifié" et il peut recevoir des paiements
4. **Given** un prestataire avec onboarding incomplet, **When** il tente d'accepter une réservation, **Then** il est invité à finaliser son compte Stripe avant de pouvoir continuer

---

### User Story 6 - Notifications et Alertes en Temps Réel (Priority: P2)

Un prestataire reçoit des notifications pour tous les événements importants : nouvelles demandes, annulations clients, rappels de rendez-vous, messages clients, paiements reçus.

**Why this priority**: Essentiel pour la réactivité et la communication. Important mais peut être simplifié pour MVP.

**Independent Test**: Peut être testé en déclenchant différents événements et vérifiant la réception des notifications. Délivre la valeur : "Prestataire toujours informé".

**Acceptance Scenarios**:

1. **Given** un prestataire avec notifications activées, **When** une nouvelle demande arrive, **Then** il reçoit une notification push et email immédiatement
2. **Given** un prestataire avec rendez-vous demain 10h, **When** J-1 à 10h, **Then** il reçoit un rappel SMS avec adresse et détails du client
3. **Given** un client annulant une réservation, **When** l'annulation est confirmée, **Then** le prestataire reçoit une notification avec le créneau libéré
4. **Given** un prestataire accédant au centre de notifications, **When** il consulte la liste, **Then** toutes les notifications récentes s'affichent avec possibilité de filtrer par type

---

### User Story 7 - Gestion du Slug Personnalisé (Priority: P2)

Un prestataire peut créer et modifier son slug unique qui permet aux clients de réserver directement via une URL personnalisée (ex: simone.paris/book/marie-dupont-massage). Le système génère automatiquement un slug initial basé sur le nom du prestataire lors de la création du compte, que le prestataire peut ensuite personnaliser. Le slug doit être unique dans tout le système, protégé contre les abus (mots interdits, limitation des changements), et le prestataire reçoit une validation en temps réel. Les anciennes URLs sont redirigées pendant 30 jours pour préserver les liens partagés.

**Why this priority**: Permet au prestataire de partager facilement son lien de réservation sur ses supports marketing (réseaux sociaux, cartes de visite, site web personnel). Améliore l'acquisition client directe. Important pour l'autonomie marketing mais pas critique pour le MVP.

**Independent Test**: Peut être testé en modifiant le slug et vérifiant l'unicité, la redirection de l'ancien lien, et les statistiques de conversion. Délivre la valeur : "Prestataire a son lien de réservation personnalisé et trackable".

**Acceptance Scenarios**:

1. **Given** un nouveau prestataire "Marie Dupont" dont le compte est créé, **When** le système génère son slug automatiquement, **Then** le slug initial est "marie-dupont" (nom normalisé: minuscules, accents supprimés, espaces en tirets)
2. **Given** un slug "marie-dupont" déjà existant, **When** un nouveau prestataire "Marie Dupont" est créé, **Then** le système génère "marie-dupont-2" (ajout numéro incrémental pour éviter conflits)
3. **Given** un prestataire accédant à "Mon profil > Mon lien de réservation", **When** la page se charge, **Then** il voit son slug actuel, l'URL complète (simone.paris/book/[slug]), le nombre de changements restants (max 3/an), un bouton "Copier le lien" et un bouton "Modifier"
4. **Given** un prestataire cliquant sur "Modifier", **When** il saisit un nouveau slug, **Then** le système valide en temps réel (caractères autorisés: a-z, 0-9, tirets, min 3 caractères, max 50 caractères, pas de mots interdits) et affiche "✓ Disponible" ou "✗ Déjà utilisé" ou "✗ Mot interdit"
5. **Given** un prestataire saisissant "Marie Massage Paris!", **When** la validation s'exécute, **Then** le système suggère automatiquement "marie-massage-paris" (normalisation automatique)
6. **Given** un prestataire saisissant "admin", **When** la validation s'exécute, **Then** le système affiche "✗ Mot interdit" (termes réservés: admin, api, www, book, search, etc.)
7. **Given** un prestataire validant un nouveau slug disponible, **When** il clique sur "Enregistrer", **Then** le slug est mis à jour, une entrée est créée dans slug_history avec l'ancien slug (expiration: 30 jours), une redirection 301 est configurée, et le prestataire reçoit une confirmation avec avertissement : "Ancien lien redirigé pendant 30 jours. Pensez à mettre à jour vos supports marketing."
8. **Given** un client accédant à l'ancien slug pendant les 30 jours, **When** la page se charge, **Then** il est automatiquement redirigé (HTTP 301) vers le nouveau slug sans interruption du parcours
9. **Given** un client accédant à l'ancien slug après 30 jours, **When** la page se charge, **Then** il voit une page 404 personnalisée avec message "Ce prestataire a modifié son lien. Veuillez le contacter pour obtenir le nouveau lien."
10. **Given** un prestataire avec slug "marie-dupont", **When** il clique sur "Copier le lien", **Then** l'URL complète "https://simone.paris/book/marie-dupont" est copiée dans le presse-papier avec feedback visuel
11. **Given** un prestataire consultant ses statistiques, **When** il accède à "Performances", **Then** il voit le nombre de visites sur son lien personnalisé (total et 30 derniers jours), le taux de conversion (visites → réservations confirmées), et la source des visites (direct, réseaux sociaux, etc.)
12. **Given** un prestataire ayant déjà changé 3 fois son slug cette année, **When** il tente un 4ème changement, **Then** le système affiche "Limite atteinte (3 changements/an). Prochain changement disponible le [date]"
13. **Given** un client en cours de réservation via /book/marie-dupont, **When** le prestataire change son slug pendant la session, **Then** la réservation continue normalement car le contractor_id est stocké en session (pas le slug)
14. **Given** un administrateur détectant un slug inapproprié "slug-vulgaire", **When** il accède au profil prestataire en backoffice, **Then** il peut cliquer sur "Forcer modification slug" avec motif, le prestataire reçoit une notification, et son slug est réinitialisé à [prenom-nom]

---

### Edge Cases

- **Candidature incomplète**: Que se passe-t-il si un candidat soumet le formulaire sans tous les documents requis ?
- **Double candidature**: Comment gérer un candidat qui soumet plusieurs candidatures avec des emails différents ?
- **Candidat déjà refusé**: Peut-on postuler à nouveau après un refus ? Après combien de temps ?
- **Entretien non honoré**: Que se passe-t-il si le candidat ne se présente pas à l'entretien planifié ?
- **Compte créé mais onboarding non complété**: Combien de temps avant de désactiver un compte prestataire qui ne finalise pas son onboarding ?
- **Conflit de planning**: Que se passe-t-il si le prestataire accepte deux demandes pour des créneaux qui se chevauchent ?
- **Modification après acceptation**: Comment gérer si le prestataire veut modifier l'heure d'un rendez-vous déjà confirmé ?
- **Stripe Connect en attente**: Combien de temps un prestataire peut-il opérer sans compte Stripe vérifié ?
- **Revenus avec remboursements**: Comment afficher les revenus si une réservation est annulée après capture ?
- **Zone d'intervention changeante**: Si le prestataire réduit sa zone, que se passe-t-il avec les réservations existantes hors zone ?
- **Horaires variables par semaine**: Comment gérer un prestataire qui travaille une semaine sur deux ?
- **Indisponibilité d'urgence**: Comment bloquer rapidement toute une journée en cas d'imprévu ?
- **Photo de portfolio inappropriée**: Qui modère les photos uploadées par les prestataires ?
- **Refus systématique**: Comment détecter et gérer un prestataire qui refuse >50% des demandes ?
- **Double notification**: Comment éviter d'envoyer des notifications en double (email + SMS + push) ?
- **Slug avec nom très court**: Si le nom normalisé donne <3 caractères (ex: "Li" → "li"), comment générer un slug valide ?
- **Slug avec caractères spéciaux uniquement**: Comment normaliser "O'Connor" ou "São Paulo" pour générer un slug valide ?

## Requirements

### Functional Requirements

**Onboarding et Candidature:**
- **FR-000**: Le système DOIT fournir une page publique /rejoindre-simone avec formulaire de candidature accessible sans authentification
- **FR-001**: Le système DOIT implémenter un formulaire multi-étapes (5 étapes) avec navigation progressive et indicateur visuel (pills circulaires + ligne de progression)
- **FR-002**: Le système DOIT valider chaque étape avec Zod schema avant de permettre la navigation vers l'étape suivante (mode: onChange)
- **FR-003**: Le système DOIT afficher des spécialités dynamiques selon la profession choisie (coiffeur/esthéticienne/masseur/autre)
- **FR-004**: Le système DOIT collecter : (Étape 1) prénom, nom, email, téléphone, type de structure (société/personnel), adresse séparée (rue, ville, code postal, pays obligatoire), (Étape 2) profession, années d'expérience, diplômes, spécialités, services, (Étape 3) zones géographiques (arrondissements Paris + banlieue), planning hebdomadaire avec sélection par jour (créneaux de travail start/end et pauses start/end au format HH:mm), fréquence de travail, (Étape 4) motivation (optionnelle, min 100 caractères si fournie), (Étape 5) uploads optionnels
- **FR-005**: Le système DOIT permettre l'upload de fichiers optionnels (CV, certifications, portfolio) avec validation côté client (types: .pdf/.doc/.docx, max 5MB par fichier)
- **FR-006**: Le système DOIT uploader les fichiers dans le bucket Supabase Storage "job-applications" avec structure : cv/, certifications/, portfolio/
- **FR-007**: Le système DOIT invoquer l'Edge Function "submit-job-application" lors de la soumission du formulaire
- **FR-008**: Le système DOIT enregistrer la candidature dans la table job_applications avec toutes les informations collectées et les chemins des fichiers uploadés
- **FR-009**: Le système DOIT créer automatiquement une tâche dans backoffice_tasks (type: job_application, priorité: medium, statut: pending)
- **FR-010**: Le système DOIT envoyer un email de confirmation au candidat via Resend avec récapitulatif de sa candidature
- **FR-011**: Le système DOIT envoyer un email de notification à l'équipe (contact@simone.paris) avec détails complets de la candidature et liens vers les documents
- **FR-012**: Le système DOIT afficher toutes les candidatures en attente dans le back-office admin
- **FR-013**: Le système DOIT permettre aux admins de consulter tous les documents et informations du candidat
- **FR-014**: Le système DOIT permettre aux admins de noter des commentaires sur chaque candidature
- **FR-015**: Le système DOIT permettre aux admins de planifier un entretien (date, heure, mode: visio/téléphone/présentiel)
- **FR-016**: Le système DOIT envoyer une invitation d'entretien par email au candidat avec lien calendrier (ics)
- **FR-017**: Le système DOIT permettre aux admins d'approuver une candidature et créer automatiquement un compte prestataire
- **FR-018**: Le système DOIT générer des identifiants temporaires et les envoyer par email au prestataire approuvé
- **FR-019**: Le système DOIT permettre aux admins de refuser une candidature avec motif obligatoire
- **FR-020**: Le système DOIT archiver les candidatures refusées avec possibilité de recherche ultérieure
- **FR-020a**: Le système DOIT permettre aux administrateurs de supprimer définitivement les candidatures refusées UNIQUEMENT (hard delete), avec confirmation obligatoire, suppression des fichiers associés du storage (CV, certifications, portfolio), et action irréversible clairement indiquée
- **FR-021**: Le système DOIT forcer le prestataire à finaliser son onboarding (horaires + Stripe + profil) avant d'accepter des réservations

**Planning et Disponibilités:**
- **FR-022**: Le système DOIT permettre de bloquer des créneaux spécifiques (indisponibilités)
- **FR-023**: Le système DOIT afficher un planning hebdomadaire avec toutes les réservations confirmées
- **FR-024**: Le système DOIT calculer et afficher les temps de trajet entre réservations consécutives

**Gestion des Réservations:**
- **FR-025**: Le système DOIT afficher une liste de demandes de réservations en attente de validation
- **FR-026**: Le système DOIT permettre au prestataire d'accepter une demande de réservation
- **FR-027**: Le système DOIT capturer automatiquement le paiement lorsque le prestataire accepte
- **FR-028**: Le système DOIT permettre au prestataire de refuser une demande avec motif
- **FR-029**: Le système DOIT annuler automatiquement les demandes non traitées après 24h
- **FR-029a**: Le système DOIT afficher un bouton "Terminé" pour les réservations en statut "in_progress"
- **FR-029b**: Le système DOIT passer le statut à "completed_by_contractor" lorsque le prestataire clique sur "Terminé" SANS déclencher la capture
- **FR-029c**: Le système DOIT logger l'action "Terminé" dans service_action_logs (action_type: completed_by_contractor, performed_by_type: contractor)
- **FR-029d**: Le système DOIT notifier le client lorsque le prestataire marque le service comme terminé
- **FR-029e**: Le système DOIT afficher les réservations "completed_by_contractor" dans une section "En attente de paiement" avec badge distinctif

**Revenus et Paiements:**
- **FR-030**: Le système DOIT afficher un dashboard financier avec 3 montants séparés : "Revenus services + Tips reçus = Total"
- **FR-031**: Le système DOIT afficher l'historique de toutes les transactions avec détails INCLUANT les tips reçus séparément pour chaque réservation
- **FR-032**: Le système DOIT permettre d'exporter l'historique financier en CSV avec colonnes séparées pour services et tips (montant_service_brut, commission, frais_stripe_service, net_service, montant_tip, frais_stripe_tip, net_tip, total_net)
- **FR-033**: Le système DOIT afficher les paiements à venir avec dates de transfert Stripe estimées, incluant services ET tips comme lignes distinctes
- **FR-033a**: Le système DOIT afficher clairement que les frais Stripe des tips sont TOUJOURS déduits du tip (indépendamment de contractor_pays_stripe_fees)
- **FR-033b**: Le système DOIT afficher le détail complet d'une transaction avec tip : "Service: X€ - Commission Y€ - Frais Stripe Z€ = Net service: A€ | Pourboire: B€ - Frais Stripe C€ = Net tip: D€ | Total net: E€"
- **FR-033c**: Le système DOIT afficher les statistiques de tips : taux de réception (ex: 40% des prestations), montant moyen par tip
- **FR-033d**: Le système DOIT notifier le prestataire immédiatement lorsqu'un tip est reçu avec montant et client
- **FR-033e**: Le système DOIT afficher dans "Mon contrat" la mention "Les pourboires sont transférés à 100% (après frais Stripe)"
- **FR-034**: Le système DOIT guider le prestataire à travers l'onboarding Stripe Connect
- **FR-035**: Le système DOIT afficher le statut du compte Stripe (en attente, vérifié, action requise)
- **FR-036**: Le système DOIT bloquer l'acceptation de réservations si Stripe Connect non configuré

**Profil Professionnel:**
- **FR-037**: Le système DOIT permettre de modifier le profil professionnel (bio, spécialités, certifications)
- **FR-038**: Le système DOIT permettre de télécharger et gérer des photos de portfolio
- **FR-039**: Le système DOIT permettre de définir une zone d'intervention géographique

**Notifications:**
- **FR-040**: Le système DOIT envoyer des notifications pour toutes les nouvelles demandes de réservation
- **FR-041**: Le système DOIT envoyer des rappels de rendez-vous J-1
- **FR-042**: Le système DOIT notifier lors d'annulations clients
- **FR-043**: Le système DOIT notifier lors de réception de paiements
- **FR-044**: Le système DOIT permettre de configurer les préférences de notifications (email, SMS, push)
- **FR-045**: Le système DOIT afficher le taux d'acceptation du prestataire dans ses statistiques

**Gestion du Slug:**
- **FR-046**: Le système DOIT générer automatiquement un slug unique lors de la création d'un compte prestataire (basé sur prénom + nom, normalisé: minuscules, sans accents, espaces en tirets)
- **FR-047**: Le système DOIT gérer les conflits de slug en ajoutant un suffixe numérique incrémental (ex: marie-dupont-2, marie-dupont-3)
- **FR-048**: Le système DOIT permettre au prestataire de visualiser son slug actuel, l'URL complète de réservation, et le nombre de changements restants cette année
- **FR-049**: Le système DOIT permettre au prestataire de modifier son slug avec validation en temps réel
- **FR-050**: Le système DOIT valider le format du slug (a-z, 0-9, tirets uniquement, min 3 caractères, max 50 caractères)
- **FR-051**: Le système DOIT vérifier l'unicité du slug en temps réel lors de la saisie
- **FR-052**: Le système DOIT normaliser automatiquement les saisies (suppression accents, caractères spéciaux, conversion minuscules)
- **FR-053**: Le système DOIT valider le slug contre une liste de mots interdits (profanités, termes réservés: admin, api, www, book, search, login, register, support, help, contact, about, etc.)
- **FR-054**: Le système DOIT fournir un bouton "Copier le lien" pour copier l'URL complète dans le presse-papier
- **FR-055**: Le système DOIT créer une entrée dans slug_history lors du changement de slug (old_slug, new_slug, contractor_id, created_at, expires_at: created_at + 30 jours)
- **FR-056**: Le système DOIT implémenter une redirection 301 de l'ancien slug vers le nouveau pendant 30 jours après modification
- **FR-057**: Le système DOIT retourner une page 404 personnalisée pour les anciens slugs expirés (après 30 jours) avec message explicatif
- **FR-058**: Le système DOIT limiter les changements de slug à 3 par année civile par prestataire
- **FR-059**: Le système DOIT stocker le contractor_id (pas le slug) dans la session de réservation pour éviter les conflits lors de changement de slug en cours de parcours
- **FR-060**: Le système DOIT enregistrer chaque visite sur /book/:slug dans contractor_slug_analytics (contractor_id, slug_used, timestamp, referrer, user_agent, converted: boolean, booking_id: nullable)
- **FR-061**: Le système DOIT calculer et afficher le taux de conversion par slug (nombre de réservations confirmées / nombre de visites uniques)
- **FR-062**: Le système DOIT afficher les statistiques de visite dans le dashboard prestataire (visites totales, visites 30 derniers jours, taux de conversion, top sources de trafic)
- **FR-063**: Le système DOIT permettre aux admins de forcer la modification d'un slug inapproprié avec motif obligatoire
- **FR-064**: Le système DOIT notifier le prestataire par email lorsqu'un admin force la modification de son slug
- **FR-065**: Le système DOIT permettre aux admins de configurer la liste de mots interdits dans le backoffice

### Key Entities

> **Note importante**: Les noms de tables et colonnes ci-dessous sont en français pour faciliter la lecture de la spec. Ils seront traduits en anglais (snake_case) lors de la phase de planification, conformément à la constitution du projet. Les commentaires SQL en français seront ajoutés pour expliquer l'usage des colonnes.

- **Specialty (specialties)**: Spécialité prédéfinie disponible dans le système (nom, catégorie: massage/beauté/santé/autre, description, actif/inactif, ordre d'affichage)
- **Contractor Application (contractor_applications)**: Candidature prestataire (nom, email, téléphone, expérience, spécialités sélectionnées (relation many-to-many avec specialties), zone, motivations, documents uploadés, statut: en_attente/approuvée/refusée, date soumission, commentaires admin, date entretien)
- **Contractor Onboarding Status**: État de l'onboarding du prestataire (compte créé, horaires configurés, Stripe Connect complété, profil complété, pourcentage complétion)
- **Contractor Schedule (appointment_contractor_schedules)**: Horaires de travail du prestataire (jour, heure début, heure fin, récurrence)
- **Unavailability (appointment_unavailabilities)**: Créneaux bloqués par le prestataire (date, heure, raison, récurrence)
- **Booking Request**: Demande de réservation en attente de validation (réservation, date de demande, statut, délai d'expiration)
- **Contractor Profile (contractor_profiles)**: Profil professionnel du prestataire (bio, spécialités, certifications, zone d'intervention, portfolio)
- **Contractor Commission Settings (contractors table)**: Configuration financière du prestataire (commission_rate: taux négocié ex 15.0%, contractor_pays_stripe_fees: boolean indiquant si le prestataire paie les frais Stripe, date_effet, notes_commerciales)
- **Financial Dashboard**: Vue consolidée des finances (CA brut, commission appliquée selon commission_rate, frais Stripe si applicable, montant net transféré, paiements à venir, historique)
- **Contractor Notification (notifications)**: Notification spécifique prestataire (type, contenu, date, lue/non lue, action associée)
- **Stripe Connect Account**: Informations du compte Stripe Connect (account ID, statut onboarding, KYC complété, balance)
- **Contractor Slug (contractors.slug)**: Identifiant unique du prestataire pour URL personnalisée (VARCHAR(50), UNIQUE, NOT NULL, auto-généré à la création, modifiable, format: a-z0-9-, slug_changes_count: INT DEFAULT 0 pour limiter à 3/an, slug_last_changed_at: TIMESTAMP)
- **Slug History (slug_history)**: Historique des changements de slug pour redirections (id, contractor_id, old_slug: VARCHAR(50), new_slug: VARCHAR(50), created_at: TIMESTAMP, expires_at: TIMESTAMP DEFAULT created_at + 30 jours, is_active: BOOLEAN)
- **Contractor Slug Analytics (contractor_slug_analytics)**: Statistiques de visite par slug (id, contractor_id, slug_used: VARCHAR(50), visited_at: TIMESTAMP, referrer: TEXT, user_agent: TEXT, ip_address: VARCHAR(45), session_id: VARCHAR, converted: BOOLEAN DEFAULT false, booking_id: UUID NULLABLE, conversion_timestamp: TIMESTAMP NULLABLE)
- **Forbidden Slugs (platform_config.forbidden_slugs)**: Liste de slugs interdits configurée par admins (JSON array: ["admin", "api", "www", "book", "search", "login", "register", "support", "help", "contact", "about", "dashboard", "settings", "account", "profile", "bookings", "payments", "test", "dev", "staging", "prod", ...])
- **Contractor Services (contractor_services)**: Table de liaison many-to-many définissant explicitement quels services chaque prestataire propose (contractor_id, service_id, is_active: BOOLEAN, custom_price: DECIMAL NULLABLE pour override du prix par défaut, custom_duration: INT NULLABLE, added_at: TIMESTAMP)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Les prestataires peuvent configurer leurs horaires complets en moins de 5 minutes
- **SC-002**: Le temps moyen de réponse à une demande de réservation est inférieur à 2 heures
- **SC-003**: Le taux d'acceptation moyen des prestataires atteint 75% (après onboarding)
- **SC-004**: 95% des prestataires complètent leur onboarding Stripe Connect dans les 7 jours suivant l'inscription
- **SC-005**: Le temps de consultation du planning hebdomadaire est inférieur à 1 seconde
- **SC-006**: 80% des prestataires consultent leur dashboard financier au moins une fois par semaine
- **SC-007**: Le nombre de conflits de planning (doubles réservations) est de 0% grâce aux validations automatiques
- **SC-008**: 90% des prestataires activent les notifications de demandes de réservation
- **SC-009**: Le taux de complétion du profil professionnel (bio + photos) atteint 70%
- **SC-010**: Le délai moyen entre capture de paiement et réception sur compte prestataire respecte les délais Stripe (J+2 à J+7)

## Assumptions

- Les prestataires ont un compte bancaire valide pour Stripe Connect
- Les prestataires peuvent passer la vérification KYC de Stripe (identité, documents)
- Les horaires de travail sont relativement stables (changent rarement)
- Les prestataires consultent leur interface au moins une fois par jour
- Les notifications push web (PWA) sont suffisantes sans app mobile native
- Les prestataires acceptent le délai de réponse de 24h pour les demandes
- Les photos de portfolio sont modérées manuellement par les administrateurs
- Les zones d'intervention sont définies par rayon depuis une adresse de base

## Dependencies

- Spec 002 (Algorithme Disponibilités) pour l'utilisation des horaires et indisponibilités
- Spec 004 (Paiement Stripe) pour la capture automatique lors de l'acceptation
- API Stripe Connect pour l'onboarding et la gestion des paiements prestataires
- API Google Distance Matrix pour calculer les temps de trajet entre rendez-vous
- Supabase Storage pour les photos de profil et portfolio
- Service de notification (Resend, Twilio) pour les alertes temps réel
- Supabase Realtime pour les mises à jour du planning en temps réel

## Out of Scope

- Calendrier synchronisé avec Google Calendar / Outlook (traité dans spec 014)
- Messagerie intégrée avec clients (traité dans spec 009)
- Système d'évaluation et avis (traité dans spec 010)
- Facturation automatique générée pour les prestataires
- Application mobile native pour prestataires
- Tableau de bord analytique avancé (prévisions, tendances)
- Gestion de plusieurs services par prestataire (reste simple pour MVP)
- Système de parrainage entre prestataires
- Formation et ressources pour prestataires (vidéos, guides)
- Support chat en direct intégré dans l'interface
