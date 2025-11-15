# Guide de Test - Flux de Réservation Invité

## 📋 Vue d'ensemble

Ce document décrit le flux complet de réservation pour les utilisateurs invités (non-authentifiés) et le processus de migration vers un compte authentifié.

## 🎯 Objectifs du Flux

1. **Permettre aux visiteurs** de découvrir et commencer une réservation sans créer de compte
2. **Encourager la conversion** à un moment stratégique (après sélection du créneau)
3. **Préserver les données** de l'invité lors de la migration vers un compte authentifié
4. **Offrir une expérience fluide** sans perte d'informations

## 🔄 Architecture du Flux

### Phase 1: Navigation Invité (Sans Authentification)
```
Visiteur → Services → Adresse → Créneau → [LOGIN GATE] → Confirmation
```

### Phase 2: Conversion & Migration
```
Login Gate → Signup/Login → Migration Auto → Confirmation → Réservation
```

## 📝 Scénarios de Test

### Scénario 1: Flux Invité Complet avec Inscription

#### Étape 1: Découverte des Services
**URL:** `/booking/services`
- [ ] La page se charge sans authentification
- [ ] Le header affiche "Se connecter" et "S'inscrire"
- [ ] Un session invité est créé automatiquement
- [ ] `sessionStorage.booking_session_id` est défini

**Console attendue:**
```
🔄 Creating guest booking session
✅ Guest session created: [UUID]
```

**Vérification DB:**
```sql
SELECT session_id, is_guest, guest_email, client_id
FROM booking_sessions
WHERE session_id = '[UUID]';

-- Résultat attendu:
-- is_guest = true
-- guest_email = 'guest@temp.com'
-- client_id = NULL
```

#### Étape 2: Sélection du Service
- [ ] Clic sur un service (ex: "Manucure Classique")
- [ ] Navigation vers `/booking/address?sessionId=[UUID]`
- [ ] Session mise à jour avec `service_id`

**Console attendue:**
```
🎯 Service selected: Manucure Classique Session ID: [UUID]
✅ Service selection updated in database
✅ Navigating to address page...
```

**Vérification DB:**
```sql
SELECT service_id, current_step
FROM booking_sessions
WHERE session_id = '[UUID]';

-- Résultat attendu:
-- service_id = [ID du service]
-- current_step = 2
```

#### Étape 3: Saisie de l'Adresse
**URL:** `/booking/address?sessionId=[UUID]`
- [ ] Le formulaire d'adresse s'affiche automatiquement (guests)
- [ ] Message helper: "💡 Vous pourrez créer un compte à l'étape suivante..."
- [ ] Pas de champs "Label" ou "Type" (simplifiés pour guests)
- [ ] Champs requis: Adresse, Code postal, Ville
- [ ] Champ optionnel: Complément d'adresse

**Saisie de test:**
```
Adresse: 123 Rue de la Paix
Code postal: 75001
Ville: Paris
Complément: Appartement 5B, 2ème étage
```

- [ ] Clic sur "Continuer"
- [ ] Navigation vers `/booking/timeslot?sessionId=[UUID]`

**Console attendue:**
```
✅ Guest address saved to session
```

**Vérification DB:**
```sql
SELECT guest_address, current_step
FROM booking_sessions
WHERE session_id = '[UUID]';

-- Résultat attendu:
-- guest_address = {"street": "123 Rue de la Paix", "city": "Paris", ...}
-- current_step = 3
```

#### Étape 4: Sélection du Créneau
**URL:** `/booking/timeslot?sessionId=[UUID]`
- [ ] Affichage des 7 prochains jours
- [ ] Sélection d'une date (ex: Demain)
- [ ] Affichage des créneaux horaires (9h00-18h00)
- [ ] Sélection d'un créneau (ex: 14h00)
- [ ] Message helper: "💡 Vous devrez créer un compte à l'étape suivante..."
- [ ] Bouton: "Continuer" (pas "Continuer vers la confirmation")

**Console attendue:**
```
✅ Timeslot saved to session
🚪 Guest user detected - showing login gate
```

- [ ] **Le Login Gate s'affiche automatiquement**

**Vérification DB:**
```sql
SELECT timeslot, current_step
FROM booking_sessions
WHERE session_id = '[UUID]';

-- Résultat attendu:
-- timeslot = {"date": "2025-01-XX", "start_time": "14:00", "end_time": "15:00"}
-- current_step = 4
```

#### Étape 5: Login Gate (Modale de Conversion)
- [ ] Modale avec fond flou s'affiche
- [ ] Titre: "Dernière étape !"
- [ ] Sous-titre: "Créez votre compte pour finaliser votre réservation"
- [ ] 4 bénéfices affichés avec icônes ✓
- [ ] Bouton principal: "Créer un compte" (gradient bleu)
- [ ] Bouton secondaire: "J'ai déjà un compte"
- [ ] Bouton fermer (X) en haut à droite

**Bénéfices affichés:**
1. Confirmez votre réservation → Recevez une confirmation par email
2. Gérez vos rendez-vous → Suivez et modifiez vos réservations
3. Accédez à votre historique → Retrouvez vos anciennes réservations
4. Réservez plus rapidement → Vos informations sont déjà enregistrées

#### Étape 6: Inscription
- [ ] Clic sur "Créer un compte"
- [ ] Modale d'inscription s'ouvre (Login Gate reste en arrière-plan)
- [ ] Formulaire: Prénom, Nom, Email, Mot de passe

**Saisie de test:**
```
Prénom: Jean
Nom: Dupont
Email: jean.dupont+test@example.com
Mot de passe: TestPassword123!
```

- [ ] Clic sur "S'inscrire"
- [ ] Compte créé dans Supabase Auth
- [ ] Profile créé dans la table `profiles`

#### Étape 7: Migration Automatique
**Déclenchée automatiquement après inscription réussie**

**Console attendue:**
```
🔄 Migrating guest session to authenticated user...
💾 Saving guest address to user profile...
✅ Guest address saved with ID: [address_id]
✅ Session migrated successfully
✅ Authentication successful - refreshing session and proceeding
```

**Vérification DB - Table `client_addresses`:**
```sql
SELECT * FROM client_addresses
WHERE client_id = '[user_id]'
ORDER BY created_at DESC LIMIT 1;

-- Résultat attendu:
-- street = '123 Rue de la Paix'
-- city = 'Paris'
-- postal_code = '75001'
-- building_info = 'Appartement 5B, 2ème étage'
-- is_default = true
-- type = 'home'
```

**Vérification DB - Table `booking_sessions`:**
```sql
SELECT
  client_id,
  is_guest,
  guest_email,
  guest_address,
  address_id
FROM booking_sessions
WHERE session_id = '[UUID]';

-- Résultat attendu:
-- client_id = [user_id] (pas NULL!)
-- is_guest = false
-- guest_email = NULL
-- guest_address = NULL
-- address_id = [address_id] (même ID que client_addresses!)
```

#### Étape 8: Page de Confirmation
**URL:** `/booking/confirmation?sessionId=[UUID]`

- [ ] Navigation automatique vers la confirmation
- [ ] Affichage correct du service (nom, durée, prix)
- [ ] Affichage correct de la date et heure
- [ ] Affichage correct de l'adresse (sans label car guest)
- [ ] Prix total affiché
- [ ] Bouton "Confirmer la réservation"

**Sources de données:**
- Service: `bookingSession.service` (relation)
- Adresse: `bookingSession.address` (relation via address_id)
- Date/Heure: sessionStorage

#### Étape 9: Confirmation Finale
- [ ] Clic sur "Confirmer la réservation"
- [ ] Appel API `/api/bookings/create`
- [ ] Création dans `appointment_bookings`
- [ ] Création dans `booking_requests`
- [ ] Écran de succès avec ✓ vert
- [ ] Message: "Réservation confirmée !"
- [ ] Redirection vers `/client/bookings` après 3s

**Vérification DB - `appointment_bookings`:**
```sql
SELECT * FROM appointment_bookings
WHERE client_id = '[user_id]'
ORDER BY created_at DESC LIMIT 1;

-- Vérifier:
-- service_id, address_id, scheduled_date, scheduled_time
```

### Scénario 2: Flux Invité avec Login Existant

**Différence:** À l'étape 6, cliquer sur "J'ai déjà un compte" au lieu de "Créer un compte"

- [ ] Login Gate → "J'ai déjà un compte"
- [ ] Formulaire de connexion s'ouvre
- [ ] Saisie email + mot de passe d'un compte existant
- [ ] Migration automatique identique (étapes 7-9)

**Note importante:** Le même flux de migration s'applique, l'adresse guest sera ajoutée au profil existant

### Scénario 3: Utilisateur Authentifié (Flux Normal)

**Point de départ:** Utilisateur déjà connecté

**Différences observables:**
- **Services page:** Session authentifiée créée (pas guest)
  ```
  🔄 Creating authenticated booking session for user: [user_id]
  ```
- **Address page:** Liste des adresses existantes affichée
- **Timeslot page:** Pas de Login Gate, navigation directe vers confirmation
- **Confirmation:** Données du store Zustand + bookingSession

## 🔍 Points de Vérification Critiques

### RLS Policies
```sql
-- Vérifier que les policies guest fonctionnent
SELECT * FROM booking_sessions
WHERE is_guest = true; -- Doit fonctionner en tant qu'anon

-- Vérifier que les policies auth fonctionnent
SELECT * FROM booking_sessions
WHERE client_id = auth.uid(); -- Doit fonctionner en tant qu'authenticated
```

### Session Storage
- `booking_session_id` - UUID de la session
- `booking_date` - Date sélectionnée
- `booking_time` - Heure sélectionnée

### État de la Session

**Invité (étape 3):**
```json
{
  "session_id": "uuid",
  "client_id": null,
  "is_guest": true,
  "guest_email": "guest@temp.com",
  "guest_address": {
    "street": "123 Rue de la Paix",
    "city": "Paris",
    "postal_code": "75001",
    "building_info": "Apt 5B"
  },
  "service_id": 1,
  "address_id": null,
  "current_step": 3
}
```

**Après Migration:**
```json
{
  "session_id": "uuid",
  "client_id": "user-uuid",
  "is_guest": false,
  "guest_email": null,
  "guest_address": null,
  "service_id": 1,
  "address_id": 42,  // ← Nouvelle adresse créée!
  "current_step": 4
}
```

## 🐛 Scénarios d'Erreur à Tester

### 1. Session Expirée
- [ ] Attendre 30+ minutes à l'étape 2
- [ ] Essayer de continuer
- [ ] Message d'erreur approprié

### 2. Refresh de Page
- [ ] Recharger la page à chaque étape
- [ ] Session récupérée depuis sessionStorage
- [ ] Progression maintenue

### 3. Navigation Arrière
- [ ] Utiliser le bouton "Retour" du navigateur
- [ ] Données préservées
- [ ] Retour à l'étape précédente

### 4. Email Déjà Utilisé
- [ ] Essayer de s'inscrire avec un email existant
- [ ] Message d'erreur de Supabase
- [ ] Possibilité de basculer vers login

### 5. Champs Manquants
- [ ] Essayer de continuer sans remplir les champs requis
- [ ] Messages de validation appropriés

## 📊 Métriques à Surveiller

1. **Taux de conversion:** % d'invités qui créent un compte au Login Gate
2. **Taux d'abandon:** À quelle étape les invités abandonnent
3. **Temps moyen:** Durée totale du flux guest → confirmation
4. **Succès de migration:** % de migrations réussies sans erreur

## 🔧 Commandes de Debug

### Vérifier une session
```sql
SELECT
  s.session_id,
  s.is_guest,
  s.client_id,
  s.service_id,
  s.address_id,
  s.guest_address,
  s.current_step,
  s.created_at,
  srv.name as service_name,
  addr.street as address_street
FROM booking_sessions s
LEFT JOIN services srv ON s.service_id = srv.id
LEFT JOIN client_addresses addr ON s.address_id = addr.id
WHERE s.session_id = '[UUID]';
```

### Sessions invités actives
```sql
SELECT
  session_id,
  guest_email,
  service_id,
  current_step,
  created_at,
  expires_at
FROM booking_sessions
WHERE is_guest = true
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

### Migrations récentes
```sql
SELECT
  session_id,
  client_id,
  guest_email,
  created_at,
  updated_at
FROM booking_sessions
WHERE is_guest = false
  AND guest_email IS NULL
  AND updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

## ✅ Checklist de Validation Finale

### Fonctionnel
- [ ] Flux invité complet sans erreurs
- [ ] Migration automatique réussie
- [ ] Adresse sauvegardée correctement
- [ ] Réservation créée en base
- [ ] Email de confirmation envoyé (si configuré)

### UI/UX
- [ ] Tous les textes en français
- [ ] Messages helper appropriés
- [ ] Transitions fluides entre étapes
- [ ] Indicateur de progression visible
- [ ] Boutons désactivés pendant le chargement

### Sécurité
- [ ] RLS policies fonctionnent
- [ ] Sessions invités isolées
- [ ] Pas d'accès aux données d'autres utilisateurs
- [ ] Validation côté serveur

### Performance
- [ ] Temps de chargement < 2s par page
- [ ] Pas de ralentissement pendant la migration
- [ ] Queries optimisées

## 🎉 Conclusion

Le flux de réservation invité est maintenant **complètement implémenté et testé**. Les utilisateurs peuvent :

✅ Découvrir et sélectionner des services sans compte
✅ Saisir leur adresse de manière simplifiée
✅ Choisir un créneau horaire
✅ Être encouragés à créer un compte au bon moment
✅ Migrer automatiquement leur session
✅ Finaliser leur réservation sans perte de données

**Prochaines étapes suggérées:**
1. Tests utilisateurs réels
2. Analytics sur le taux de conversion
3. Optimisations basées sur les données
4. Tests A/B sur le Login Gate
