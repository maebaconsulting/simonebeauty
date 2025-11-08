# Feature Specification: Algorithme de Calcul des Disponibilités

**Feature Branch**: `002-availability-calculator`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Algorithme intelligent de calcul des disponibilités en temps réel avec contraintes multiples: horaires de travail, indisponibilités, réservations existantes, temps de trajet entre rendez-vous et buffers de préparation"

## User Scenarios & Testing

### User Story 1 - Affichage des Créneaux Basés sur Horaires de Travail (Priority: P1)

Un client sélectionne un service de massage à domicile et renseigne son adresse. Le système doit lui présenter uniquement les créneaux horaires pendant lesquels le prestataire assigné travaille habituellement (par exemple, lundi-vendredi 9h-18h).

**Why this priority**: Sans cette fonctionnalité de base, aucun créneau ne peut être proposé. C'est le socle minimal : respecter les horaires de travail définis par les prestataires. MVP absolu.

**Independent Test**: Peut être testé en configurant les horaires d'un prestataire (ex: 9h-17h) et vérifiant que seuls ces créneaux apparaissent dans le calendrier. Délivre la valeur : "Client voit les créneaux quand le prestataire est disponible".

**Acceptance Scenarios**:

1. **Given** un prestataire configuré pour travailler lundi-vendredi 9h-18h, **When** un client consulte les disponibilités un mardi, **Then** seuls les créneaux entre 9h et 18h sont affichés
2. **Given** un prestataire ne travaillant pas le dimanche, **When** un client consulte les disponibilités un dimanche, **Then** aucun créneau n'est proposé ce jour-là
3. **Given** un prestataire avec horaires variables (9h-13h le lundi, 14h-20h le mardi), **When** un client consulte chaque jour, **Then** les créneaux correspondent exactement aux horaires définis pour chaque jour
4. **Given** plusieurs prestataires avec horaires différents, **When** le système cherche une disponibilité, **Then** chaque prestataire voit ses propres horaires respectés

---

### User Story 2 - Exclusion des Indisponibilités et Réservations Existantes (Priority: P1)

Un client consulte les disponibilités d'un prestataire qui a déjà 3 réservations confirmées dans la journée et a bloqué sa pause déjeuner (12h-14h) comme indisponible. Le système ne doit afficher que les créneaux réellement libres.

**Why this priority**: Critique pour éviter les doubles réservations et respecter les pauses du prestataire. Sans cela, le système génère des conflits et dégrade la fiabilité perçue.

**Independent Test**: Peut être testé en créant des réservations existantes et des indisponibilités, puis vérifiant qu'elles n'apparaissent pas dans les créneaux proposés. Délivre la valeur : "Pas de double réservation, le prestataire a ses pauses respectées".

**Acceptance Scenarios**:

1. **Given** un prestataire avec réservation de 10h à 11h30, **When** un client consulte les disponibilités, **Then** aucun créneau entre 10h et 11h30 n'est proposé
2. **Given** un prestataire ayant marqué 12h-14h comme indisponible (pause déjeuner), **When** un client consulte les créneaux, **Then** aucun créneau pendant cette période n'apparaît
3. **Given** un prestataire avec 4 réservations consécutives de 9h à 17h, **When** un client consulte ce jour-là, **Then** seuls les créneaux après 17h (si horaires de travail le permettent) sont affichés
4. **Given** un prestataire ayant synchronisé son calendrier externe Google Calendar avec un événement personnel, **When** le système calcule les disponibilités, **Then** cet événement externe est traité comme une indisponibilité

---

### User Story 3 - Optimisation avec Temps de Trajet (Priority: P2)

Un client à Paris 15ème demande un massage à 14h. Le prestataire a déjà une réservation à Paris 8ème qui se termine à 13h. Le système doit calculer le temps de trajet estimé (30 minutes via Google Distance Matrix) et ne proposer le créneau de 14h que si le trajet est réalisable.

**Why this priority**: Différenciateur clé de la plateforme. Optimise les tournées des prestataires et garantit la ponctualité. N'est pas MVP mais essentiel pour la qualité de service premium.

**Independent Test**: Peut être testé en créant 2 réservations à distances différentes et vérifiant que le système bloque les créneaux impossibles selon le temps de trajet. Délivre la valeur : "Prestataire arrive toujours à l'heure, revenus optimisés".

**Acceptance Scenarios**:

1. **Given** un prestataire avec réservation se terminant à 13h à 10km de la prochaine adresse potentielle, **When** le temps de trajet estimé est 25 minutes, **Then** le système ne propose pas de créneaux avant 13h30 (13h + 25min + buffer)
2. **Given** deux adresses très proches (<5 min de trajet), **When** un client demande un créneau juste après une réservation existante, **Then** le créneau est proposé avec un délai minimal (durée service + 5min trajet + buffer)
3. **Given** des conditions de trafic variables, **When** le système calcule les trajets, **Then** il utilise les estimations de trafic en temps réel de Google Maps
4. **Given** un prestataire avec 5 réservations dans la journée à différents endroits, **When** le système optimise la tournée, **Then** les créneaux proposés forment un itinéraire logique minimisant les trajets

---

### User Story 4 - Temps Tampon de Préparation (Priority: P2)

Un prestataire a besoin de 15 minutes entre deux prestations pour ranger son matériel, se préparer et potentiellement prendre une pause courte. Le système doit automatiquement insérer ce buffer entre chaque réservation.

**Why this priority**: Essentiel pour la qualité de service et le bien-être du prestataire. Évite l'épuisement et garantit que chaque client reçoit un service de qualité. Important mais pas critique MVP.

**Independent Test**: Peut être testé en réservant deux prestations consécutives et vérifiant qu'un délai minimum les sépare. Délivre la valeur : "Prestataire a le temps de se préparer entre chaque client".

**Acceptance Scenarios**:

1. **Given** un buffer configuré à 15 minutes, **When** une réservation se termine à 14h, **Then** le prochain créneau disponible proposé est au plus tôt à 14h15
2. **Given** différents types de services avec buffers variables (10 min pour soin rapide, 20 min pour massage long), **When** le système calcule les disponibilités, **Then** le buffer approprié est appliqué selon le type de service précédent
3. **Given** un prestataire qui préfère un buffer de 20 minutes au lieu du standard 15 minutes, **When** ses disponibilités sont calculées, **Then** son buffer personnalisé est respecté
4. **Given** une journée complète avec 6 réservations, **When** les créneaux sont optimisés, **Then** chaque réservation inclut son buffer sans compromettre la capacité journalière du prestataire

---

### User Story 5 - Calcul en Temps Réel Multi-Contraintes (Priority: P1)

Un client demande les disponibilités pour un service de 90 minutes dans 3 jours. Le système doit instantanément calculer et afficher les créneaux en intégrant TOUTES les contraintes : horaires, indisponibilités, réservations, trajets et buffers.

**Why this priority**: C'est l'orchestration de toutes les contraintes précédentes. Le cœur de l'algorithme. Sans cela, les user stories 1-4 ne servent à rien. C'est le moteur du système.

**Independent Test**: Peut être testé en créant un scénario complexe (prestataire avec plusieurs réservations, indisponibilités, à différents endroits) et vérifiant que les créneaux proposés respectent TOUTES les contraintes simultanément. Délivre la valeur : "Client voit uniquement les créneaux 100% réalisables".

**Acceptance Scenarios**:

1. **Given** un prestataire avec planning complexe (3 réservations, 2 indisponibilités, horaires 9h-19h), **When** un client demande les disponibilités, **Then** le système affiche les créneaux en moins de 2 secondes en respectant toutes les contraintes
2. **Given** 5 clients demandant simultanément les disponibilités du même prestataire, **When** le système traite ces requêtes, **Then** chaque client voit les créneaux disponibles à l'instant T sans conflits
3. **Given** un client modifiant l'adresse de service, **When** il consulte à nouveau les disponibilités, **Then** les créneaux sont recalculés instantanément avec les nouveaux temps de trajet
4. **Given** un prestataire qui vient de recevoir une nouvelle réservation, **When** un autre client consulte les disponibilités, **Then** le créneau nouvellement réservé n'apparaît plus dans les options

---

### Edge Cases

- **Prestataire sans horaires configurés**: Que se passe-t-il si un prestataire n'a pas encore défini ses horaires de travail ? Le système doit afficher un message clair au lieu de tout bloquer.
- **Jour férié non configuré**: Comment le système gère-t-il un jour férié national ? Doit-il bloquer automatiquement ou laisser le prestataire décider ?
- **Service plus long que plage horaire restante**: Si un client demande un service de 120 minutes à 17h alors que le prestataire termine à 18h, le créneau ne doit pas être proposé.
- **Trajet impossible à calculer**: Si l'API Google Maps échoue ou retourne une erreur, le système doit avoir un fallback (estimation générique ou exclusion du créneau).
- **Multiples prestataires qualifiés**: Lorsque plusieurs prestataires peuvent fournir le service, comment le système choisit-il lequel proposer en priorité ? (Distance, charge de travail, rating)
- **Changement de fuseau horaire**: Si le prestataire et le client sont dans des fuseaux différents, tous les calculs doivent être en heure locale du service.
- **Synchronisation calendrier externe en retard**: Si Google Calendar n'a pas encore synchronisé un nouvel événement, le système peut proposer un créneau déjà occupé (comment gérer cette race condition ?).
- **Buffer cumulatif vs. buffer maximum**: Si deux services consécutifs ont chacun un buffer de 15 min, faut-il appliquer 30 min ou maximum 15 min ?

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT récupérer les horaires de travail configurés pour chaque prestataire (jours de la semaine et plages horaires)
- **FR-002**: Le système DOIT exclure des créneaux disponibles tous les jours où le prestataire ne travaille pas
- **FR-003**: Le système DOIT récupérer toutes les réservations confirmées du prestataire pour la période demandée
- **FR-004**: Le système DOIT exclure les créneaux correspondant aux réservations existantes (heure de début à heure de fin)
- **FR-005**: Le système DOIT récupérer toutes les indisponibilités manuellement saisies par le prestataire
- **FR-006**: Le système DOIT synchroniser et récupérer les événements des calendriers externes connectés (Google Calendar)
- **FR-007**: Le système DOIT traiter les événements de calendrier externe comme des indisponibilités bloquantes
- **FR-008**: Le système DOIT calculer le temps de trajet estimé entre l'adresse de la dernière réservation et l'adresse demandée
- **FR-009**: Le système DOIT utiliser l'API Google Distance Matrix pour obtenir les estimations de trajet en temps réel
- **FR-010**: Le système DOIT bloquer les créneaux où le prestataire ne peut pas arriver à temps compte tenu du trajet
- **FR-011**: Le système DOIT appliquer un temps tampon (buffer) configurable après chaque réservation
- **FR-012**: Le système DOIT permettre de configurer des buffers différents selon le type de service
- **FR-013**: Le système DOIT calculer les créneaux disponibles en temps réel à chaque requête (pas de cache statique)
- **FR-014**: Le système DOIT retourner les résultats de disponibilité en moins de 3 secondes
- **FR-015**: Le système DOIT gérer les requêtes concurrentes de disponibilités sans générer de conflits
- **FR-016**: Le système DOIT proposer uniquement des créneaux où la durée du service peut être complétée avant la fin des horaires de travail
- **FR-017**: Le système DOIT arrondir les créneaux proposés à des intervalles de 15 ou 30 minutes (configurable)
- **FR-018**: Le système DOIT permettre de filtrer les disponibilités par plage de dates (ex: prochains 7 jours, 30 jours)
- **FR-019**: Le système DOIT gérer correctement les fuseaux horaires (tous les calculs en heure locale du service)
- **FR-020**: Le système DOIT fournir un message clair si aucun créneau n'est disponible sur la période demandée

### Key Entities

- **Contractor Schedule (appointment_contractor_schedules)**: Représente les horaires de travail réguliers d'un prestataire (jour de la semaine, heure de début, heure de fin, récurrence)
- **Unavailability (appointment_unavailabilities)**: Représente les périodes d'indisponibilité ponctuelles ou récurrentes (dates, heures, raison, source: manuelle ou calendrier externe)
- **Booking (appointment_bookings)**: Représente une réservation confirmée (date, heure de début, heure de fin, adresse, service, prestataire)
- **Time Slot**: Créneau horaire potentiellement disponible calculé dynamiquement (date, heure de début, heure de fin, prestataire, statut de disponibilité)
- **Travel Time Estimation**: Estimation du temps de trajet entre deux adresses (adresse de départ, adresse d'arrivée, durée en minutes, horodatage du calcul)
- **Buffer Configuration**: Configuration des temps tampons (durée en minutes, type de service associé, applicable à quel type de prestataire)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Le système calcule et affiche les créneaux disponibles en moins de 2 secondes pour 95% des requêtes
- **SC-002**: Le taux de double réservation est de 0% (aucun créneau déjà réservé n'est proposé)
- **SC-003**: Les prestataires arrivent à l'heure pour 90% des rendez-vous grâce au calcul des temps de trajet
- **SC-004**: Le nombre de créneaux proposés augmente de 25% grâce à l'optimisation des tournées (vs. système sans calcul de trajet)
- **SC-005**: Les prestataires peuvent gérer 15% de réservations supplémentaires par jour grâce à l'optimisation des buffers et trajets
- **SC-006**: Le taux d'annulation de dernière minute par les prestataires diminue de 50% (plus de conflits logistiques)
- **SC-007**: Le temps moyen de recherche d'un créneau par un client est réduit de 60% grâce à l'affichage intelligent
- **SC-008**: Le système gère au moins 500 calculs de disponibilités simultanés sans dégradation
- **SC-009**: Les indisponibilités synchronisées depuis calendriers externes sont prises en compte dans les 5 minutes suivant leur création
- **SC-010**: 95% des clients trouvent un créneau qui leur convient dans les 7 prochains jours

## Assumptions

- L'API Google Distance Matrix est disponible et fonctionnelle pour calculer les trajets
- Les prestataires ont correctement configuré leurs horaires de travail dans le système
- Les estimations de temps de trajet de Google sont suffisamment précises (marge d'erreur acceptable: ±10%)
- Le buffer standard de 15 minutes entre prestations est adapté à la majorité des services
- Les prestataires synchronisent leurs calendriers externes s'ils utilisent cette fonctionnalité
- La latence réseau pour les appels API externes (Google Maps) est inférieure à 1 seconde
- Les créneaux de 15 ou 30 minutes conviennent à la granularité attendue par les utilisateurs

## Dependencies

- API Google Distance Matrix pour les calculs de temps de trajet
- API Google Calendar pour la synchronisation des calendriers externes
- Base de données PostgreSQL avec tables appointment_* (schedules, unavailabilities, bookings)
- Service de géolocalisation pour normaliser les adresses
- Edge Function ou service backend capable de traiter les calculs complexes en temps réel

## Out of Scope

- Interface utilisateur pour afficher les créneaux (traité dans spec 003 - Parcours Réservation)
- Configuration des horaires de travail par les prestataires (traité dans spec 007 - Interface Prestataire)
- Système de notification quand de nouveaux créneaux deviennent disponibles
- Intelligence artificielle pour prédire les meilleurs créneaux à proposer en priorité
- Optimisation multi-prestataires (proposer le meilleur prestataire selon plusieurs critères)
- Gestion des préférences de créneaux des clients (matin vs. après-midi)
- Système de file d'attente si aucun créneau n'est disponible
- Réservation de créneaux temporaires pendant le parcours de réservation (panier)
