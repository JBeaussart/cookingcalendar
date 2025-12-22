// src/pages/api/delete-recipe.js
import { supabase } from "../../supabase";

export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Paramètre 'id' manquant.", { status: 400 });
    }

    // Supprimer la recette
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("❌ delete-recipe error:", deleteError);
      return new Response("Erreur lors de la suppression", { status: 500 });
    }

    // Nettoyer le planning (mettre recipe_id à null pour les jours qui utilisaient cette recette)
    const { error: planningError } = await supabase
      .from('planning')
      .update({ recipe_id: null })
      .eq('recipe_id', id);

    if (planningError) {
      console.warn("⚠️ Erreur lors du nettoyage du planning:", planningError);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ delete-recipe error:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
