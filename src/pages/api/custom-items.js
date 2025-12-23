// src/pages/api/custom-items.js
import { getAuthenticatedSupabase } from "../../lib/auth";

/**
 * GET  -> retourne { items }
 * POST -> ajoute un item { item, quantity?, unit? }
 * PATCH-> met à jour un item (checked, quantity...) { item, unit?, checked?, quantity? }
 * DELETE -> supprime un item (query: ?item=...&unit=...)
 */

async function readItems(authSupabase, userId) {
  const { data } = await authSupabase
    .from('shopping_custom')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return data || [];
}

export async function GET({ request }) {
  try {
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Non authentifié" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Extraire l'ID utilisateur
    const userId = user?.id || user?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "ID utilisateur manquant" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    const items = await readItems(authSupabase, userId);
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
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Non authentifié" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Extraire l'ID utilisateur
    const userId = user?.id || user?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "ID utilisateur manquant" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

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

    // Vérifier si l'item existe déjà pour cet utilisateur
    const { data: existing } = await authSupabase
      .from('shopping_custom')
      .select('*')
      .eq('user_id', userId)
      .ilike('item', item);

    const exists = existing?.find(it =>
      it.item.toLowerCase() === item.toLowerCase() && it.user_id === userId
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

      await authSupabase
        .from('shopping_custom')
        .update({ quantity: newQuantity })
        .eq('id', exists.id)
        .eq('user_id', userId);
    } else {
      // Créer un nouvel item
      await authSupabase
        .from('shopping_custom')
        .insert({
          item,
          checked: false,
          user_id: userId,
          ...(Number.isFinite(q) ? { quantity: q } : {}),
        });
    }

    const items = await readItems(authSupabase, userId);
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
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Non authentifié" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Extraire l'ID utilisateur
    const userId = user?.id || user?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "ID utilisateur manquant" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const item = String(body.item || "").trim();

    if (!item) {
      return new Response(JSON.stringify({ ok: false, error: "item requis" }), {
        status: 400,
      });
    }

    // Trouver l'item pour cet utilisateur
    const { data: existing } = await authSupabase
      .from('shopping_custom')
      .select('*')
      .eq('user_id', userId)
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

    await authSupabase
      .from('shopping_custom')
      .update(updates)
      .eq('id', existing[0].id)
      .eq('user_id', userId);

    const items = await readItems(authSupabase, userId);
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
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Non authentifié" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Extraire l'ID utilisateur
    const userId = user?.id || user?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "ID utilisateur manquant" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const deleteAll = url.searchParams.get("all");

    if (deleteAll) {
      await authSupabase
        .from('shopping_custom')
        .delete()
        .eq('user_id', userId);
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

    await authSupabase
      .from('shopping_custom')
      .delete()
      .eq('user_id', userId)
      .ilike('item', item);

    const items = await readItems(authSupabase, userId);
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
