# 🚀 Migration Firebase → Supabase

**Date de début** : 22 décembre 2025  
**Statut global** : 🟡 En cours

---

## 📋 Checklist de migration

### Phase 1 : Préparation Supabase ✅
- [x] Créer un compte Supabase
- [x] Créer un nouveau projet Supabase
- [x] Noter les credentials (URL + anon key depuis Settings > API)
- [x] Ajouter les variables d'environnement dans `.env`

### Phase 2 : Schéma de base de données ✅
- [x] Créer la table `recipes`
- [x] Créer la table `planning`
- [x] Créer la table `reception`
- [x] Créer la table `shopping_totals`
- [x] Créer la table `shopping_custom`
- [x] Configurer les index nécessaires
- [x] Configurer les Row Level Security (RLS) policies

### Phase 3 : Export des données Firebase ✅
- [x] Créer le dossier `exports/`
- [x] Exécuter le script d'export pour `recipes` (54 documents)
- [x] Exécuter le script d'export pour `planning` (7 documents)
- [x] Exécuter le script d'export pour `reception` (1 document)
- [x] Exécuter le script d'export pour `shoppingTotals` (1 document)
- [x] Exécuter le script d'export pour `shoppingCustom` (1 document)
- [x] Vérifier les fichiers JSON exportés

### Phase 4 : Transformation des données ✅
- [x] Transformer les recettes (recipes)
- [x] Transformer le planning
- [x] Transformer la réception
- [x] Transformer shopping_totals
- [x] Transformer shopping_custom
- [x] Vérifier les données transformées

### Phase 5 : Import dans Supabase ✅
- [x] Installer `@supabase/supabase-js`
- [x] Configurer la clé anon Supabase
- [x] Importer les recettes (54 recettes)
- [x] Sauvegarder le mapping des IDs (Firebase → Supabase)
- [x] Importer le planning (avec mapping des IDs - 7 jours)
- [x] Importer la réception (1 élément)
- [x] Importer shopping_totals (1 élément)
- [x] Importer shopping_custom (1 élément)
- [x] Vérifier l'intégrité des données dans Supabase

### Phase 6 : Mise à jour du code ✅
- [x] Créer `src/supabase.js`
- [x] Mettre à jour `src/pages/api/add-recipe.js`
- [x] Mettre à jour `src/pages/api/assign-recipe.js`
- [x] Mettre à jour `src/pages/api/assign-reception.js`
- [x] Mettre à jour `src/pages/api/clear-planning.js`
- [x] Mettre à jour `src/pages/api/compute-shopping-totals.js`
- [x] Mettre à jour `src/pages/api/custom-items.js`
- [x] Mettre à jour `src/pages/api/delete-recipe.js`
- [x] Mettre à jour `src/pages/api/move-recipe.js`
- [x] Mettre à jour `src/pages/api/remove-recipe.js`
- [x] Mettre à jour `src/pages/api/save-shopping-totals.js`
- [x] Mettre à jour `src/pages/api/update-recipe.js`
- [x] Mettre à jour `src/pages/index.astro`
- [x] Mettre à jour `src/pages/recipes/index.astro`
- [x] Mettre à jour `src/pages/recipes/[id].astro`
- [x] Mettre à jour `src/scripts/shopping-list.js`
- [x] Supprimer `src/firebase.js`
- [x] Supprimer les dépendances Firebase du `package.json`

### Phase 7 : Tests
- [ ] Test : Affichage de la liste des recettes
- [ ] Test : Affichage d'une recette individuelle
- [ ] Test : Ajout d'une nouvelle recette
- [ ] Test : Modification d'une recette
- [ ] Test : Suppression d'une recette
- [ ] Test : Assignation d'une recette au planning
- [ ] Test : Déplacement d'une recette dans le planning
- [ ] Test : Suppression d'une recette du planning
- [ ] Test : Calcul de la liste de courses
- [ ] Test : Ajout d'articles personnalisés
- [ ] Test : Suppression d'articles personnalisés
- [ ] Test : Build de production (`npm run build`)
- [ ] Test : Déploiement sur Netlify

### Phase 8 : Nettoyage
- [ ] Supprimer les scripts d'export/import
- [ ] Supprimer le dossier `exports/`
- [ ] Supprimer `serviceAccountKey.json`
- [ ] Supprimer les anciennes variables d'environnement Firebase
- [ ] Mettre à jour le README si nécessaire
- [ ] Commit final et merge de la branche

---

## 📝 Notes et problèmes rencontrés

### 🟢 Succès
- *À remplir au fur et à mesure*

### 🔴 Problèmes
- *À remplir au fur et à mesure*

### 💡 Améliorations possibles
- *À remplir au fur et à mesure*

---

## 🔗 Ressources utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Migration guide Firebase → Supabase](https://supabase.com/docs/guides/migrations/firebase)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📊 Statistiques

- **Collections Firebase** : 5
- **Tables Supabase** : 5
- **Fichiers API à migrer** : 11
- **Pages Astro à migrer** : 3
- **Scripts à migrer** : 1

---

## ⚙️ Commandes utiles

### Export Firebase
```bash
node scripts/exportFirebaseToJSON.js
```

### Transformation des données
```bash
node scripts/transformForSupabase.js
```

### Import dans Supabase
```bash
node scripts/importToSupabase.js
```

### Tests locaux
```bash
npm run dev
```

### Build de production
```bash
npm run build
```
