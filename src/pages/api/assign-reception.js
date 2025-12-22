// src/pages/api/assign-reception.js
import { supabase } from "../../supabase";

const SLOTS = new Set(["aperitif", "entree", "plat", "dessert"]);

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { slot, id } = body || {};

    if (!SLOTS.has(String(slot))) {
      return new Response("Slot invalide", { status: 400 });
    }

    const field = `${slot}Id`;

    // Récupérer ou créer le document reception
    const { data: existing } = await supabase
      .from('reception')
      .select('id, data')
      .limit(1)
      .single();

    const receptionData = existing?.data || {};
    receptionData[field] = id || null;

    if (existing) {
      await supabase
        .from('reception')
        .update({ data: receptionData })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('reception')
        .insert({ data: receptionData });
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
