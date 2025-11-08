# Feature Specification: Système d'Authentification Sécurisé

**Feature Branch**: `001-authentication-system`
**Created**: 2025-11-06
**Status**: Draft
**Input**: "Système d'authentification sécurisé avec vérification email par code à 6 chiffres, connexion standard, réinitialisation de mot de passe et gestion de session persistante"

## User Scenarios & Testing

### User Story 1 - Inscription Client avec Vérification Email (Priority: P1)

Un nouveau visiteur souhaite créer un **compte CLIENT** sur la plateforme Simone pour pouvoir réserver des services de bien-être. Il doit fournir ses informations de base (nom, email, mot de passe) et vérifier son adresse email via un code unique avant de pouvoir accéder à la plateforme.

**IMPORTANT**: Cette inscription est UNIQUEMENT pour les clients. Les prestataires NE peuvent PAS s'inscrire directement - ils doivent passer par le processus de candidature décrit dans la spec 007 (formulaire public → validation admin → création compte par admin).

**Why this priority**: C'est le point d'entrée obligatoire pour tous les nouveaux clients. Sans inscription fonctionnelle, aucun client ne peut réserver. C'est la fonctionnalité MVP absolue du système d'authentification.

**Independent Test**: Peut être testé en créant un compte, recevant le code par email, et vérifiant que l'accès est accordé uniquement après validation du code. Délivre la valeur : "Utilisateur peut créer un compte sécurisé".

**Acceptance Scenarios**:

1. **Given** un visiteur non inscrit sur la page d'inscription, **When** il remplit le formulaire avec email valide, nom et mot de passe fort, **Then** un code de vérification à 6 chiffres est envoyé à son email
2. **Given** un utilisateur ayant reçu un code de vérification, **When** il saisit le code correct dans les 15 minutes, **Then** son compte est activé et il est automatiquement connecté
3. **Given** un utilisateur avec un code expiré (>15 min), **When** il tente de saisir le code, **Then** il reçoit un message d'erreur et peut demander un nouveau code
4. **Given** un utilisateur ayant saisi 3 codes incorrects, **When** il tente une 4ème saisie, **Then** le système bloque temporairement la validation et envoie une alerte sécurité

---

### User Story 2 - Connexion Standard (Priority: P1)

Un utilisateur déjà inscrit veut se connecter à son compte pour accéder aux services de la plateforme en utilisant son email et son mot de passe.

**Why this priority**: Fonctionnalité critique égale à l'inscription. Les utilisateurs existants doivent pouvoir accéder à leur compte. Sans cela, la plateforme est inutilisable pour les utilisateurs récurrents.

**Independent Test**: Peut être testé en se connectant avec des identifiants valides et vérifiant l'accès au dashboard approprié selon le rôle. Délivre la valeur : "Utilisateur peut accéder à son compte de manière sécurisée".

**Acceptance Scenarios**:

1. **Given** un utilisateur avec compte actif sur la page de connexion, **When** il saisit email et mot de passe corrects, **Then** il est redirigé vers son espace personnel approprié à son rôle
2. **Given** un utilisateur sur la page de connexion, **When** il saisit un mot de passe incorrect, **Then** un message d'erreur générique s'affiche sans révéler si l'email existe
3. **Given** un utilisateur ayant échoué 5 tentatives de connexion, **When** il tente une 6ème connexion, **Then** son compte est temporairement verrouillé pour 15 minutes
4. **Given** un utilisateur avec compte non vérifié, **When** il tente de se connecter, **Then** il est redirigé vers la page de vérification email

---

### User Story 3 - Session Persistante (Priority: P2)

Un utilisateur connecté ferme son navigateur ou revient plus tard sur la plateforme et souhaite rester connecté sans avoir à ressaisir ses identifiants à chaque visite.

**Why this priority**: Améliore significativement l'expérience utilisateur en réduisant la friction. N'est pas critique pour le MVP mais essentiel pour l'adoption et la rétention.

**Independent Test**: Peut être testé en se connectant, fermant le navigateur, le rouvrant et vérifiant que la session est maintenue. Délivre la valeur : "Utilisateur n'a pas à se reconnecter constamment".

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté qui ferme son navigateur, **When** il rouvre le navigateur et accède à la plateforme, **Then** il est toujours connecté et accède directement à son espace
2. **Given** un utilisateur inactif pendant 7 jours, **When** il revient sur la plateforme, **Then** sa session est toujours active
3. **Given** un utilisateur connecté, **When** il se déconnecte explicitement, **Then** sa session est immédiatement invalidée sur tous ses appareils
4. **Given** un utilisateur avec session active, **When** il change son mot de passe, **Then** toutes ses sessions actives sont invalidées sauf celle en cours

---

### User Story 4 - Réinitialisation Mot de Passe (Priority: P2)

Un utilisateur ayant oublié son mot de passe doit pouvoir le réinitialiser de manière sécurisée en utilisant son adresse email comme preuve d'identité.

**Why this priority**: Fonctionnalité importante pour la récupération de compte mais pas critique pour le lancement initial. Les utilisateurs peuvent temporairement contacter le support si nécessaire.

**Independent Test**: Peut être testé en demandant une réinitialisation, recevant le code, et créant un nouveau mot de passe. Délivre la valeur : "Utilisateur peut récupérer l'accès à son compte de manière autonome".

**Acceptance Scenarios**:

1. **Given** un utilisateur sur la page de connexion, **When** il clique sur "Mot de passe oublié" et saisit son email, **Then** un code de vérification est envoyé à son email (même si l'email n'existe pas, pour éviter l'énumération)
2. **Given** un utilisateur ayant reçu un code de réinitialisation, **When** il saisit le code correct dans les 15 minutes, **Then** il accède au formulaire de création d'un nouveau mot de passe
3. **Given** un utilisateur créant un nouveau mot de passe, **When** il soumet un mot de passe respectant les critères de sécurité, **Then** son mot de passe est mis à jour et il est connecté automatiquement
4. **Given** un utilisateur ayant réinitialisé son mot de passe, **When** la réinitialisation est complète, **Then** tous les codes de réinitialisation précédents sont invalidés

---

### Edge Cases

- **Email déjà utilisé**: Que se passe-t-il si un utilisateur tente de s'inscrire avec un email déjà enregistré ? Le système doit afficher un message clair sans compromettre la sécurité.
- **Connexion simultanée multi-appareils**: Comment le système gère-t-il un utilisateur connecté sur 5 appareils différents ? La limite doit être définie et appliquée.
- **Code de vérification en spam**: Si l'email de vérification arrive dans les spams, l'utilisateur doit pouvoir demander un renvoi après 1 minute.
- **Changement d'email pendant vérification**: Si un utilisateur s'inscrit avec email A, puis tente de vérifier avec email B, le système doit rejeter la tentative.
- **Compte désactivé par admin**: Que se passe-t-il si un administrateur désactive un compte pendant qu'un utilisateur est connecté ? La session doit être invalidée immédiatement.
- **Tentatives de bruteforce**: Comment le système détecte et bloque les tentatives automatisées de connexion ? Rate limiting par IP et par email requis.
- **Expiration de session forcée**: En cas de détection d'activité suspecte, l'administrateur doit pouvoir forcer la déconnexion d'un utilisateur spécifique.

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre à un nouvel utilisateur de créer un compte en fournissant un email unique, un nom d'affichage et un mot de passe
- **FR-002**: Le système DOIT envoyer un code de vérification à 6 chiffres par email lors de l'inscription
- **FR-003**: Le système DOIT limiter la validité du code de vérification à 15 minutes après son émission
- **FR-004**: Le système DOIT limiter le nombre de tentatives de saisie du code de vérification à 3 tentatives consécutives
- **FR-005**: Le système DOIT permettre à l'utilisateur de demander un nouveau code de vérification si le précédent a expiré
- **FR-006**: Le système DOIT activer le compte uniquement après validation réussie du code de vérification
- **FR-007**: Le système DOIT permettre à un utilisateur avec compte actif de se connecter via email et mot de passe
- **FR-008**: Le système DOIT implémenter un rate limiting de 5 tentatives de connexion échouées par période de 15 minutes
- **FR-009**: Le système DOIT verrouiller temporairement un compte après 5 échecs de connexion consécutifs
- **FR-010**: Le système DOIT maintenir une session persistante pendant au moins 7 jours d'inactivité
- **FR-011**: Le système DOIT permettre à un utilisateur de se déconnecter explicitement
- **FR-012**: Le système DOIT invalider toutes les sessions actives lorsque l'utilisateur change son mot de passe
- **FR-013**: Le système DOIT permettre à un utilisateur d'initier une réinitialisation de mot de passe via son email
- **FR-014**: Le système DOIT envoyer un code de vérification pour autoriser la réinitialisation du mot de passe
- **FR-015**: Le système DOIT invalider tous les codes de réinitialisation précédents après une réinitialisation réussie
- **FR-016**: Le système DOIT appliquer des règles de complexité pour les mots de passe (minimum 8 caractères, au moins une majuscule, un chiffre, un caractère spécial)
- **FR-017**: Le système DOIT hasher tous les mots de passe avant stockage (jamais en clair)
- **FR-018**: Le système DOIT créer automatiquement un profil utilisateur dans la table profiles lors de l'inscription réussie
- **FR-019**: Le système DOIT enregistrer l'horodatage de la dernière connexion pour chaque utilisateur
- **FR-020**: Le système DOIT permettre à un administrateur de désactiver un compte utilisateur manuellement

### Key Entities

- **User Account (auth.users)**: Représente les credentials d'authentification d'un utilisateur (email, mot de passe hashé, statut de vérification, métadonnées de sécurité comme date de dernière connexion)
- **User Profile (profiles)**: Représente les informations de profil de l'utilisateur synchronisées avec auth.users (display_name, phone_number, profile_type, préférences)
- **Verification Code**: Code temporaire à 6 chiffres avec timestamp de création, compteur de tentatives, et statut (actif/expiré/utilisé)
- **Session Token**: Token JWT représentant une session active avec date d'expiration, device fingerprint, et métadonnées de sécurité

## Success Criteria

### Measurable Outcomes

- **SC-001**: Les nouveaux utilisateurs peuvent créer un compte et le vérifier en moins de 3 minutes (du début de l'inscription à la connexion réussie)
- **SC-002**: Le taux de complétion de l'inscription (du formulaire à la vérification email) atteint au moins 75%
- **SC-003**: Les utilisateurs existants peuvent se connecter en moins de 10 secondes
- **SC-004**: Le système maintient les sessions actives pendant au moins 7 jours sans nécessiter de reconnexion
- **SC-005**: Aucun mot de passe n'est jamais stocké en clair (100% des mots de passe sont hashés)
- **SC-006**: Le taux de réussite de réinitialisation de mot de passe dépasse 90% pour les utilisateurs ayant initié le processus
- **SC-007**: Le système bloque automatiquement 100% des tentatives de bruteforce après 5 échecs
- **SC-008**: Le temps moyen de réception du code de vérification par email est inférieur à 30 secondes
- **SC-009**: Le nombre de tickets support liés aux problèmes de connexion diminue de 60% après déploiement
- **SC-010**: Le système supporte au moins 10,000 inscriptions simultanées sans dégradation de performance

## Assumptions

- Les utilisateurs ont accès à leur boîte email pour recevoir les codes de vérification
- L'infrastructure email (Resend) est configurée et opérationnelle
- Supabase Auth est disponible et configuré pour gérer les authentifications
- Les utilisateurs utilisent des navigateurs modernes supportant les cookies et JWT
- Le système de génération de codes à 6 chiffres est cryptographiquement sécurisé
- Les limites de rate limiting sont suffisantes pour bloquer les attaques tout en permettant une utilisation normale

## Dependencies

- Service email (Resend) pour l'envoi des codes de vérification
- Supabase Auth pour la gestion des sessions JWT
- Base de données PostgreSQL pour la table profiles
- Système de hashing de mots de passe (bcrypt ou argon2)
- Service de rate limiting (peut utiliser Redis ou Supabase functions)

## Out of Scope

- Authentification via réseaux sociaux (OAuth Google, Facebook, etc.)
- Authentification à deux facteurs (2FA) via SMS ou application
- Authentification biométrique (empreinte digitale, Face ID)
- Login "magic link" sans mot de passe
- SSO (Single Sign-On) pour entreprises
- Gestion des rôles et permissions (traité dans une spec séparée)
- Tableau de bord utilisateur post-connexion (traité dans des specs séparées par rôle)
