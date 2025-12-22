// src/pages/api/clear-planning.js
import { getAuthenticatedSupabase } from "../../lib/auth";

const days = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export async function POST({ request }) {
  try {
    // Récupérer un client Supabase authentifié
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // On vide tous les recipe_id du planning de l'utilisateur
    await authSupabase
      .from('planning')
      .update({ recipe_id: null })
      .eq('user_id', user.id)
      .in('day', days);

    return new Response(null, {
      status: 303,
      headers: { Location: "/" },
    });
  } catch (err) {
    console.error("Erreur clear-planning:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
