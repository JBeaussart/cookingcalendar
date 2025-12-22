// src/pages/api/assign-reception.js
import { getAuthenticatedSupabase } from "../../lib/auth";

const SLOTS = new Set(["aperitif", "entree", "plat", "dessert"]);

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

    const body = await request.json();
    const { slot, id } = body || {};

    if (!SLOTS.has(String(slot))) {
      return new Response("Slot invalide", { status: 400 });
    }

    const field = `${slot}Id`;

    // Récupérer ou créer le document reception de l'utilisateur
    const { data: existing } = await authSupabase
      .from('reception')
      .select('id, data')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const receptionData = existing?.data || {};
    receptionData[field] = id || null;

    if (existing) {
      await authSupabase
        .from('reception')
        .update({ data: receptionData })
        .eq('id', existing.id)
        .eq('user_id', user.id);
    } else {
      await authSupabase
        .from('reception')
        .insert({ data: receptionData, user_id: user.id });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur assign-reception:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
