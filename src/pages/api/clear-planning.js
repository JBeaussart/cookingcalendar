// src/pages/api/clear-planning.js
import { supabase } from "../../supabase";

const days = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export async function POST() {
  try {
    // On vide tous les recipe_id
    await supabase
      .from('planning')
      .update({ recipe_id: null })
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
