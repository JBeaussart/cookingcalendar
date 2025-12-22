// src/pages/api/remove-recipe.js
import { supabase } from "../../supabase";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day");

    if (!day) {
      return new Response("Paramètre 'day' manquant.", { status: 400 });
    }

    // 1. Récupérer l'ID de la recette avant suppression
    const { data: planningData } = await supabase
      .from('planning')
      .select('recipe_id')
      .eq('day', day)
      .single();

    const recipeId = planningData?.recipe_id;

    // 2. Si une recette était présente, nettoyer les items cochés dans shoppingTotals
    if (recipeId) {
      const { data: shoppingData } = await supabase
        .from('shopping_totals')
        .select('data')
        .limit(1)
        .single();

      if (shoppingData?.data) {
        const items = Array.isArray(shoppingData.data.items) ? shoppingData.data.items : [];

        // On filtre pour retirer les entrées liées à cette recette
        const suffix = `||recipe:${recipeId}`;
        const newItems = items.filter((it) => {
          const key = it.entryKey || "";
          return !key.endsWith(suffix);
        });

        if (newItems.length !== items.length) {
          await supabase
            .from('shopping_totals')
            .update({ data: { items: newItems } })
            .eq('id', shoppingData.id);
        }
      }
    }

    // 3. Supprimer la recette du planning (mettre recipe_id à null)
    await supabase
      .from('planning')
      .update({ recipe_id: null })
      .eq('day', day);

    console.log(`✅ Recette supprimée pour le jour ${day}`);

    return new Response(null, {
      status: 303,
      headers: { Location: "/" },
    });
  } catch (err) {
    console.error("❌ Erreur remove-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
