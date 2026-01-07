// src/pages/api/shopping-list-data.js
// Endpoint unifié pour récupérer toutes les données de la liste de courses en un seul appel
import { getAuthenticatedSupabase } from "../../lib/auth";

export async function GET({ request }) {
  try {
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Récupérer toutes les données en parallèle (3 requêtes au lieu de 3 appels API séparés)
    const [planningResult, receptionResult, shoppingTotalsResult, customItemsResult] = await Promise.all([
      authSupabase
        .from('planning')
        .select('day, recipe_id')
        .eq('user_id', user.id),
      authSupabase
        .from('reception')
        .select('data')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(),
      authSupabase
        .from('shopping_totals')
        .select('data')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(),
      authSupabase
        .from('shopping_custom')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
    ]);

    const planning = planningResult.data || [];
    const reception = receptionResult.data?.data || {};
    const savedTotals = shoppingTotalsResult.data?.data?.items || [];
    const customItems = customItemsResult.data || [];

    // Récupérer toutes les recettes référencées
    const recipeIds = [
      ...planning.map((p) => p.recipe_id).filter(Boolean),
      reception.aperitifId || null,
      reception.entreeId || null,
      reception.platId || null,
      reception.dessertId || null,
    ].filter(Boolean);

    // Compter combien de fois chaque recette apparaît
    const recipeCount = {};
    for (const p of planning) {
      if (p.recipe_id) {
        recipeCount[p.recipe_id] = (recipeCount[p.recipe_id] || 0) + 1;
      }
    }
    const slots = ["aperitifId", "entreeId", "platId", "dessertId"];
    for (const s of slots) {
      const id = reception[s];
      if (id) recipeCount[id] = (recipeCount[id] || 0) + 1;
    }

    // Charger les recettes uniques
    const uniqueRecipeIds = [...new Set(recipeIds)];
    let loadedRecipes = [];
    
    if (uniqueRecipeIds.length > 0) {
      const { data: recipesData } = await authSupabase
        .from('recipes')
        .select('id, title, ingredients')
        .in('id', uniqueRecipeIds)
        .eq('user_id', user.id);
      
      loadedRecipes = recipesData || [];
    }

    // Calculer les totaux (agrégation)
    const totalsMap = new Map();
    const normalize = (s) =>
      String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    for (const recipe of loadedRecipes) {
      const count = recipeCount[recipe.id] || 1;
      const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      const recipeTitle = String(recipe.title || "").trim() || "Recette";

      for (const ing of ings) {
        const item = (typeof ing === "string" ? ing : ing?.item) || "";
        if (!item) continue;

        // Exclure sel/poivre
        const raw = item.toLowerCase();
        if (raw === "sel" || raw === "poivre") continue;

        const quantity =
          typeof ing === "object" && typeof ing.quantity !== "undefined"
            ? Number(ing.quantity) * count
            : undefined;
        const unit = typeof ing === "object" ? ing.unit || "" : "";

        const key = `${normalize(item)}|${normalize(unit)}`;
        const prev = totalsMap.get(key);
        const quantityValue = Number.isFinite(quantity) ? quantity : undefined;

        if (!prev) {
          const recipeRefs = new Map();
          recipeRefs.set(recipe.id, {
            id: recipe.id,
            title: recipeTitle,
            occurrences: count,
            quantity: quantityValue,
          });
          totalsMap.set(key, {
            item: item.trim(),
            quantity: quantityValue,
            unit: unit.trim(),
            checked: false,
            recipeRefs,
          });
        } else {
          if (Number.isFinite(prev.quantity) && Number.isFinite(quantity)) {
            prev.quantity += quantity;
          } else if (!Number.isFinite(prev.quantity) && Number.isFinite(quantity)) {
            prev.quantity = quantity;
          }

          if (!prev.recipeRefs) prev.recipeRefs = new Map();

          const ref = prev.recipeRefs.get(recipe.id);
          if (ref) {
            ref.occurrences += count;
            if (Number.isFinite(ref.quantity) && Number.isFinite(quantityValue)) {
              ref.quantity += quantityValue;
            } else if (!Number.isFinite(ref.quantity) && Number.isFinite(quantityValue)) {
              ref.quantity = quantityValue;
            }
          } else {
            prev.recipeRefs.set(recipe.id, {
              id: recipe.id,
              title: recipeTitle,
              occurrences: count,
              quantity: quantityValue,
            });
          }
        }
      }
    }

    // Transformer en tableau
    const computedItems = Array.from(totalsMap.values()).map((entry) => {
      const recipeRefs = entry.recipeRefs || new Map();
      const recipes = Array.from(recipeRefs.values())
        .map((ref) => ({
          id: ref.id,
          title: ref.title,
          occurrences: ref.occurrences,
          ...(Number.isFinite(ref.quantity) ? { quantity: ref.quantity } : {}),
        }))
        .sort((a, b) => a.title.localeCompare(b.title, "fr"));
      const primaryRecipe = recipes.length ? recipes[0].title : "Autres";

      const { recipeRefs: _ignored, ...rest } = entry;
      return { ...rest, recipes, primaryRecipe };
    });

    computedItems.sort((a, b) => {
      const recipeCmp = a.primaryRecipe.localeCompare(b.primaryRecipe, "fr");
      if (recipeCmp !== 0) return recipeCmp;
      return a.item.localeCompare(b.item, "fr");
    });

    return new Response(JSON.stringify({
      ok: true,
      computed: computedItems,
      savedTotals,
      customItems,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Erreur shopping-list-data:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

