# 🔄 Guide d'import Firebase → Supabase

Ce guide vous explique comment importer toutes vos données Firebase dans Supabase avec la gestion des `user_id`.

## 📋 Prérequis

1. **Variables d'environnement configurées** dans `.env` :
   ```env
   # Firebase
   PUBLIC_FIREBASE_API_KEY=your-api-key
   PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   PUBLIC_FIREBASE_APP_ID=your-app-id

   # Supabase
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Migration SQL exécutée** : Assurez-vous d'avoir exécuté `scripts/auth_migration.sql` dans Supabase

3. **Au moins un utilisateur créé** dans Supabase (via l'inscription sur votre site)

## 📦 Installation des dépendances

Si Firebase n'est pas encore installé :

```bash
npm install firebase
```

## 🚀 Exécution de l'import

### Option 1 : Via npm script (recommandé)

```bash
npm run import:firebase
```

### Option 2 : Directement

```bash
node scripts/importFirebaseToSupabase.js
```

## 📝 Processus d'import

Le script va :

1. **Exporter toutes les données depuis Firebase** :
   - `recipes`
   - `planning`
   - `reception`
   - `shoppingTotals`
   - `shoppingCustom`

2. **Vous demander un `user_id`** :
   - Le script cherche automatiquement le premier utilisateur dans Supabase
   - Vous pouvez l'utiliser ou entrer un autre UUID

3. **Importer toutes les données dans Supabase** :
   - Toutes les données seront associées au `user_id` choisi
   - Les recettes seront importées avec mapping des IDs
   - Le planning sera lié aux nouvelles recettes

## ⚠️ Important

- **Les données existantes dans Supabase seront conservées**
- **Les nouvelles données seront ajoutées** (pas de remplacement)
- **Toutes les données importées seront associées au même `user_id`**
- Si vous avez plusieurs utilisateurs, vous devrez peut-être réimporter pour chaque utilisateur

## 🔍 Vérification

Après l'import, vérifiez dans Supabase Dashboard :

1. **Table `recipes`** : Devrait contenir toutes vos recettes avec `user_id`
2. **Table `planning`** : Devrait contenir le planning avec `user_id` et `recipe_id` mappés
3. **Autres tables** : `reception`, `shopping_totals`, `shopping_custom` avec `user_id`

## 🐛 Dépannage

### Erreur "Variables Firebase manquantes"
- Vérifiez que toutes les variables Firebase sont dans `.env`
- Redémarrez le terminal après avoir ajouté les variables

### Erreur "Variables Supabase manquantes"
- Vérifiez `PUBLIC_SUPABASE_URL` et `PUBLIC_SUPABASE_ANON_KEY` dans `.env`

### Erreur "user_id is required"
- Assurez-vous d'avoir au moins un utilisateur dans Supabase
- Créez un compte via `/signup` si nécessaire

### Erreur de permissions RLS
- Vérifiez que la migration SQL a bien été exécutée
- Les policies RLS doivent permettre l'insertion avec `user_id`

## 📊 Statistiques

Le script affichera :
- Nombre de documents exportés depuis Firebase
- Nombre de documents importés dans Supabase
- Nombre d'erreurs éventuelles


