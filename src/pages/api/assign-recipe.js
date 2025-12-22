// src/pages/api/assign-recipe.js
import { getAuthenticatedSupabase } from "../../lib/auth";

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { day, id } = body;

    if (!day || !id) {
      return new Response("Paramètres manquants (day, id).", { status: 400 });
    }

    // Récupérer un client Supabase authentifié
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response("Non authentifié", { status: 401 });
    }

    // On stocke dans la table planning : 1 row = 1 jour avec user_id
    const { error } = await authSupabase
      .from('planning')
      .upsert({ day, recipe_id: id, user_id: user.id }, { onConflict: 'day,user_id' });

    if (error) {
      console.error("Erreur assign-recipe:", error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur assign-recipe:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
