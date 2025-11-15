# Feature Specification: Service d'Urgence Ready to Go avec Tarification Dynamique

**Feature Branch**: `013-ready-to-go`
**Created**: 2025-11-06
**Updated**: 2025-11-07
**Status**: Draft
**Input**: "Service d'urgence Ready to Go avec 3 paliers d'urgence (Express <1h, Rapide 1h-2h, Aujourd'hui 2h-4h), tarification dynamique configurée au niveau plateforme, transparence totale pour client et prestataire, prestataires volontaires et notifications prioritaires"

## User Scenarios & Testing

### User Story 1 - Réservation Urgente avec 3 Paliers Tarifaires (Priority: P1)

Un client stressé a une réunion importante bientôt et souhaite un massage rapide. Il active le mode "Ready to Go", sélectionne un massage de 60 minutes (80€), et le système lui propose 3 options selon le délai désiré : Express (<1h, +40€), Rapide (1h-2h, +24€), ou Aujourd'hui (2h-4h, +12€). Pour chaque palier, il voit le prix total, la surcharge appliquée, le bonus que le prestataire recevra, et le nombre de prestataires disponibles. Il choisit "Rapide" (104€ total), voit que son prestataire recevra +12€ de bonus, et confirme. Le système recherche uniquement les prestataires Ready to Go disponibles dans ce créneau.

**Why this priority**: C'est la fonctionnalité signature du service Ready to Go. La tarification à 3 paliers offre flexibilité et transparence. Sans la possibilité de réserver en urgence avec choix du délai, le service n'a aucune valeur. MVP absolu.

**Independent Test**: Peut être testé en activant le mode Ready to Go, vérifiant l'affichage des 3 paliers avec tarifs calculés dynamiquement, sélectionnant un palier et vérifiant que seuls les créneaux correspondants sont proposés. Délivre la valeur : "Client obtient un service en urgence au délai souhaité avec transparence tarifaire totale".

**Acceptance Scenarios**:

1. **Given** un client sélectionnant un service de 80€, **When** il active "Mode urgence", **Then** un écran de sélection de palier s'affiche avec 3 options : Express (<1h), Rapide (1h-2h), Aujourd'hui (2h-4h)
2. **Given** un client consultant le palier "Express" pour un service à 80€, **When** les tarifs s'affichent, **Then** il voit "120€ (+40€ de surcharge urgence) | Votre prestataire reçoit +20€ de bonus | 2 prestataires disponibles"
3. **Given** un client consultant le palier "Rapide" pour un service à 80€, **When** les tarifs s'affichent, **Then** il voit "104€ (+24€ de surcharge urgence) | Votre prestataire reçoit +12€ de bonus | 5 prestataires disponibles"
4. **Given** un client consultant le palier "Aujourd'hui" pour un service à 80€, **When** les tarifs s'affichent, **Then** il voit "92€ (+12€ de surcharge urgence) | Votre prestataire reçoit +6€ de bonus | 8 prestataires disponibles"
5. **Given** un client sélectionnant le palier "Rapide", **When** il accède au calendrier, **Then** seuls les créneaux entre 1h et 2h dans le futur sont affichés
6. **Given** aucun prestataire disponible pour le palier "Express", **When** le client le sélectionne, **Then** un message affiche "Aucun prestataire disponible pour ce délai. Essayez 'Rapide' (5 prestataires)" avec boutons pour changer de palier
7. **Given** un client confirmant une réservation "Rapide" à 104€, **When** la réservation est créée, **Then** elle est marquée urgency_level='fast', urgency_surcharge_amount=24€, urgency_contractor_bonus=12€, urgency_platform_revenue=12€
8. **Given** un service avec surcharge spécifique (Coiffure +60% en Express au lieu de +50%), **When** le client consulte les paliers, **Then** le tarif Express affiche la surcharge spécifique : "128€ (+48€)" au lieu du tarif global

---

### User Story 2 - Opt-In Prestataire Simplifié et Disponibilité Temps Réel (Priority: P1)

Un prestataire souhaite participer au service Ready to Go pour augmenter ses revenus grâce aux bonus d'urgence. Il accède à ses paramètres, active simplement l'option "Ready to Go" via un toggle ON/OFF, et configure ses plages horaires d'intervention rapide (lundi-vendredi 10h-18h). Le système lui affiche les bonus potentiels selon les paliers (Express +50% du prix service, Rapide +30%, Aujourd'hui +15%) mais il ne configure RIEN concernant les tarifs - tout est géré au niveau plateforme. Dès qu'il est disponible dans ses plages configurées, ses créneaux apparaissent automatiquement pour les clients cherchant des interventions urgentes, quel que soit le palier.

**Why this priority**: Sans prestataires volontaires, impossible de fournir le service. Le système doit permettre un opt-in ultra-simple (juste ON/OFF + horaires) et respecter les disponibilités. Critical MVP.

**Independent Test**: Peut être testé en activant Ready to Go pour un prestataire, vérifiant que ses créneaux apparaissent dans les 3 paliers de recherche urgente, et que les bonus sont calculés automatiquement. Délivre la valeur : "Prestataires peuvent offrir des interventions rapides sans configuration tarifaire complexe".

**Acceptance Scenarios**:

1. **Given** un prestataire dans ses paramètres, **When** il active "Participer à Ready to Go", **Then** un message explique : "Vous recevrez des bonus selon l'urgence : Express +50%, Rapide +30%, Aujourd'hui +15%. Configurez vos horaires d'intervention rapide."
2. **Given** un prestataire activant Ready to Go, **When** il configure ses horaires (Lu-Ve 10h-18h), **Then** le système enregistre et affiche "Vous êtes Ready to Go lundi-vendredi 10h-18h. Max 10 missions urgentes/semaine."
3. **Given** un prestataire Ready to Go configuré 9h-17h, **When** un client cherche à 15h pour palier "Rapide" (1h-2h), **Then** ce prestataire apparaît s'il a des créneaux libres dans 1h-2h ET qu'il est dans sa plage horaire Ready to Go
4. **Given** un prestataire Ready to Go, **When** un client cherche pour "Express" (<1h), "Rapide" (1h-2h), ou "Aujourd'hui" (2h-4h), **Then** le prestataire apparaît dans TOUS les paliers où il a des créneaux disponibles (pas de configuration par palier)
5. **Given** un prestataire ne participant PAS à Ready to Go, **When** un client cherche en mode urgence, **Then** ce prestataire n'apparaît jamais dans aucun des 3 paliers
6. **Given** un prestataire Ready to Go avec réservation normale se terminant à 14h, **When** il est 13h et un client cherche "Express" (<1h), **Then** les créneaux avant 14h15 ne sont PAS proposés (fin 14h + 15min buffer minimum)
7. **Given** un prestataire ayant déjà accepté 10 missions urgentes cette semaine, **When** il reçoit une 11ème demande urgente, **Then** le système ne lui propose plus (limite max_urgent_per_week atteinte, configurable par admin)
8. **Given** un prestataire Ready to Go consultant son dashboard, **When** il voit ses statistiques, **Then** il voit "Revenus bonus urgence ce mois : +245€ (12 interventions Express/Rapide/Aujourd'hui)"

---

### User Story 3 - Notifications Prioritaires avec Indication du Palier (Priority: P2)

Un client réserve un massage Ready to Go palier "Rapide" (1h-2h) pour dans 1h30. Le système envoie immédiatement une notification push prioritaire au prestataire assigné avec badge "🏃 RAPIDE", affichant le délai, le bonus qu'il recevra (+12€), et le temps de trajet estimé. Le prestataire a 5 minutes pour confirmer, sinon la réservation est automatiquement reassignée à un autre prestataire Ready to Go disponible.

**Why this priority**: Les notifications rapides garantissent que le prestataire est conscient de l'urgence ET du niveau de bonus. Important mais le système fonctionne sans (notifications email standard).

**Independent Test**: Peut être testé en créant une réservation Ready to Go et vérifiant la réception de la notification prioritaire avec le bon palier et bonus affiché. Délivre la valeur : "Prestataire est immédiatement alerté des urgences avec clarté sur le bonus".

**Acceptance Scenarios**:

1. **Given** une réservation "Express" (<1h) créée, **When** elle est assignée au prestataire, **Then** une notification push avec badge "⚡ EXPRESS" affiche "Départ dans 45 min | Bonus +20€ | Trajet 12 min"
2. **Given** une réservation "Rapide" (1h-2h) créée, **When** elle est assignée, **Then** une notification avec badge "🏃 RAPIDE" affiche "Départ dans 1h30 | Bonus +12€ | Trajet 8 min"
3. **Given** une réservation "Aujourd'hui" (2h-4h) créée, **When** elle est assignée, **Then** une notification avec badge "📅 AUJOURD'HUI" affiche "Départ dans 3h | Bonus +6€ | Trajet 15 min"
4. **Given** un prestataire recevant une notification urgente, **When** il ne répond pas dans les 5 minutes, **Then** le système recherche automatiquement un autre prestataire Ready to Go disponible pour ce palier
5. **Given** un prestataire confirmant une urgence "Express", **When** il accepte, **Then** le client reçoit une notification "⚡ Votre prestataire est en route (arrivée estimée 14:35)" avec nom et photo du prestataire
6. **Given** impossible de trouver un prestataire après 3 tentatives, **When** tous refusent ou ne répondent pas, **Then** le client reçoit une notification d'annulation avec remboursement complet + code promo -10% pour compenser

---

### User Story 4 - Filtrage et Vérification Disponibilité Réelle (Priority: P1)

Le système vérifie en temps réel qu'un prestataire peut réellement honorer une intervention <2h : pas de réservation existante trop proche, temps de trajet <30 min vers l'adresse client, pas d'indisponibilité marquée.

**Why this priority**: Évite les promesses impossibles à tenir. Critical pour la fiabilité du service.

**Independent Test**: Peut être testé en simulant différentes situations (prestataire loin, avec réservation proche) et vérifiant les créneaux affichés. Délivre la valeur : "Système garantit que les créneaux proposés sont réalisables".

**Acceptance Scenarios**:

1. **Given** un prestataire à 45 min de trajet du client, **When** le client cherche Ready to Go, **Then** ce prestataire n'apparaît pas (temps trajet trop long)
2. **Given** un prestataire avec réservation se terminant à 14h à 10 min du client, **When** il est 13h30, **Then** un créneau 14h15 peut être proposé (fin 14h + 10min trajet + 5min buffer)
3. **Given** un prestataire ayant marqué une indisponibilité 13h-15h, **When** un client cherche à 13h30, **Then** ce prestataire ne propose pas de créneaux avant 15h
4. **Given** le calcul de trajet échoue (API Google indisponible), **When** le système évalue la disponibilité, **Then** il utilise une estimation prudente (20km = 30min) pour éviter les erreurs

---

### User Story 5 - Configuration Admin des Paliers Tarifaires (Priority: P1)

Un administrateur souhaite ajuster les tarifs Ready to Go pour optimiser la conversion. Il accède au backoffice, section "Ready to Go", et peut modifier les surcharges globales pour chaque palier (Express, Rapide, Aujourd'hui), la répartition prestataire/plateforme, et ajouter des surcharges spécifiques par service (ex: Coiffure +60% en Express au lieu du global +50%). Les modifications sont appliquées immédiatement pour toutes les nouvelles réservations.

**Why this priority**: La plateforme doit pouvoir ajuster la tarification facilement pour tester et optimiser. Sans cela, impossible d'adapter les prix selon la demande. MVP critique.

**Independent Test**: Peut être testé en modifiant une surcharge dans l'admin et vérifiant que les nouveaux clients voient le tarif mis à jour. Délivre la valeur : "Plateforme contrôle et optimise la tarification urgente globalement".

**Acceptance Scenarios**:

1. **Given** un admin accédant à "Configuration > Ready to Go", **When** la page se charge, **Then** il voit 3 sections : Palier Express, Palier Rapide, Palier Aujourd'hui avec leurs surcharges actuelles
2. **Given** un admin modifiant "Express" de 50% à 55%, **When** il enregistre, **Then** tous les nouveaux clients voient +55% pour Express (les réservations existantes conservent l'ancien tarif)
3. **Given** un admin ajoutant une exception "Coiffure complète : Express +65%", **When** il enregistre, **Then** les clients sélectionnant Coiffure voient +65% en Express au lieu du global +55%
4. **Given** un admin modifiant la répartition Express de 50/50 à 60/40 (prestataire/plateforme), **When** il enregistre, **Then** les nouveaux bonus prestataires passent de +25€ à +30€ sur un service à 100€
5. **Given** un admin désactivant le palier "Aujourd'hui", **When** il enregistre, **Then** les clients ne voient plus que 2 paliers : Express et Rapide
6. **Given** un admin consultant les statistiques Ready to Go, **When** il accède au dashboard, **Then** il voit : volume par palier, taux de conversion, revenus plateforme, satisfaction client moyenne

---

### Edge Cases

- **Annulation de dernière minute par client**: Comment gérer les annulations tardives pour les réservations urgentes ? Frais différents selon le palier ?
- **Prestataire en retard**: Que se passe-t-il si le prestataire ne peut pas arriver dans le délai promis ? Quelle compensation pour le client ?
- **Multiples demandes simultanées**: Comment éviter qu'un même créneau soit réservé par plusieurs clients en parallèle ?
- **Mode Ready to Go activé par défaut**: Le mode urgence doit-il rester actif après une réservation ou se désactiver automatiquement ?
- **Changement de disponibilité temps réel**: Que se passe-t-il si le prestataire se marque indisponible pendant qu'un client réserve son créneau ?
- **Zones géographiques exclues**: Comment gérer les quartiers très éloignés qui ne peuvent pas être desservis en urgence ?
- **Client change de palier pendant réservation**: Comment gérer si le client sélectionne "Express" puis change pour "Rapide" en cours de parcours ?
- **Service incompatible urgence**: Comment empêcher les services trop longs (>2h) d'être disponibles en "Express" ?
- **Prestataire accepte puis annule**: Quelle pénalité appliquer si un prestataire confirme une urgence puis annule peu avant ?

## Requirements

### Functional Requirements

**Client - Sélection Palier et Affichage:**
- **FR-001**: Le système DOIT permettre aux clients d'activer le mode "Ready to Go" pour rechercher des interventions urgentes
- **FR-002**: Le système DOIT afficher 3 paliers d'urgence : Express (<1h), Rapide (1h-2h), Aujourd'hui (2h-4h) avec tarifs calculés dynamiquement
- **FR-003**: Le système DOIT lire les surcharges depuis platform_urgency_pricing (table configurée par admin) pour calculer les prix des 3 paliers
- **FR-004**: Le système DOIT afficher pour chaque palier : prix total, surcharge ajoutée, bonus prestataire, nombre de prestataires disponibles
- **FR-005**: Le système DOIT vérifier s'il existe une surcharge spécifique au service (ex: Coiffure +60%) et l'appliquer au lieu de la surcharge globale
- **FR-006**: Le système DOIT afficher uniquement les créneaux correspondant au palier sélectionné (Express: 0-60min, Rapide: 60-120min, Aujourd'hui: 120-240min)
- **FR-007**: Le système DOIT désactiver automatiquement le mode Ready to Go après chaque réservation complétée
- **FR-008**: Le système DOIT afficher un message clair si aucun prestataire n'est disponible pour un palier avec suggestion d'autres paliers

**Prestataire - Opt-In Simplifié:**
- **FR-009**: Le système DOIT permettre aux prestataires d'activer/désactiver leur participation à Ready to Go via un toggle ON/OFF simple
- **FR-010**: Le système DOIT permettre aux prestataires de définir leurs plages horaires d'intervention rapide (jours + heures)
- **FR-011**: Le système DOIT afficher au prestataire les bonus potentiels (Express +X%, Rapide +Y%, Aujourd'hui +Z%) SANS configuration tarifaire de sa part
- **FR-012**: Le système DOIT proposer les prestataires Ready to Go dans TOUS les paliers où ils ont des créneaux disponibles (pas de config par palier)
- **FR-013**: Le système DOIT limiter le nombre de missions urgentes par semaine par prestataire (max_urgent_per_week, défaut: 10)
- **FR-014**: Le système DOIT exclure un prestataire des recherches urgentes une fois sa limite hebdomadaire atteinte

**Algorithme Disponibilité:**
- **FR-015**: Le système DOIT proposer uniquement les prestataires ayant opt-in pour Ready to Go lors des recherches urgentes
- **FR-016**: Le système DOIT vérifier le temps de trajet entre la dernière position connue du prestataire et l'adresse client (<30 min pour Express/Rapide, <45min pour Aujourd'hui)
- **FR-017**: Le système DOIT exclure les prestataires dont le trajet estimé dépasse les limites du palier
- **FR-018**: Le système DOIT respecter un buffer minimum de 15 minutes après la fin d'une réservation existante
- **FR-019**: Le système DOIT vérifier que le prestataire est dans sa plage horaire Ready to Go configurée

**Notifications:**
- **FR-020**: Le système DOIT envoyer une notification push prioritaire avec badge palier (⚡ EXPRESS, 🏃 RAPIDE, 📅 AUJOURD'HUI)
- **FR-021**: Le système DOIT afficher dans la notification : délai, bonus à recevoir, temps de trajet estimé
- **FR-022**: Le système DOIT permettre au prestataire de confirmer ou refuser dans les 5 minutes
- **FR-023**: Le système DOIT reassigner automatiquement à un autre prestataire si aucune réponse dans les 5 minutes
- **FR-024**: Le système DOIT notifier le client avec ETA lorsque le prestataire confirme
- **FR-025**: Le système DOIT annuler et rembourser + code promo compensation si aucun prestataire après 3 tentatives

**Base de Données:**
- **FR-026**: Le système DOIT enregistrer dans bookings : urgency_level, urgency_surcharge_amount, urgency_contractor_bonus, urgency_platform_revenue, urgency_requested_at
- **FR-027**: Le système DOIT calculer urgency_contractor_bonus et urgency_platform_revenue selon la répartition configurée dans platform_urgency_pricing
- **FR-028**: Le système DOIT logger toutes les tentatives Ready to Go dans urgency_analytics (palier, succès/échec, délai réel, satisfaction)

**Admin - Configuration Plateforme:**
- **FR-029**: Le système DOIT permettre aux admins de configurer les 3 paliers dans platform_urgency_pricing (surcharge globale, répartition prestataire/plateforme)
- **FR-030**: Le système DOIT permettre aux admins d'ajouter des surcharges spécifiques par service (ex: Coiffure Express +65% au lieu du global +50%)
- **FR-031**: Le système DOIT permettre aux admins d'activer/désactiver chaque palier globalement
- **FR-032**: Le système DOIT permettre aux admins de marquer certains services comme "urgence désactivée" (services trop longs)
- **FR-033**: Le système DOIT permettre de définir des zones géographiques où Ready to Go est indisponible
- **FR-034**: Le système DOIT afficher un dashboard admin Ready to Go avec : volume par palier, taux de conversion, revenus, satisfaction moyenne

### Key Entities

> **Note importante**: Les noms de tables et colonnes ci-dessous sont déjà en anglais conformément à la constitution du projet. Les commentaires SQL en français seront ajoutés lors de la génération des migrations pour expliquer l'usage des colonnes.

- **Platform Urgency Pricing (platform_urgency_pricing)**: Configuration tarifaire des paliers par la plateforme (id, urgency_level VARCHAR(20) CHECK (urgency_level IN ('express', 'fast', 'today')), min_minutes INT, max_minutes INT, global_surcharge_percent DECIMAL, service_id NULLABLE pour exceptions, service_surcharge_percent DECIMAL NULLABLE, contractor_share_percent DECIMAL, platform_share_percent DECIMAL, is_active BOOLEAN, created_at, updated_at)

- **Contractor Urgency Config (contractor_urgency_config)**: Configuration simple du prestataire (id, contractor_id, is_enabled BOOLEAN, availability_slots JSONB format [{"day": "monday", "start": "10:00", "end": "18:00"}], max_urgent_per_week INT DEFAULT 10, created_at, updated_at)

- **Bookings Extension**: Champs ajoutés à la table bookings (urgency_level VARCHAR(20) CHECK IN ('express', 'fast', 'today') NULLABLE, urgency_surcharge_amount DECIMAL(10,2), urgency_surcharge_percent DECIMAL(5,2), urgency_contractor_bonus DECIMAL(10,2), urgency_platform_revenue DECIMAL(10,2), urgency_requested_at TIMESTAMP)

- **Urgency Analytics (urgency_analytics)**: Logs de toutes les tentatives Ready to Go (id, booking_id NULLABLE, urgency_level VARCHAR(20), requested_at TIMESTAMP, assigned_contractor_id UUID, response_time_seconds INT, status VARCHAR(50) CHECK (status IN ('success', 'timeout', 'no_contractor', 'client_cancel')), actual_arrival_time TIMESTAMP NULLABLE, client_satisfaction_rating INT NULLABLE, created_at)

- **Ready to Go Notification (urgent_notifications)**: Notifications prioritaires envoyées aux prestataires (id, booking_id, contractor_id, urgency_level VARCHAR(20), bonus_amount DECIMAL(10,2), travel_time_minutes INT, sent_at TIMESTAMP, responded_at TIMESTAMP NULLABLE, status VARCHAR(50) CHECK (status IN ('pending', 'confirmed', 'refused', 'timeout')))

- **Ready to Go Zone Restriction (urgency_zone_restrictions)**: Zones géographiques où Ready to Go est désactivé (id, zone_type VARCHAR(50) CHECK (zone_type IN ('postal_code', 'city', 'radius')), zone_value VARCHAR, reason TEXT, is_active BOOLEAN, created_at)

- **Service Urgency Config (dans services table)**: Champs ajoutés à services (urgency_enabled BOOLEAN DEFAULT true, urgency_max_duration_minutes INT NULLABLE pour limiter services longs)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Au moins 25% des prestataires activent Ready to Go dans les 3 mois suivant le lancement
- **SC-002**: Les réservations Ready to Go représentent 8% du volume total après 6 mois (plus élevé grâce aux 3 paliers)
- **SC-003**: Le taux de confirmation par les prestataires atteint 85% tous paliers confondus (15% de timeout/refus)
- **SC-004**: 95% des interventions Express sont honorées dans le délai <1h, 90% des Rapide dans 1h-2h, 85% des Aujourd'hui dans 2h-4h
- **SC-005**: Le revenu moyen par réservation Express est 50% supérieur, Rapide +30%, Aujourd'hui +15% vs réservations standards
- **SC-006**: Le temps moyen entre demande client et confirmation prestataire est inférieur à 3 minutes pour Express, 5 min pour Rapide, 8 min pour Aujourd'hui
- **SC-007**: Le taux de satisfaction client pour Ready to Go dépasse 4.5/5 tous paliers confondus
- **SC-008**: Le taux d'annulation Ready to Go est inférieur à 8% (plus faible car clients plus engagés)
- **SC-009**: Les prestataires Ready to Go actifs reçoivent en moyenne 3-5 demandes urgentes par semaine (augmenté grâce aux 3 paliers)
- **SC-010**: Le système trouve un prestataire disponible pour 85% des demandes Ready to Go (amélioration grâce à la fenêtre élargie jusqu'à 4h)
- **SC-011**: La répartition des réservations par palier est équilibrée : Express 20%, Rapide 45%, Aujourd'hui 35%
- **SC-012**: Le revenu additionnel plateforme grâce à Ready to Go représente +12% du revenu total après 6 mois

## Assumptions

- Les clients sont prêts à payer +30% pour un service en urgence
- Suffisamment de prestataires seront intéressés par les revenus supplémentaires pour activer Ready to Go
- Les estimations de temps de trajet Google Maps sont suffisamment fiables pour garantir arrivée <2h
- Les notifications push sont reçues instantanément par les prestataires (connexion mobile stable)
- Les prestataires consultent régulièrement leur téléphone pendant leurs plages Ready to Go
- Le délai de 5 minutes pour confirmer est suffisant sans être trop court

## Dependencies

- Algorithme de calcul de disponibilités pour vérifier créneaux <2h - dépendance spec 002
- API Google Distance Matrix pour calcul des temps de trajet - dépendance spec 002
- Système de réservation pour appliquer la surcharge - dépendance spec 003
- Notifications push via PWA pour alertes prioritaires - dépendance spec 008
- Système de paiement Stripe pour gérer la surcharge - dépendance spec 004

## Out of Scope

- Tracking GPS en temps réel du prestataire se déplaçant vers le client
- Surge pricing dynamique (augmentation automatique des tarifs selon la demande en temps réel type Uber)
- Mode "Super Urgent" avec intervention <30 minutes et surcharge +70%
- Système de préréservation (bloquer un créneau 15 min sans payer)
- Intégration avec services de taxi/VTC pour prestataires sans véhicule
- Programme de fidélité avec réductions sur surcharges pour clients réguliers urgence
- Priorisation des prestataires avec meilleur taux de confirmation Ready to Go (sera implémenté V2)
- Système d'enchères où prestataires peuvent proposer des bonus plus élevés pour obtenir missions urgentes
- Mode "Flash Sale" où surcharge est réduite pendant certaines heures creuses (ex: -50% le mardi matin)
- Analytics prédictifs : prédire la demande urgente et suggérer aux prestataires d'activer Ready to Go
