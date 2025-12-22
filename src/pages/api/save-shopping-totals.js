// src/pages/api/save-shopping-totals.js
import { supabase } from "../../supabase";

// GET -> renvoie les items existants (et crée le doc s'il n'existe pas)
export async function GET() {
  try {
    const { data } = await supabase
      .from('shopping_totals')
      .select('data')
      .limit(1)
      .single();

    if (!data) {
      // Créer un document initial
      await supabase
        .from('shopping_totals')
        .insert({ data: { items: [] } });

      return new Response(JSON.stringify({ ok: true, items: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const items = Array.isArray(data.data?.items) ? data.data.items : [];
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/save-shopping-totals error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

// POST -> sauvegarde les items fournis
export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.items)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Bad payload: items[]" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const items = body.items.map((it) => {
      const item = String(it?.item || "").trim();
      const unit = String(it?.unit || "").trim();
      const entryKey =
        typeof it?.entryKey === "string" && it.entryKey.trim()
          ? it.entryKey.trim()
          : "";
      const q =
        it?.quantity === null || typeof it?.quantity === "undefined"
          ? undefined
          : Number(it.quantity);
      return {
        item,
        unit,
        checked: !!it?.checked,
        ...(Number.isFinite(q) ? { quantity: q } : {}),
        ...(entryKey ? { entryKey } : {}),
      };
    });

    // Récupérer l'ID du document existant ou créer
    const { data: existing } = await supabase
      .from('shopping_totals')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('shopping_totals')
        .update({ data: { items } })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('shopping_totals')
        .insert({ data: { items } });
    }

    return new Response(JSON.stringify({ ok: true, count: items.length }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("POST /api/save-shopping-totals error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
