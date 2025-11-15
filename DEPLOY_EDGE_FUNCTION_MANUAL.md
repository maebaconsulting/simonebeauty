# Déploiement Manuel de l'Edge Function via Dashboard

**Feature**: 007-contractor-interface
**Edge Function**: `submit-job-application`
**Project**: xpntvajwrjuvsqsmizzb (Simone)

---

## 🚀 Étapes de Déploiement Manuel

### 1. Accéder au Dashboard Supabase

1. Ouvrez votre navigateur
2. Allez sur: https://supabase.com/dashboard
3. Connectez-vous avec le compte qui a accès au projet Simone
4. Sélectionnez le projet **xpntvajwrjuvsqsmizzb**

### 2. Accéder aux Edge Functions

1. Dans le menu de gauche, cliquez sur **Edge Functions**
2. Cliquez sur le bouton **Create a new function** (ou **Deploy a new function**)

### 3. Créer la Fonction

1. **Function name**: `submit-job-application`
2. Cliquez sur **Create function**

### 4. Copier le Code de la Fonction

Ouvrez le fichier local:
```
supabase/functions/submit-job-application/index.ts
```

Copiez TOUT le contenu du fichier et collez-le dans l'éditeur du dashboard.

### 5. Déployer la Fonction

1. Cliquez sur **Deploy** ou **Save** en haut à droite
2. Attendez que le déploiement se termine (quelques secondes)
3. Vous devriez voir un message de succès

### 6. Configurer les Secrets (Variables d'Environnement)

1. Dans le menu de gauche, allez dans **Project Settings** (icône d'engrenage)
2. Cliquez sur **Edge Functions** dans la section Settings
3. Ou bien directement dans **Edge Functions** > **Manage secrets**

Ajoutez les secrets suivants :

**Secret 1:**
- **Key**: `RESEND_API_KEY`
- **Value**: `re_j84bXep9_HW6spBe6mSF5i4LRsEoWzfbr`

**Secret 2:**
- **Key**: `NEXT_PUBLIC_SITE_URL`
- **Value**: `http://localhost:3000` (ou votre URL de production)

4. Cliquez sur **Save** pour chaque secret

### 7. Vérifier le Déploiement

Retournez dans **Edge Functions** et vous devriez voir votre fonction `submit-job-application` avec le statut **Active**.

---

## 🧪 Test de la Fonction

### Test via le Dashboard

1. Dans **Edge Functions** > `submit-job-application`
2. Cliquez sur **Invoke function** ou **Test**
3. Utilisez ce payload de test :

```json
{
  "first_name": "Jean",
  "last_name": "Test",
  "email": "test@example.com",
  "phone": "+33612345678",
  "address": "123 Test Street, Paris",
  "profession": "Coiffeur",
  "years_of_experience": 5,
  "diplomas": "CAP Coiffure",
  "specialties": [1, 2],
  "services_offered": "Coupe, Coloration",
  "geographic_zones": ["Paris 1er", "Paris 2e"],
  "preferred_schedule": "Matin",
  "work_frequency": "3-4 jours",
  "motivation": "Je souhaite rejoindre Simone car..."
}
```

4. Cliquez sur **Invoke**
5. Vous devriez voir une réponse avec `success: true`

### Test via le Script Local

Depuis votre terminal, exécutez :

```bash
node scripts/test-edge-function.mjs
```

Vous devriez voir :
```
✅ Succès: { success: true, application_id: ..., message: "Candidature soumise avec succès" }
```

---

## 🎯 Test depuis l'Application

1. Ouvrez votre application: http://localhost:3000/rejoindre-simone
2. Remplissez le formulaire complet (5 étapes)
3. Soumettez la candidature
4. Vous devriez être redirigé vers `/rejoindre-simone/success`

### Vérifier dans la Base de Données

```bash
export PGPASSWORD='MoutBinam@007'
psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres -c "
SELECT id, first_name, last_name, email, profession, status, submitted_at
FROM contractor_applications
ORDER BY submitted_at DESC
LIMIT 1;
"
```

Vous devriez voir votre candidature !

---

## 🐛 Troubleshooting

### Erreur: "Function not found" après déploiement

**Solution**: Attendez 30 secondes et réessayez. Le déploiement peut prendre quelques instants.

### Erreur: "RESEND_API_KEY not configured"

**Solution**:
1. Vérifiez que vous avez bien ajouté le secret dans **Project Settings** > **Edge Functions** > **Secrets**
2. Redéployez la fonction (Edit > Save à nouveau)

### Erreur: "Database error" lors de la soumission

**Solution**: Vérifiez que :
1. La table `contractor_applications` existe
2. Les RLS policies sont correctes
3. Les migrations ont bien été appliquées

---

## 📋 Checklist Post-Déploiement

- [ ] Fonction visible dans Dashboard > Edge Functions
- [ ] Statut de la fonction = **Active**
- [ ] Secrets configurés (RESEND_API_KEY, NEXT_PUBLIC_SITE_URL)
- [ ] Test manuel via Dashboard réussi
- [ ] Test via script `node scripts/test-edge-function.mjs` réussi
- [ ] Test depuis l'application réussi
- [ ] Candidature visible dans la table `contractor_applications`
- [ ] Emails reçus (candidat + admin)

---

## 🔗 Liens Rapides

- **Dashboard Projet**: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb
- **Edge Functions**: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb/functions
- **Database**: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb/editor
- **Settings**: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb/settings/general

---

**Status**: 📝 Prêt pour déploiement manuel
**Temps estimé**: 5-10 minutes
