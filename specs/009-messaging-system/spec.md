# Feature Specification: Système de Messagerie Temps Réel

**Feature Branch**: `009-messaging-system`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Système de messagerie temps réel entre clients et prestataires avec historique conversations, notifications nouveaux messages et modération automatique"

## User Scenarios & Testing

### User Story 1 - Envoi et Réception de Messages en Temps Réel (Priority: P1)

Un client ayant une réservation confirmée avec un prestataire souhaite lui poser une question sur le déroulement du service. Il accède à la conversation depuis son espace client, tape son message et l'envoie. Le prestataire reçoit instantanément le message et peut répondre immédiatement.

**Why this priority**: Communication directe entre client et prestataire est essentielle pour coordonner les détails du service. Sans messagerie, ils doivent utiliser email/téléphone externe, ce qui dégrade l'expérience. MVP absolu pour une plateforme de services.

**Independent Test**: Peut être testé en envoyant un message depuis le compte client et vérifiant sa réception instantanée côté prestataire, puis en répondant et vérifiant la réception côté client. Délivre la valeur : "Client et prestataire peuvent communiquer instantanément".

**Acceptance Scenarios**:

1. **Given** un client avec réservation confirmée, **When** il envoie un message au prestataire, **Then** le message apparaît instantanément dans la conversation sans rechargement de page
2. **Given** un prestataire en ligne, **When** il reçoit un nouveau message, **Then** le message s'affiche en temps réel dans son interface sans action de sa part
3. **Given** deux utilisateurs tapant simultanément, **When** ils envoient leurs messages, **Then** les messages apparaissent dans l'ordre chronologique correct pour les deux parties
4. **Given** un utilisateur offline, **When** un message lui est envoyé, **Then** le message est stocké et s'affiche dès qu'il se reconnecte

---

### User Story 2 - Historique et Persistance des Conversations (Priority: P1)

Un prestataire veut vérifier ce qu'un client lui avait demandé il y a 3 jours concernant une réservation passée. Il accède à l'historique de ses conversations, retrouve celle avec ce client et peut lire tous les échanges depuis le début.

**Why this priority**: Sans historique persistant, les utilisateurs perdent le contexte des échanges. Critical pour le support, la traçabilité et la résolution de litiges.

**Independent Test**: Peut être testé en échangeant plusieurs messages, se déconnectant, se reconnectant et vérifiant que tous les messages sont toujours accessibles. Délivre la valeur : "Utilisateurs conservent tout l'historique de leurs échanges".

**Acceptance Scenarios**:

1. **Given** un utilisateur ayant échangé 20 messages avec quelqu'un, **When** il se reconnecte 2 jours plus tard, **Then** tous les messages sont visibles dans l'ordre chronologique
2. **Given** une conversation de plusieurs mois, **When** un utilisateur fait défiler vers le haut, **Then** les anciens messages se chargent progressivement (pagination/infinite scroll)
3. **Given** un utilisateur cherchant un message spécifique, **When** il utilise la recherche dans la conversation, **Then** les messages contenant le terme recherché sont mis en évidence
4. **Given** plusieurs conversations actives, **When** un utilisateur consulte la liste, **Then** elles sont triées par date du dernier message (plus récentes en haut)

---

### User Story 3 - Notifications de Nouveaux Messages (Priority: P1)

Un prestataire est en train de travailler et ne surveille pas constamment l'application. Un client lui envoie un message urgent. Le prestataire reçoit une notification (badge, push notification si PWA installée, email si paramétré) l'alertant du nouveau message.

**Why this priority**: Sans notifications, les utilisateurs peuvent manquer des messages importants pendant des heures. Essentiel pour la réactivité et la qualité de service.

**Independent Test**: Peut être testé en envoyant un message à un utilisateur non connecté et vérifiant la réception d'une notification email. Si PWA installée, vérifier aussi la notification push. Délivre la valeur : "Utilisateurs ne manquent aucun message important".

**Acceptance Scenarios**:

1. **Given** un utilisateur avec conversation non lue, **When** il consulte la liste des conversations, **Then** un badge avec le nombre de messages non lus s'affiche sur la conversation
2. **Given** un utilisateur ayant activé les notifications push, **When** il reçoit un message alors que l'app est fermée, **Then** une notification push s'affiche sur son appareil
3. **Given** un utilisateur ayant activé les notifications email, **When** il reçoit un message et ne l'a pas lu dans les 15 minutes, **Then** il reçoit un email de notification
4. **Given** un utilisateur consultant une conversation, **When** il lit les nouveaux messages, **Then** les badges de non-lu sont automatiquement effacés

---

### User Story 4 - Pièces Jointes et Médias (Priority: P2)

Un client souhaite envoyer une photo montrant l'emplacement exact où il souhaite le massage installé. Il clique sur l'icône de pièce jointe, sélectionne une photo depuis sa galerie et l'envoie dans le chat. Le prestataire voit la photo en prévisualisation et peut l'agrandir.

**Why this priority**: Enrichit significativement la communication mais n'est pas critique pour le MVP. Les utilisateurs peuvent décrire textuellement en attendant.

**Independent Test**: Peut être testé en envoyant une image depuis le client et vérifiant sa réception et affichage côté prestataire. Délivre la valeur : "Utilisateurs peuvent partager des visuels pour mieux communiquer".

**Acceptance Scenarios**:

1. **Given** un utilisateur dans une conversation, **When** il clique sur l'icône pièce jointe et sélectionne une image, **Then** l'image est uploadée et s'affiche comme message dans la conversation
2. **Given** une image envoyée, **When** le destinataire la reçoit, **Then** elle s'affiche en miniature et peut être cliquée pour agrandissement en plein écran
3. **Given** un fichier non-image (PDF), **When** il est envoyé, **Then** il apparaît comme lien téléchargeable avec icône et nom du fichier
4. **Given** un fichier trop volumineux (>10MB), **When** l'utilisateur tente de l'envoyer, **Then** un message d'erreur explique la limite et suggère de compresser

---

### User Story 5 - Modération Automatique et Filtrage (Priority: P2)

Un utilisateur malveillant tente d'envoyer un message contenant des insultes ou un lien de phishing. Le système de modération automatique détecte le contenu inapproprié et bloque le message ou le met en attente pour révision manuelle.

**Why this priority**: Protège les utilisateurs contre les abus et le spam. Important pour maintenir un environnement sain mais pas critique pour lancement initial avec peu d'utilisateurs.

**Independent Test**: Peut être testé en envoyant des messages avec mots-clés interdits et vérifiant qu'ils sont bloqués ou flaggés. Délivre la valeur : "Plateforme protège les utilisateurs des contenus inappropriés".

**Acceptance Scenarios**:

1. **Given** un utilisateur envoyant un message avec insultes, **When** le message est soumis, **Then** il est bloqué et un avertissement s'affiche demandant de reformuler
2. **Given** un message contenant un lien suspect, **When** le système le détecte, **Then** le message est mis en attente et un modérateur est notifié pour vérification
3. **Given** un utilisateur envoyant 10 messages identiques en 1 minute (spam), **When** le système détecte le pattern, **Then** l'envoi est temporairement limité avec un cooldown de 30 secondes
4. **Given** un modérateur vérifiant un message flaggé, **When** il approuve le message, **Then** celui-ci est délivré au destinataire avec indication du délai

---

### User Story 6 - Indicateurs de Saisie et Présence (Priority: P3)

Un client tape un message à son prestataire. Le prestataire, ayant la conversation ouverte, voit un indicateur "Client est en train d'écrire..." lui signalant qu'une réponse arrive. De plus, un indicateur montre si le destinataire est actuellement en ligne.

**Why this priority**: Améliore le ressenti de conversation en temps réel et gère les attentes. Nice-to-have qui peut être ajouté post-MVP.

**Independent Test**: Peut être testé en tapant dans une conversation et vérifiant l'apparition de l'indicateur côté destinataire. Délivre la valeur : "Utilisateurs savent si leur interlocuteur est actif".

**Acceptance Scenarios**:

1. **Given** un utilisateur tapant dans le champ de saisie, **When** il écrit, **Then** son interlocuteur voit "X est en train d'écrire..." pendant 3 secondes après la dernière frappe
2. **Given** un utilisateur en ligne avec conversation ouverte, **When** son statut est vérifié, **Then** un point vert "En ligne" s'affiche à côté de son nom
3. **Given** un utilisateur ayant quitté la conversation il y a 2 minutes, **When** son statut est affiché, **Then** il indique "Vu il y a 2 min"
4. **Given** un message lu par le destinataire, **When** l'expéditeur consulte la conversation, **Then** une mention "Lu" apparaît sous le message

---

### Edge Cases

- **Connexion intermittente**: L'utilisateur perd sa connexion pendant 30 secondes. Les messages tapés pendant ce temps doivent être mis en file d'attente et envoyés dès la reconnexion.
- **Message pendant suppression de compte**: Si un utilisateur envoie un message juste avant que son compte soit supprimé, le message doit être annulé ou géré gracieusement.
- **Limite de caractères**: Un utilisateur tente d'envoyer un message de 5000 caractères. Définir une limite (ex: 2000 chars) et afficher un compteur.
- **Conversation avec utilisateur bloqué**: Si un admin bloque un utilisateur, ses conversations existantes restent-elles visibles ? Peut-il encore envoyer des messages ?
- **Multiple devices**: Un utilisateur connecté sur téléphone et ordinateur simultanément. Les messages et indicateurs doivent se synchroniser en temps réel sur les deux.
- **Réservation annulée**: Que se passe-t-il avec la conversation associée si la réservation est annulée ? Accès maintenu ou archivé ?
- **Pièce jointe malveillante**: Un utilisateur tente d'envoyer un fichier .exe ou script. Le système doit bloquer les types de fichiers dangereux.
- **Flood de messages**: Un utilisateur envoie 50 messages en 10 secondes. Implémenter un rate limiting pour prévenir l'abus.

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre l'envoi de messages texte en temps réel entre client et prestataire ayant une réservation commune
- **FR-002**: Le système DOIT utiliser WebSockets ou équivalent pour la communication bidirectionnelle temps réel
- **FR-003**: Le système DOIT afficher les nouveaux messages instantanément sans rechargement de page
- **FR-004**: Le système DOIT persister tous les messages dans la base de données avec horodatage précis
- **FR-005**: Le système DOIT permettre de récupérer l'historique complet des conversations
- **FR-006**: Le système DOIT paginer les anciens messages (charger 50 messages à la fois lors du scroll)
- **FR-007**: Le système DOIT permettre la recherche dans l'historique des conversations
- **FR-008**: Le système DOIT afficher un badge avec le nombre de messages non lus pour chaque conversation
- **FR-009**: Le système DOIT marquer automatiquement les messages comme lus lorsque l'utilisateur consulte la conversation
- **FR-010**: Le système DOIT envoyer une notification push (si PWA) lors de la réception d'un nouveau message
- **FR-011**: Le système DOIT envoyer un email de notification si le message n'est pas lu dans les 15 minutes
- **FR-012**: Le système DOIT permettre l'envoi de pièces jointes (images JPG/PNG, PDF)
- **FR-013**: Le système DOIT limiter la taille des pièces jointes à 10MB maximum
- **FR-014**: Le système DOIT scanner les fichiers uploadés pour détecter les malwares
- **FR-015**: Le système DOIT afficher les images en miniature dans le chat avec possibilité d'agrandir
- **FR-016**: Le système DOIT implémenter un filtre de modération automatique pour détecter contenus inappropriés
- **FR-017**: Le système DOIT bloquer ou mettre en attente les messages contenant des mots-clés interdits
- **FR-018**: Le système DOIT détecter et bloquer les liens suspects ou de phishing
- **FR-019**: Le système DOIT limiter l'envoi à 10 messages par minute maximum par utilisateur (rate limiting)
- **FR-020**: Le système DOIT afficher un indicateur "en train d'écrire" lorsque l'interlocuteur tape
- **FR-021**: Le système DOIT afficher le statut de présence (en ligne, hors ligne, vu il y a X min)
- **FR-022**: Le système DOIT afficher un indicateur "Lu" sur les messages lus par le destinataire
- **FR-023**: Le système DOIT gérer la file d'attente des messages en cas de perte de connexion temporaire
- **FR-024**: Le système DOIT limiter les conversations aux utilisateurs ayant une réservation active ou passée ensemble
- **FR-025**: Le système DOIT permettre aux administrateurs de consulter les conversations pour modération

### Key Entities

- **Conversation (messaging_conversations)**: Représente un thread de discussion entre un client et un prestataire, lié à une réservation spécifique (participants, date de création, dernière activité)
- **Message (messaging_messages)**: Représente un message individuel (texte, pièces jointes, auteur, horodatage, statut de lecture)
- **Message Read Receipt**: Trace de lecture d'un message (message_id, user_id, timestamp de lecture)
- **File Attachment (messaging_attachments)**: Pièce jointe (URL stockage, type MIME, taille, nom original)
- **Moderation Flag**: Signalement automatique ou manuel d'un message (message_id, raison, statut de révision, décision modérateur)
- **Typing Indicator**: État temporaire indiquant qu'un utilisateur est en train de taper (conversation_id, user_id, timestamp)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Les messages sont délivrés en moins de 500ms dans 95% des cas
- **SC-002**: Le système supporte au moins 1000 conversations simultanées sans dégradation
- **SC-003**: Le taux de notification push délivrées avec succès atteint 90% (pour les utilisateurs ayant accepté)
- **SC-004**: Les utilisateurs peuvent accéder à l'historique de leurs conversations depuis le début sans perte de données
- **SC-005**: Le taux de messages bloqués par modération automatique pour contenu inapproprié atteint 85% de précision
- **SC-006**: Moins de 5% de faux positifs dans la modération automatique (messages légitimes bloqués)
- **SC-007**: Le temps de réponse moyen entre client et prestataire diminue de 60% comparé aux communications externes
- **SC-008**: 80% des utilisateurs ayant une réservation utilisent la messagerie au moins une fois
- **SC-009**: Le taux de synchronisation multi-devices est de 99% (messages apparaissent sur tous les appareils de l'utilisateur)
- **SC-010**: Aucune donnée de conversation n'est perdue même en cas de perte de connexion temporaire

## Assumptions

- Les utilisateurs ont des navigateurs modernes supportant WebSockets
- La majorité des conversations comportent moins de 100 messages (pagination adaptée)
- Les utilisateurs communiquent principalement en texte, les pièces jointes sont secondaires
- Les prestataires consultent leurs messages au moins une fois par jour
- La modération automatique nécessitera un ajustement continu des filtres selon le retour terrain
- Les notifications push nécessitent que l'utilisateur ait installé la PWA et accepté les permissions

## Dependencies

- WebSocket server ou équivalent (Supabase Realtime, Socket.io, etc.)
- Service de stockage pour les pièces jointes (Supabase Storage, S3)
- Service de scan antivirus pour les fichiers uploadés
- Système de modération automatique (bibliothèque de filtrage de contenu ou IA)
- Service de notifications push (dépendance spec 008 - PWA)
- Service email pour notifications (Resend) - dépendance spec 001

## Out of Scope

- Messagerie vocale ou appels audio/vidéo
- Traduction automatique des messages
- Réactions emoji sur les messages
- Messages éphémères (auto-destruction)
- Chiffrement de bout en bout (les messages sont chiffrés en transit et au repos mais lisibles par les admins)
- Chatbots ou réponses automatiques intelligentes
- Partage de localisation en temps réel
- Transfert de conversation à un autre prestataire
- Message boards ou groupes de discussion
