# Feature Specification: Système d'Avis et Évaluations

**Feature Branch**: `010-review-rating`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Système complet d'avis et évaluations avec notation 5 étoiles, commentaires clients, réponses prestataires et modération manuelle"

## User Scenarios & Testing

### User Story 1 - Laisser un Avis Après Prestation (Priority: P1)

Un client vient de recevoir un massage à domicile. 24h après la prestation, il reçoit un email l'invitant à laisser un avis. Il accède au formulaire, attribue une note de 5 étoiles, rédige un commentaire positif sur l'expérience et soumet son avis.

**Why this priority**: Les avis clients sont essentiels pour la crédibilité de la plateforme et aident les futurs clients à choisir. Sans système d'avis, impossible de construire la confiance. MVP absolu.

**Independent Test**: Peut être testé en complétant une réservation, attendant la fin de la prestation, puis accédant au formulaire d'avis et soumettant une évaluation. Délivre la valeur : "Clients peuvent partager leur expérience".

**Acceptance Scenarios**:

1. **Given** un client avec prestation terminée depuis 24h, **When** il accède à son historique de réservations, **Then** un bouton "Laisser un avis" apparaît sur la réservation
2. **Given** un client sur le formulaire d'avis, **When** il sélectionne une note de 1 à 5 étoiles, **Then** la note est visuellement mise en évidence
3. **Given** un client ayant sélectionné une note, **When** il rédige un commentaire de 50 à 500 caractères et soumet, **Then** son avis est enregistré avec statut "En attente de modération"
4. **Given** un client ayant déjà laissé un avis, **When** il consulte la réservation, **Then** le bouton "Laisser un avis" est remplacé par "Voir mon avis" (pas de modification après soumission)

---

### User Story 2 - Affichage des Avis sur Profil Prestataire (Priority: P1)

Un potentiel client consulte le profil d'un prestataire avant de réserver. Il voit la note moyenne (4.7/5) calculée sur 42 avis, ainsi que les derniers commentaires de clients vérifiés avec leurs notes individuelles.

**Why this priority**: Les avis influencent directement les décisions de réservation. Sans affichage des avis, le système perd toute sa valeur. Critical pour la conversion.

**Independent Test**: Peut être testé en consultant le profil d'un prestataire et vérifiant l'affichage de la note moyenne et des avis. Délivre la valeur : "Clients peuvent évaluer la qualité d'un prestataire avant de réserver".

**Acceptance Scenarios**:

1. **Given** un prestataire ayant 15 avis, **When** un client consulte son profil, **Then** la note moyenne (ex: 4.6/5) s'affiche en évidence avec le nombre total d'avis
2. **Given** un profil prestataire, **When** la section avis est affichée, **Then** les 5 avis les plus récents apparaissent avec note, commentaire, prénom du client et date
3. **Given** un client consultant les avis, **When** il clique sur "Voir tous les avis", **Then** une page dédiée affiche tous les avis paginés (10 par page)
4. **Given** un prestataire sans aucun avis, **When** son profil est consulté, **Then** un message "Pas encore d'avis" s'affiche avec invitation à être le premier

---

### User Story 3 - Réponse du Prestataire aux Avis (Priority: P2)

Un prestataire reçoit une notification qu'un client a laissé un avis 4 étoiles avec un commentaire constructif. Le prestataire accède à l'avis, le lit et peut publier une réponse publique pour remercier le client et éventuellement clarifier un point.

**Why this priority**: Permet aux prestataires d'interagir avec les retours et montre leur engagement. Important pour l'image mais pas critique pour le MVP initial.

**Independent Test**: Peut être testé en laissant un avis sur un prestataire, puis en se connectant comme ce prestataire et répondant à l'avis. Délivre la valeur : "Prestataires peuvent interagir avec leurs clients et gérer leur réputation".

**Acceptance Scenarios**:

1. **Given** un prestataire avec nouvel avis publié, **When** il consulte ses notifications, **Then** il voit "Nouveau avis reçu de [Client]" avec lien direct
2. **Given** un prestataire consultant un avis, **When** il clique sur "Répondre", **Then** un champ de saisie apparaît avec limite de 300 caractères
3. **Given** un prestataire soumettant une réponse, **When** la réponse est validée, **Then** elle s'affiche publiquement sous l'avis du client avec mention "Réponse du prestataire"
4. **Given** un prestataire ayant déjà répondu, **When** il consulte l'avis, **Then** il peut modifier sa réponse dans les 24h suivant sa publication

---

### User Story 4 - Modération Manuelle des Avis (Priority: P2)

Un client poste un avis contenant des propos diffamatoires ou inappropriés. L'avis entre en file de modération. Un administrateur reçoit une notification, examine l'avis et décide de le rejeter en expliquant la raison au client.

**Why this priority**: Protège les prestataires contre les abus et maintient la qualité des avis. Important mais peut être géré manuellement au début avec peu d'avis.

**Independent Test**: Peut être testé en soumettant un avis, puis en accédant au backoffice admin pour l'approuver ou le rejeter. Délivre la valeur : "Plateforme garantit la qualité et l'authenticité des avis".

**Acceptance Scenarios**:

1. **Given** un avis soumis par un client, **When** il entre dans le système, **Then** son statut est "En attente de modération" et il n'apparaît pas publiquement
2. **Given** un administrateur dans le backoffice, **When** il accède à la file de modération, **Then** tous les avis en attente sont listés avec note, commentaire et détails de la réservation
3. **Given** un administrateur approuvant un avis, **When** il clique sur "Approuver", **Then** l'avis devient public immédiatement et le client reçoit une notification de publication
4. **Given** un administrateur rejetant un avis, **When** il sélectionne une raison (langage inapproprié, contenu non pertinent, etc.), **Then** le client reçoit un email expliquant le rejet

---

### User Story 5 - Vérification des Avis Authentiques (Priority: P1)

Un client consulte les avis d'un prestataire et remarque le badge "Avis vérifié" sur chaque commentaire. Ce badge garantit que l'avis provient d'une réservation réellement effectuée et payée sur la plateforme.

**Why this priority**: La crédibilité des avis repose sur leur authenticité. Sans vérification, risque de faux avis. Critical pour la confiance dans le système.

**Independent Test**: Peut être testé en vérifiant qu'un avis ne peut être laissé que si une réservation a été complétée. Délivre la valeur : "Clients ont confiance dans l'authenticité des avis".

**Acceptance Scenarios**:

1. **Given** un client n'ayant jamais réservé avec un prestataire, **When** il tente de laisser un avis, **Then** le système refuse avec message "Vous devez avoir complété une réservation pour laisser un avis"
2. **Given** un avis publié, **When** il est affiché, **Then** un badge "Avis vérifié" ou checkmark apparaît à côté du nom du client
3. **Given** une réservation annulée par le client, **When** il tente de laisser un avis, **Then** le système refuse l'avis (seules les prestations effectuées sont éligibles)
4. **Given** un client ayant réservé 3 fois avec le même prestataire, **When** il laisse des avis, **Then** il peut laisser un avis par réservation (3 avis au total)

---

### User Story 6 - Filtrage et Tri des Avis (Priority: P3)

Un client consultant un prestataire populaire avec 80 avis souhaite voir en priorité les avis les plus récents ou les plus critiques. Il utilise les filtres pour trier par note (1-5 étoiles) et par date (plus récents en premier).

**Why this priority**: Améliore l'expérience de consultation des avis mais n'est pas essentiel avec peu d'avis. Nice-to-have pour post-MVP.

**Independent Test**: Peut être testé en appliquant des filtres sur une page d'avis et vérifiant que les résultats correspondent. Délivre la valeur : "Clients trouvent facilement les avis les plus pertinents".

**Acceptance Scenarios**:

1. **Given** un client sur la page des avis, **When** il sélectionne le filtre "5 étoiles uniquement", **Then** seuls les avis avec 5 étoiles sont affichés
2. **Given** un client utilisant le tri, **When** il choisit "Plus récents d'abord", **Then** les avis sont réorganisés par date décroissante
3. **Given** un client cherchant un mot-clé, **When** il tape "ponctuel" dans la recherche, **Then** les avis contenant ce mot sont filtrés et mis en évidence
4. **Given** un client appliquant plusieurs filtres, **When** il sélectionne "4-5 étoiles" + "30 derniers jours", **Then** seuls les avis correspondant aux deux critères s'affichent

---

### Edge Cases

- **Avis multiples pour même réservation**: Un client tente de laisser 2 avis pour la même prestation. Le système doit bloquer le second.
- **Modification après modération**: Un client approuvé veut modifier son avis. Interdire les modifications post-publication pour maintenir l'intégrité.
- **Prestataire se notant lui-même**: Un prestataire crée un faux compte client pour se laisser un avis positif. Détection via analyses de patterns (IP, timing, etc.).
- **Note sans commentaire**: Un client veut laisser juste 5 étoiles sans texte. Autoriser ou forcer un minimum de caractères ?
- **Suppression de compte avec avis**: Si un client supprime son compte, ses avis restent-ils publiés ? Anonymiser le nom mais garder l'avis.
- **Prestation très ancienne**: Un client peut-il laisser un avis 6 mois après la prestation ? Définir une fenêtre d'éligibilité (ex: 30 jours).
- **Avis en masse (brigade)**: Un groupe laisse simultanément 20 avis négatifs sur un prestataire. Système de détection d'activité suspecte nécessaire.
- **Note moyenne avec peu d'avis**: Un prestataire avec 1 seul avis 5 étoiles affiche 5/5. Indiquer clairement le nombre d'avis pour contexte.

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre aux clients ayant complété une réservation de laisser un avis uniquement sur cette réservation
- **FR-002**: Le système DOIT limiter à un avis par réservation (pas de duplicatas)
- **FR-003**: Le système DOIT permettre d'attribuer une note de 1 à 5 étoiles (par paliers d'une étoile)
- **FR-004**: Le système DOIT permettre d'ajouter un commentaire textuel avec minimum 50 et maximum 500 caractères
- **FR-005**: Le système DOIT afficher un badge "Avis vérifié" sur tous les avis provenant de réservations confirmées
- **FR-006**: Le système DOIT calculer automatiquement la note moyenne du prestataire à partir de tous ses avis publiés
- **FR-007**: Le système DOIT afficher le nombre total d'avis reçus par le prestataire
- **FR-008**: Le système DOIT afficher les avis sur le profil du prestataire par ordre chronologique décroissant (plus récents en premier)
- **FR-009**: Le système DOIT mettre tous les nouveaux avis en statut "En attente de modération"
- **FR-010**: Le système DOIT permettre aux administrateurs d'approuver ou rejeter les avis en attente
- **FR-011**: Le système DOIT notifier le client lorsque son avis est approuvé ou rejeté
- **FR-012**: Le système DOIT permettre au prestataire de répondre publiquement à un avis
- **FR-013**: Le système DOIT limiter la réponse du prestataire à 300 caractères maximum
- **FR-014**: Le système DOIT permettre au prestataire de modifier sa réponse dans les 24h suivant sa publication
- **FR-015**: Le système DOIT afficher la réponse du prestataire sous l'avis client avec mention claire
- **FR-016**: Le système DOIT limiter la possibilité de laisser un avis à une fenêtre de 30 jours après la prestation
- **FR-017**: Le système DOIT envoyer un email automatique au client 24h après la prestation l'invitant à laisser un avis
- **FR-018**: Le système DOIT permettre le filtrage des avis par note (1 à 5 étoiles)
- **FR-019**: Le système DOIT permettre le tri des avis (plus récents, plus anciens, note croissante, décroissante)
- **FR-020**: Le système DOIT permettre la recherche par mot-clé dans les commentaires d'avis
- **FR-021**: Le système DOIT paginer l'affichage des avis (10 avis par page)
- **FR-022**: Le système DOIT afficher les avis avec le prénom du client (anonymisation du nom complet)
- **FR-023**: Le système DOIT afficher la date de publication de chaque avis
- **FR-024**: Le système DOIT empêcher la modification d'un avis après sa publication
- **FR-025**: Le système DOIT conserver les avis même si le compte client est supprimé (anonymisation)

### Key Entities

- **Review (reviews)**: Représente un avis client (note sur 5, commentaire texte, date de création, statut de modération, booking_id, client_id, contractor_id)
- **Review Response (review_responses)**: Réponse du prestataire à un avis (texte, date de publication, date de modification, review_id, contractor_id)
- **Moderation Decision (review_moderation)**: Décision de modération (avis approuvé/rejeté, raison du rejet, modérateur, date de décision)
- **Contractor Rating Aggregate**: Note moyenne calculée et nombre total d'avis par prestataire (mis à jour à chaque publication d'avis)
- **Review Invitation**: Invitation envoyée au client pour laisser un avis (booking_id, sent_date, status: pending/completed)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Au moins 40% des clients ayant complété une réservation laissent un avis dans les 7 jours
- **SC-002**: Le temps moyen de modération d'un avis est inférieur à 24 heures
- **SC-003**: Moins de 5% des avis soumis sont rejetés par la modération
- **SC-004**: 80% des prestataires ayant reçu un avis y répondent dans les 48 heures
- **SC-005**: La note moyenne globale de la plateforme est supérieure à 4.0/5
- **SC-006**: Les profils avec avis ont un taux de conversion 3x supérieur aux profils sans avis
- **SC-007**: Le taux d'avis frauduleux détectés et rejetés est inférieur à 2%
- **SC-008**: Les clients consultent en moyenne 12 avis avant de procéder à une réservation
- **SC-009**: 90% des avis soumis contiennent un commentaire texte (pas seulement une note)
- **SC-010**: Le système affiche les avis en moins de 1 seconde même pour des profils avec 200+ avis

## Assumptions

- Les clients sont honnêtes et laissent des avis reflétant leur expérience réelle
- Le volume d'avis au lancement sera faible, permettant une modération manuelle
- Les prestataires comprennent l'importance des avis et encouragent les clients à en laisser
- La fenêtre de 30 jours pour laisser un avis est suffisante pour la majorité des clients
- Les notifications email d'invitation aux avis ont un taux d'ouverture raisonnable (>20%)
- La modération manuelle peut être effectuée quotidiennement par l'équipe admin

## Dependencies

- Service email (Resend) pour envoyer les invitations aux avis et notifications - dépendance spec 001
- Système de notifications pour alerter prestataires et admins - dépendance spec 009
- Système de réservations pour vérifier l'éligibilité à laisser un avis - dépendance spec 003
- Profils prestataires pour afficher les avis - dépendance spec 007

## Out of Scope

- Avis vidéo ou photo (uniquement texte et note)
- Notation détaillée par critères (ponctualité, qualité, propreté séparément)
- Système de récompenses pour les clients laissant des avis
- Import d'avis depuis d'autres plateformes (Google, Facebook)
- Signalement d'avis par les utilisateurs (seulement modération admin)
- Analyse de sentiment automatique des commentaires
- Tableau de bord analytique détaillé des avis pour les prestataires
- Réponse automatique ou suggestions de réponses pour les prestataires
- Avis anonymes (tous les avis doivent être vérifiés et nominatifs)
