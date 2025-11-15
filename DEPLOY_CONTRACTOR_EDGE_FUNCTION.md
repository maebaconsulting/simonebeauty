# Déploiement Edge Function - Contractor Application

**Feature**: 007-contractor-interface
**Edge Function**: `submit-job-application`
**Date**: 2025-11-08

---

## Prérequis

- [x] Supabase CLI installé: `npm install -g supabase`
- [x] Clé API Resend configurée dans `.env.local`

---

## 🚀 Étapes de Déploiement

### 1. Connexion au Projet Supabase

```bash
# Se connecter à Supabase (ouvrira le navigateur)
supabase login

# Lier le projet
supabase link --project-ref xpntvajwrjuvsqsmizzb
```

### 2. Déployer la Fonction

```bash
# Déployer submit-job-application
supabase functions deploy submit-job-application

# La fonction sera disponible sur:
# https://xpntvajwrjuvsqsmizzb.supabase.co/functions/v1/submit-job-application
```

### 3. Configurer les Secrets

```bash
# Configurer la clé Resend (pour l'envoi d'emails)
supabase secrets set RESEND_API_KEY=re_j84bXep9_HW6spBe6mSF5i4LRsEoWzfbr

# Configurer l'URL du site (pour les liens dans les emails)
supabase secrets set NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Vérifier le Déploiement

```bash
# Lister les fonctions déployées
supabase functions list

# Voir les logs
supabase functions logs submit-job-application
```

---

## 🧪 Test de l'Edge Function

### Test Basique avec curl

```bash
# Préparer un fichier de test
echo "Test CV content" > test-cv.txt

# Appeler la fonction
curl -i --location --request POST \
  'https://xpntvajwrjuvsqsmizzb.supabase.co/functions/v1/submit-job-application' \
  --header "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --form 'data={"first_name":"Jean","last_name":"Test","email":"test@example.com","phone":"+33612345678","address":"123 Test St","profession":"Coiffeur","years_of_experience":5,"specialties":[1,2],"services_offered":"Coupe, Coloration","geographic_zones":["Paris 1er","Paris 2e"],"work_frequency":"3-4 jours","motivation":"Je souhaite rejoindre Simone"}' \
  --form 'cv_file=@test-cv.txt'
```

### Réponse Attendue

```json
{
  "success": true,
  "application_id": 123,
  "message": "Candidature soumise avec succès"
}
```

---

## 🔍 Vérification dans la Base de Données

```bash
# Se connecter à la base
export PGPASSWORD='MoutBinam@007'
psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres

# Vérifier les candidatures
SELECT id, first_name, last_name, email, profession, status, submitted_at
FROM contractor_applications
ORDER BY submitted_at DESC
LIMIT 5;

# Vérifier les tâches backoffice créées
SELECT id, type, status, title, created_at
FROM backoffice_tasks
WHERE type = 'job_application'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📧 Vérification des Emails

Après soumission d'une candidature, 2 emails doivent être envoyés:

### Email 1: Confirmation au Candidat
- **To**: Email du candidat
- **Subject**: "Candidature reçue - Simone Paris"
- **Contenu**: Confirmation + récapitulatif + prochaines étapes

### Email 2: Notification Admin
- **To**: contact@simone.paris
- **Subject**: "Nouvelle candidature: [Nom] ([Profession])"
- **Contenu**: Détails complets + lien vers backoffice

---

## 🐛 Troubleshooting

### Erreur: "supabase: command not found"

```bash
# Installer Supabase CLI
npm install -g supabase

# Vérifier l'installation
supabase --version
```

### Erreur: "Failed to deploy function"

**Cause**: Erreur de syntaxe dans le code TypeScript

**Solution**:
```bash
# Vérifier la syntaxe du fichier
cd supabase/functions/submit-job-application
deno check index.ts
```

### Erreur: "RESEND_API_KEY not configured"

**Cause**: Secret non configuré

**Solution**:
```bash
# Vérifier les secrets
supabase secrets list

# Configurer si absent
supabase secrets set RESEND_API_KEY=re_xxx
```

### Erreur: "File upload failed"

**Cause**: Bucket Storage non créé ou RLS mal configuré

**Solution**:
```bash
# Vérifier que le bucket existe
# Aller dans: Supabase Dashboard > Storage > Buckets
# Le bucket 'job-applications' doit exister et être privé
```

---

## 📊 Monitoring

### Logs en Temps Réel

```bash
# Suivre les logs de la fonction
supabase functions logs submit-job-application --follow
```

### Dashboard Supabase

- **Edge Functions**: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb/functions
- **Logs**: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb/logs/edge-functions

---

## ✅ Checklist Post-Déploiement

- [ ] Fonction déployée sans erreurs
- [ ] Secrets configurés (RESEND_API_KEY, NEXT_PUBLIC_SITE_URL)
- [ ] Test curl réussi
- [ ] Candidature visible dans contractor_applications
- [ ] Tâche backoffice créée
- [ ] Emails reçus (candidat + admin)
- [ ] Logs sans erreurs

---

## 🔗 Liens Utiles

- **Supabase Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **Resend API**: https://resend.com/docs/api-reference/emails/send-email
- **Project Dashboard**: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb

---

**Status**: 📝 À déployer
**Last Updated**: 2025-11-08
