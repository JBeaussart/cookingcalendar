# 🔐 Configuration de l'authentification Supabase

Ce guide vous explique comment configurer Supabase pour permettre l'inscription et la connexion des utilisateurs.

## 📋 Étapes de configuration

### 1. Exécuter la migration SQL

1. **Ouvrez votre dashboard Supabase** : https://app.supabase.com
2. **Sélectionnez votre projet**
3. **Allez dans "SQL Editor"** (dans le menu de gauche)
4. **Cliquez sur "New query"**
5. **Copiez-collez le contenu du fichier** `scripts/auth_migration.sql`
6. **Cliquez sur "Run"** pour exécuter la migration

Cette migration va :
- ✅ Créer la table `user_profiles` avec les rôles (admin, premium, free)
- ✅ Ajouter `user_id` à toutes vos tables existantes
- ✅ Créer un trigger pour créer automatiquement un profil à l'inscription
- ✅ Configurer les policies RLS (Row Level Security)

### 2. Vérifier l'authentification

1. **Dans le dashboard Supabase**, allez dans **"Authentication"** (menu de gauche)
2. **Vérifiez que "Email" est activé** dans la section "Providers"
3. **Configurez les paramètres d'email** si nécessaire :
   - "Enable email confirmations" : Vous pouvez le désactiver pour le développement
   - "Secure email change" : Optionnel
   - "Double confirm email changes" : Optionnel

### 3. Configurer les variables d'environnement

Assurez-vous d'avoir ces variables dans votre fichier `.env` :

```env
PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

Pour trouver ces valeurs :
1. Dans Supabase, allez dans **"Settings"** > **"API"**
2. Copiez :
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon public** key → `PUBLIC_SUPABASE_ANON_KEY`

### 4. (Optionnel) Créer un utilisateur admin

Si vous voulez créer un utilisateur admin manuellement :

```sql
-- Dans SQL Editor de Supabase
-- Remplacez 'admin@example.com' par l'email de votre choix
-- L'utilisateur doit d'abord s'inscrire normalement, puis exécuter cette requête :

UPDATE user_profiles 
SET user_role = 'admin' 
WHERE email = 'admin@example.com';
```

Ou via l'interface Supabase :
1. Allez dans **"Authentication"** > **"Users"**
2. Trouvez l'utilisateur
3. Allez dans **"SQL Editor"** et exécutez la requête ci-dessus

### 5. Tester l'inscription

1. **Lancez votre application** : `npm run dev`
2. **Allez sur** `/signup` ou `/landing`
3. **Créez un compte** avec un email et un mot de passe
4. **Vérifiez dans Supabase** :
   - **Authentication** > **Users** : Vous devriez voir le nouvel utilisateur
   - **Table Editor** > **user_profiles** : Un profil avec `user_role = 'free'` devrait être créé automatiquement

## ⚠️ Problèmes courants

### L'inscription ne fonctionne pas

1. **Vérifiez les variables d'environnement** : `PUBLIC_SUPABASE_URL` et `PUBLIC_SUPABASE_ANON_KEY`
2. **Vérifiez la console du navigateur** pour les erreurs
3. **Vérifiez les logs Supabase** : Dashboard > Logs > API

### Le profil utilisateur n'est pas créé

1. **Vérifiez que le trigger est créé** :
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. **Vérifiez les logs** dans Supabase Dashboard > Logs > Database

### Les policies RLS bloquent les requêtes

1. **Vérifiez que vous êtes connecté** : Les cookies doivent contenir `sb-access-token`
2. **Vérifiez les policies** dans Supabase Dashboard > Authentication > Policies
3. **Testez avec un utilisateur connecté**

## 🔒 Sécurité

- ✅ Les mots de passe sont hashés automatiquement par Supabase
- ✅ Les tokens sont stockés dans des cookies HttpOnly
- ✅ Les policies RLS sécurisent les données par utilisateur
- ✅ Seuls les admins peuvent voir toutes les données

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)


