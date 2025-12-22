// src/pages/api/delete-recipe.js
import { getAuthenticatedSupabase } from "../../lib/auth";

export async function DELETE({ request }) {
  try {
    // Récupérer un client Supabase authentifié
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Paramètre 'id' manquant.", { status: 400 });
    }

    // Supprimer la recette (uniquement si elle appartient à l'utilisateur)
    const { error: deleteError } = await authSupabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // S'assurer que l'utilisateur ne peut supprimer que ses propres recettes

    if (deleteError) {
      console.error("❌ delete-recipe error:", deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Nettoyer le planning (mettre recipe_id à null pour les jours qui utilisaient cette recette)
    const { error: planningError } = await authSupabase
      .from('planning')
      .update({ recipe_id: null })
      .eq('recipe_id', id)
      .eq('user_id', user.id); // Nettoyer uniquement le planning de l'utilisateur

    if (planningError) {
      console.warn("⚠️ Erreur lors du nettoyage du planning:", planningError);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ delete-recipe error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
