// src/pages/api/custom-items.js
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * GET  -> retourne { items }
 * POST -> ajoute un item { item, quantity?, unit? }
 * PATCH-> met à jour un item (checked, quantity...) { item, unit?, checked?, quantity? }
 * DELETE -> supprime un item (query: ?item=...&unit=...)
 */

const REF = () => doc(db, "shoppingCustom", "current");

async function readItems() {
  const snap = await getDoc(REF());
  const data = snap.exists() ? snap.data() : { items: [] };
  return Array.isArray(data.items) ? data.items : [];
}

async function writeItems(items) {
  await setDoc(REF(), { items, savedAt: new Date() }, { merge: true });
}

export async function GET() {
  try {
    const items = await readItems();
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const item = String(body.item || "").trim();
    const unit = String(body.unit || "").trim();
    const q = body.quantity === undefined || body.quantity === null ? undefined : Number(body.quantity);
    if (!item) {
      return new Response(JSON.stringify({ ok: false, error: "item requis" }), { status: 400 });
    }

    const items = await readItems();
    // clé logique item+unit pour éviter les doublons
    const key = (it) => `${(it.item||"").trim().toLowerCase()}|||${(it.unit||"").trim().toLowerCase()}`;
    const kNew = `${item.toLowerCase()}|||${unit.toLowerCase()}`;
    const exists = items.findIndex(it => key(it) === kNew);

    if (exists >= 0) {
      // si déjà présent, on additionne la quantité si elle est numérique
      const curr = items[exists];
      const nq = Number.isFinite(q) ? q : undefined;
      if (Number.isFinite(curr.quantity) && Number.isFinite(nq)) curr.quantity += nq;
      else if (!Number.isFinite(curr.quantity) && Number.isFinite(nq)) curr.quantity = nq;
      // on garde checked tel quel
    } else {
      items.push({
        item, unit, checked: false, ...(Number.isFinite(q) ? { quantity: q } : {})
      });
    }

    await writeItems(items);
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
}

export async function PATCH({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const item = String(body.item || "").trim();
    const unit = String(body.unit || "").trim();
    if (!item) {
      return new Response(JSON.stringify({ ok: false, error: "item requis" }), { status: 400 });
    }

    const items = await readItems();
    const key = (it) => `${(it.item||"").trim().toLowerCase()}|||${(it.unit||"").trim().toLowerCase()}`;
    const k = `${item.toLowerCase()}|||${unit.toLowerCase()}`;
    const idx = items.findIndex(it => key(it) === k);
    if (idx < 0) {
      return new Response(JSON.stringify({ ok: false, error: "item introuvable" }), { status: 404 });
    }

    const up = items[idx];
    if (typeof body.checked === "boolean") up.checked = body.checked;
    if (body.quantity !== undefined && body.quantity !== null) {
      const q = Number(body.quantity);
      if (!Number.isNaN(q)) up.quantity = q;
    }
    if (typeof body.unit === "string") up.unit = unit;

    items[idx] = up;
    await writeItems(items);

    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
}

export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    const item = String(url.searchParams.get("item") || "").trim();
    const unit = String(url.searchParams.get("unit") || "").trim();

    if (!item) {
      return new Response(JSON.stringify({ ok: false, error: "item requis" }), { status: 400 });
    }

    const items = await readItems();
    const key = (it) => `${(it.item||"").trim().toLowerCase()}|||${(it.unit||"").trim().toLowerCase()}`;
    const k = `${item.toLowerCase()}|||${unit.toLowerCase()}`;
    const next = items.filter(it => key(it) !== k);

    await writeItems(next);
    return new Response(JSON.stringify({ ok: true, items: next }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
}
