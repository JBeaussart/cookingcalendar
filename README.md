# Cooking Calendar

Planificateur de repas construit avec [Astro](https://astro.build/) et Firebase. Gère un planning hebdomadaire, une sélection spéciale "Réception" et la liste de courses calculée automatiquement.

## 🚀 Démarrer

```bash
npm install
npm run dev
```

Build de production :

```bash
npm run build
npm run preview
```

## 🗂️ Structure principale

- `src/pages/index.astro` : planning des repas.
- `src/pages/recipes/` : catalogue, ajout/édition/suppression de recettes.
- `src/pages/reception.astro` : slots dédiés (Apéritif, Entrée, Plat, Dessert).
- `src/pages/shoppingList.astro` : liste de courses synchronisée (totaux + items custom).
- `src/pages/api/*` : endpoints Astro SSR pour manipuler Firestore.
- `src/components/` : composants partagés (`Navbar`, `Modal`).
- `scripts/` : scripts Node (seed, initialisation, CLI admin).

## 🔧 Configuration Firebase

Copiez votre configuration dans `src/firebase.js` et les scripts (`scripts/*.js`). Collections utilisées :

- `recipes`
- `planning`
- `reception/current`
- `shoppingTotals/current`
- `shoppingCustom/current`

## 🧪 Tests manuels suggérés

1. Ajouter une recette et l’assigner au planning.
2. Supprimer une recette utilisée par la réception et vérifier le nettoyage.
3. Générer la liste de courses, cocher/décocher les items et ajouter un item personnalisé.

## 🛠️ Outils supplémentaires

- `scripts/adminClient.js` : CLI CRUD pour Firestore via Firebase Admin.
- Pages de debug (`/debug-compute`, `/debug-shopping`) à utiliser uniquement en environnement de test.

