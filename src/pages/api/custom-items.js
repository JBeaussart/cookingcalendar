// src/pages/api/custom-items.js
import { supabase } from "../../supabase";

/**
 * GET  -> retourne { items }
 * POST -> ajoute un item { item, quantity?, unit? }
 * PATCH-> met à jour un item (checked, quantity...) { item, unit?, checked?, quantity? }
 * DELETE -> supprime un item (query: ?item=...&unit=...)
 */

async function readItems() {
  const { data } = await supabase
    .from('shopping_custom')
    .select('*')
    .order('created_at', { ascending: true });

  return data || [];
}

export async function GET() {
  try {
    const items = await readItems();
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const item = String(body.item || "").trim();
    const unit = String(body.unit || "").trim();
    const q =
      body.quantity === undefined || body.quantity === null
        ? undefined
        : Number(body.quantity);
    if (!item) {
      return new Response(JSON.stringify({ ok: false, error: "item requis" }), {
        status: 400,
      });
    }

    // Vérifier si l'item existe déjà
    const { data: existing } = await supabase
      .from('shopping_custom')
      .select('*')
      .ilike('item', item);

    const exists = existing?.find(it =>
      it.item.toLowerCase() === item.toLowerCase()
    );

    if (exists) {
      // Si déjà présent, on additionne la quantité si elle est numérique
      const nq = Number.isFinite(q) ? q : undefined;
      let newQuantity = exists.quantity;

      if (Number.isFinite(exists.quantity) && Number.isFinite(nq)) {
        newQuantity = exists.quantity + nq;
      } else if (!Number.isFinite(exists.quantity) && Number.isFinite(nq)) {
        newQuantity = nq;
      }

      await supabase
        .from('shopping_custom')
        .update({ quantity: newQuantity })
        .eq('id', exists.id);
    } else {
      // Créer un nouvel item
      await supabase
        .from('shopping_custom')
        .insert({
          item,
          checked: false,
          ...(Number.isFinite(q) ? { quantity: q } : {}),
        });
    }

    const items = await readItems();
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

export async function PATCH({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const item = String(body.item || "").trim();

    if (!item) {
      return new Response(JSON.stringify({ ok: false, error: "item requis" }), {
        status: 400,
      });
    }

    // Trouver l'item
    const { data: existing } = await supabase
      .from('shopping_custom')
      .select('*')
      .ilike('item', item)
      .limit(1);

    if (!existing || existing.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "item introuvable" }),
        { status: 404 },
      );
    }

    const updates = {};
    if (typeof body.checked === "boolean") updates.checked = body.checked;
    if (body.quantity !== undefined && body.quantity !== null) {
      const q = Number(body.quantity);
      if (!Number.isNaN(q)) updates.quantity = q;
    }

    await supabase
      .from('shopping_custom')
      .update(updates)
      .eq('id', existing[0].id);

    const items = await readItems();
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    const deleteAll = url.searchParams.get("all");

    if (deleteAll) {
      await supabase.from('shopping_custom').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return new Response(JSON.stringify({ ok: true, items: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const item = String(url.searchParams.get("item") || "").trim();

    if (!item) {
      return new Response(JSON.stringify({ ok: false, error: "item requis" }), {
        status: 400,
      });
    }

    await supabase
      .from('shopping_custom')
      .delete()
      .ilike('item', item);

    const items = await readItems();
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
