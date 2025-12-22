// src/pages/api/assign-recipe.js
import { supabase } from "../../supabase";

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { day, id } = body;

    if (!day || !id) {
      return new Response("Paramètres manquants (day, id).", { status: 400 });
    }

    // On stocke dans la table planning : 1 row = 1 jour
    const { error } = await supabase
      .from('planning')
      .upsert({ day, recipe_id: id }, { onConflict: 'day' });

    if (error) {
      console.error("Erreur assign-recipe:", error);
      return new Response("Erreur serveur", { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur assign-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
