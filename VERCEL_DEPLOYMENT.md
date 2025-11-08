# Guide de Déploiement Vercel

## Configuration Vercel

Ce projet est configuré pour être déployé automatiquement sur Vercel depuis le dépôt GitHub.

### 1. Variables d'Environnement

Configurez les variables d'environnement suivantes dans Vercel Dashboard :

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://xpntvajwrjuvsqsmizzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_clé_anon_supabase>
```

#### Resend (Email)
```
RESEND_API_KEY=<votre_clé_api_resend>
```

### 2. Configuration du Projet

1. **Connecter le dépôt GitHub**
   - Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Cliquez sur "Add New..." > "Project"
   - Importez le dépôt `maebaconsulting/simonebeauty`

2. **Configuration Build**
   - Framework Preset: Next.js
   - Build Command: `pnpm run build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`
   - Node.js Version: 18.x

3. **Domaine personnalisé** (optionnel)
   - Configurez votre domaine personnalisé dans Vercel Dashboard > Domains

### 3. Déploiement Automatique

- Les pushs sur la branche `main` déclencheront un déploiement en production
- Les pushs sur d'autres branches créeront des previews automatiques

### 4. Configuration Supabase pour Production

Dans votre projet Supabase :

1. **Authentification**
   - Ajoutez l'URL de production Vercel dans "Redirect URLs"
   - Format: `https://votre-domaine.vercel.app/auth/callback`

2. **CORS**
   - Ajoutez l'URL de production dans les domaines autorisés

### 5. Commandes Utiles

```bash
# Installer les dépendances
pnpm install

# Développement local
pnpm dev

# Build de production
pnpm build

# Démarrer en mode production
pnpm start

# Tests
pnpm test
```

### 6. Régions

Le projet est configuré pour être déployé dans la région `cdg1` (Paris) pour de meilleures performances en France.

### 7. Support

Pour toute question sur le déploiement, consultez :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js](https://nextjs.org/docs/deployment)
- [Documentation Supabase](https://supabase.com/docs)
