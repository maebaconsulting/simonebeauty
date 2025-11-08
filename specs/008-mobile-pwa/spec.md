# Feature Specification: Optimisation Mobile et Progressive Web App

**Feature Branch**: `008-mobile-pwa`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Optimisation mobile complète et Progressive Web App avec design responsive, performance optimale, fonctionnalités offline et installation sur écran d'accueil"

## User Scenarios & Testing

### User Story 1 - Design Mobile-First Responsive (Priority: P1)

Un client utilisant un smartphone consulte la plateforme Simone pour réserver un service. L'interface s'adapte parfaitement à la taille de son écran avec une navigation tactile optimisée, des éléments cliquables suffisamment grands et une hiérarchie visuelle claire.

**Why this priority**: Plus de 70% des utilisateurs accèdent aux plateformes de services depuis leur mobile. Sans interface mobile optimale, la majorité des utilisateurs auront une expérience dégradée. C'est le MVP absolu pour toute application moderne.

**Independent Test**: Peut être testé en accédant à la plateforme depuis différents smartphones et vérifiant que tous les éléments sont lisibles, accessibles et utilisables sans zoom. Délivre la valeur : "Client peut utiliser toute la plateforme sur mobile aussi facilement que sur desktop".

**Acceptance Scenarios**:

1. **Given** un client sur smartphone (320px à 428px de large), **When** il accède à n'importe quelle page, **Then** le contenu s'adapte sans scroll horizontal et tous les textes sont lisibles sans zoom
2. **Given** un client sur tablette (768px à 1024px), **When** il navigue sur la plateforme, **Then** l'interface utilise une mise en page optimisée tablette avec colonnes adaptées
3. **Given** un client tapant sur un bouton d'action, **When** la zone de toucher est inférieure à 44x44px, **Then** une zone de clic étendue garantit une activation facile
4. **Given** un client faisant défiler une longue liste, **When** il utilise le scroll tactile, **Then** le défilement est fluide à 60 fps sans saccades

---

### User Story 2 - Installation sur Écran d'Accueil (Priority: P1)

Un client régulier souhaite accéder rapidement à la plateforme Simone. Le navigateur lui propose automatiquement d'installer l'application sur son écran d'accueil. Une fois installée, l'app se lance en plein écran sans la barre d'URL du navigateur.

**Why this priority**: Améliore drastiquement l'engagement et la rétention. Les PWA installées ont un taux de réengagement 3x supérieur. C'est la fonctionnalité signature d'une PWA.

**Independent Test**: Peut être testé en visitant la plateforme 2-3 fois puis vérifiant l'apparition du prompt d'installation et la capacité à ajouter à l'écran d'accueil. Délivre la valeur : "Client peut utiliser Simone comme une app native".

**Acceptance Scenarios**:

1. **Given** un client visitant la plateforme pour la 2ème fois, **When** les critères PWA sont remplis, **Then** un prompt natif propose d'installer l'application
2. **Given** un client acceptant l'installation, **When** l'app est ajoutée à l'écran d'accueil, **Then** une icône branded avec le logo Simone apparaît
3. **Given** un client ouvrant l'app depuis l'écran d'accueil, **When** elle se lance, **Then** elle s'affiche en plein écran (standalone mode) sans UI du navigateur
4. **Given** une app installée, **When** le client la ferme et la rouvre, **Then** elle reprend exactement où il s'était arrêté (state persistence)

---

### User Story 3 - Fonctionnalités Offline et Cache (Priority: P2)

Un client consulte des services et sa connexion Internet se coupe temporairement dans le métro. Grâce au service worker, les pages déjà visitées restent accessibles et il peut continuer à naviguer dans le catalogue consulté précédemment.

**Why this priority**: Améliore significativement l'expérience dans les zones à connectivité instable. Différenciateur important mais pas critique pour le MVP initial.

**Independent Test**: Peut être testé en naviguant sur plusieurs pages, activant le mode avion, puis vérifiant que les pages visitées restent accessibles. Délivre la valeur : "Client peut consulter le contenu même sans connexion".

**Acceptance Scenarios**:

1. **Given** un client ayant visité 5 pages de services, **When** sa connexion Internet est coupée, **Then** il peut continuer à naviguer sur ces 5 pages en mode offline
2. **Given** un client offline tentant d'accéder à une page non mise en cache, **When** il clique sur un lien, **Then** une page offline gracieuse s'affiche expliquant la situation
3. **Given** un client offline ayant consulté son profil, **When** il revoit ses informations, **Then** les données en cache sont affichées avec un indicateur "Données hors ligne"
4. **Given** un client redevenu online après une période offline, **When** il rafraîchit une page, **Then** le contenu est automatiquement mis à jour avec les dernières données

---

### User Story 4 - Performance Optimale Mobile (<3s Load Time) (Priority: P1)

Un client sur réseau 4G consulte la page d'accueil de Simone. La page se charge complètement en moins de 3 secondes avec les images optimisées, le CSS critique inline et les ressources non essentielles chargées en différé.

**Why this priority**: Chaque seconde de chargement supplémentaire réduit la conversion de 7%. Sur mobile avec connexions variables, la performance est critique pour la rétention.

**Independent Test**: Peut être testé avec Lighthouse sur un réseau throttled 4G et vérifiant un score >90 et un LCP <2.5s. Délivre la valeur : "Client accède au contenu quasi instantanément".

**Acceptance Scenarios**:

1. **Given** un client sur connexion 4G simulée, **When** il charge la page d'accueil, **Then** le First Contentful Paint (FCP) survient en moins de 1.8 secondes
2. **Given** un client chargeant une page de service, **When** les métriques sont mesurées, **Then** le Largest Contentful Paint (LCP) est inférieur à 2.5 secondes
3. **Given** un client interagissant avec un bouton, **When** il clique, **Then** le First Input Delay (FID) est inférieur à 100ms
4. **Given** un client faisant défiler la page, **When** le contenu se charge, **Then** le Cumulative Layout Shift (CLS) est inférieur à 0.1 (pas de sauts visuels)

---

### User Story 5 - UI Tactile Optimisée (Priority: P2)

Un client sur mobile interagit avec des formulaires, calendriers et menus. Tous les éléments sont optimisés pour le tactile : sélecteurs de date natifs, menus contextuels adaptés, gestures swipe supportées.

**Why this priority**: Améliore significativement l'UX mobile mais l'app reste fonctionnelle avec des contrôles standard. Important pour la satisfaction utilisateur.

**Independent Test**: Peut être testé en parcourant le flow de réservation complet sur mobile et vérifiant que tous les contrôles sont tactiles-friendly. Délivre la valeur : "Client peut accomplir toutes les actions facilement au doigt".

**Acceptance Scenarios**:

1. **Given** un client sélectionnant une date, **When** il tape sur le champ date, **Then** un picker de date natif mobile s'affiche au lieu d'un calendrier desktop
2. **Given** un client naviguant dans une galerie de photos, **When** il effectue un swipe horizontal, **Then** il peut faire défiler les images avec un geste fluide
3. **Given** un client sur un champ de saisie, **When** il tape, **Then** le clavier virtuel affiche le type approprié (numérique pour téléphone, email pour email)
4. **Given** un client tapant sur un menu, **When** le menu déroulant s'ouvre, **Then** les éléments ont une hauteur minimum de 48px pour faciliter la sélection

---

### User Story 6 - Notifications Push (Priority: P3)

Un client ayant installé la PWA et accepté les notifications reçoit une alerte push lorsque son prestataire confirme sa réservation ou lui envoie un message, même si l'app n'est pas ouverte.

**Why this priority**: Puissant levier de réengagement et améliore la communication. Nice-to-have qui peut être ajouté post-MVP.

**Independent Test**: Peut être testé en installant la PWA, acceptant les notifications et déclenchant une action (confirmation réservation) pour vérifier la réception de la notification. Délivre la valeur : "Client est notifié en temps réel sans avoir l'app ouverte".

**Acceptance Scenarios**:

1. **Given** un client installant la PWA, **When** il accède pour la première fois, **Then** un prompt discret demande l'autorisation pour les notifications
2. **Given** un client ayant accepté les notifications, **When** son prestataire confirme sa réservation, **Then** il reçoit une notification push même si l'app est fermée
3. **Given** un client tapant sur une notification, **When** elle s'ouvre, **Then** l'app se lance directement sur la page concernée (deep linking)
4. **Given** un client ayant refusé les notifications, **When** il change d'avis, **Then** il peut les réactiver depuis les paramètres de son profil

---

### Edge Cases

- **Versions iOS vs Android**: Les PWA ont des capacités différentes selon l'OS. iOS a des limitations (pas de notifications push sur iOS <16.4). Gérer gracieusement avec feature detection.
- **App installée puis désinstallée**: Si le client désinstalle puis réinstalle, ses données locales sont perdues. Comment récupérer l'état depuis le serveur ?
- **Service worker bloqué par cache invalide**: Si une ancienne version du SW est en cache, comment forcer la mise à jour sans perdre les données offline ?
- **Espace de stockage plein**: Que se passe-t-il si le cache offline atteint la limite du quota de stockage du navigateur ? Stratégie d'éviction nécessaire.
- **Rotation écran pendant interaction**: Le client tourne son téléphone de portrait à paysage pendant une action. L'interface doit se réorganiser sans perte de contexte.
- **Très petit écran (<360px)**: Certains vieux smartphones ont des écrans très petits. Définir une largeur minimum supportée ou adapter drastiquement.
- **Connexion lente mais stable**: Client sur 2G/3G lent. Prioriser le chargement du contenu critique et afficher des placeholders pour le reste.
- **Battery saver mode**: Certains navigateurs limitent les fonctionnalités en mode économie d'énergie. Détecter et adapter le comportement.

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT implémenter un design responsive avec breakpoints mobile (320-767px), tablette (768-1023px) et desktop (1024px+)
- **FR-002**: Le système DOIT garantir que tous les éléments interactifs ont une zone de toucher minimum de 44x44px sur mobile
- **FR-003**: Le système DOIT utiliser des unités relatives (rem, em, %) plutôt qu'absolues (px) pour les tailles de texte
- **FR-004**: Le système DOIT fournir un fichier manifest.json valide avec nom, icônes, couleurs de thème et display mode standalone
- **FR-005**: Le système DOIT fournir des icônes d'application en multiple tailles (192x192, 512x512 minimum)
- **FR-006**: Le système DOIT servir l'application via HTTPS (requis pour PWA)
- **FR-007**: Le système DOIT implémenter un service worker pour gérer le cache et les requêtes offline
- **FR-008**: Le système DOIT afficher le prompt d'installation PWA après 2-3 visites de l'utilisateur
- **FR-009**: Le système DOIT permettre le lancement en mode standalone (plein écran sans UI navigateur)
- **FR-010**: Le système DOIT mettre en cache les pages essentielles pour accès offline (accueil, profil, services populaires)
- **FR-011**: Le système DOIT afficher une page offline gracieuse quand une ressource non cachée est demandée sans connexion
- **FR-012**: Le système DOIT synchroniser les données mises à jour dès que la connexion est rétablie
- **FR-013**: Le système DOIT obtenir un score Lighthouse Performance >90 sur mobile
- **FR-014**: Le système DOIT optimiser les images (formats WebP/AVIF, lazy loading, responsive images)
- **FR-015**: Le système DOIT implémenter le critical CSS inline et charger les CSS non critiques en différé
- **FR-016**: Le système DOIT minimiser et compresser tous les assets (JS, CSS, images) avec Brotli/Gzip
- **FR-017**: Le système DOIT utiliser des pickers natifs mobiles pour dates, heures et sélections
- **FR-018**: Le système DOIT spécifier les types de claviers appropriés (tel, email, number) pour chaque champ de saisie
- **FR-019**: Le système DOIT supporter les gestures tactiles (swipe, pinch-to-zoom sur images)
- **FR-020**: Le système DOIT demander l'autorisation pour les notifications push au moment opportun (pas immédiatement)
- **FR-021**: Le système DOIT envoyer des notifications push pour les événements critiques (confirmation réservation, message reçu)
- **FR-022**: Le système DOIT implémenter le deep linking depuis les notifications vers la page concernée
- **FR-023**: Le système DOIT gérer le mode portrait et paysage sans perte de contexte
- **FR-024**: Le système DOIT afficher des indicateurs de chargement visuels pendant les opérations asynchrones
- **FR-025**: Le système DOIT fonctionner sur les navigateurs modernes iOS Safari, Android Chrome et Edge mobile

### Key Entities

- **Service Worker**: Script exécuté en arrière-plan gérant le cache, les requêtes offline et les notifications push
- **Cache Storage**: Stockage local des assets (HTML, CSS, JS, images) pour accès offline rapide
- **Web App Manifest**: Fichier JSON définissant les métadonnées de l'application (nom, icônes, couleurs, comportement d'affichage)
- **Push Subscription**: Abonnement aux notifications push avec endpoint et clés de chiffrement
- **IndexedDB State**: Base de données locale stockant l'état de l'application pour persistance offline

## Success Criteria

### Measurable Outcomes

- **SC-001**: Le score Lighthouse Performance mobile atteint minimum 90/100 sur toutes les pages principales
- **SC-002**: Le First Contentful Paint (FCP) est inférieur à 1.8 secondes sur connexion 4G
- **SC-003**: Le Largest Contentful Paint (LCP) est inférieur à 2.5 secondes dans 95% des cas
- **SC-004**: Le Cumulative Layout Shift (CLS) est inférieur à 0.1 (pas de sauts visuels)
- **SC-005**: Le taux d'installation de la PWA atteint au moins 15% des visiteurs réguliers (3+ visites)
- **SC-006**: Les utilisateurs sur mobile représentent au moins 60% du trafic total
- **SC-007**: Le taux de rebond mobile diminue de 30% comparé à avant l'optimisation
- **SC-008**: Les utilisateurs avec PWA installée ont un taux de réengagement 3x supérieur
- **SC-009**: 80% des pages visitées restent accessibles en mode offline
- **SC-010**: Le taux d'opt-in aux notifications push atteint au moins 25% des utilisateurs PWA

## Assumptions

- Les utilisateurs utilisent des smartphones modernes (iOS 14+, Android 8+)
- Les navigateurs supportent les standards PWA modernes (Service Workers, Web App Manifest)
- La majorité des utilisateurs ont des connexions 4G ou supérieures
- Les utilisateurs acceptent de donner l'autorisation pour les notifications (pour ceux qui veulent)
- L'infrastructure serveur supporte HTTPS et HTTP/2 pour optimiser les performances
- Les images sont optimisées à la source avant upload (ou via CDN avec transformations automatiques)

## Dependencies

- Service worker registration et gestion du cycle de vie
- HTTPS obligatoire (certificat SSL/TLS)
- Web App Manifest correctement configuré
- Service de notifications push (Firebase Cloud Messaging ou similaire)
- CDN avec support de formats d'images modernes (WebP, AVIF)
- Système de build optimisé (minification, compression, code splitting)

## Out of Scope

- Application mobile native (iOS/Android) - La PWA est le substitut
- Support des très vieux navigateurs (IE11, iOS <12)
- Fonctionnalités natives avancées (NFC, Bluetooth, accès fichiers système)
- Mode offline complet avec synchronisation complète (seule la consultation offline est supportée)
- Optimisation pour montres connectées ou autres devices non-smartphone/tablette
- A/B testing de différentes versions du manifest ou service worker
- Analytics offline avec synchronisation différée (les analytics fonctionnent uniquement online)
