// src/pages/api/compute-shopping-totals.js
import { db } from "../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

function norm(s) {
  return String(s || "").trim();
}

export async function GET() {
  try {
    // 1) Lire le planning -> récupérer les recipeId (uniques)
    const plSnap = await getDocs(collection(db, "planning"));
    const recipeIds = Array.from(
      new Set(
        plSnap.docs.map(d => (d.data()?.recipeId || "").toString().trim()).filter(Boolean)
      )
    );

    // 2) Charger les recettes
    const recipes = [];
    for (const id of recipeIds) {
      const r = await getDoc(doc(db, "recipes", id));
      if (r.exists()) recipes.push({ id: r.id, ...r.data() });
    }

    // 3) Agréger ingrédients
    const map = new Map(); // key=item|unit (en minuscule) -> { item, quantity?, unit }
    const key = (item, unit) =>
      `${norm(item).toLowerCase()}|||${norm(unit).toLowerCase()}`;

    for (const r of recipes) {
      const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
      for (const ing of ings) {
        const item = (typeof ing === "string" ? ing : ing?.item) || "";
        if (!item) continue;
        const low = item.toLowerCase();
        if (low === "sel" || low === "poivre") continue;

        const quantity = typeof ing === "object" && ing.quantity !== undefined
          ? Number(ing.quantity) : undefined;
        const unit = typeof ing === "object" ? (ing.unit || "") : "";

        const k = key(item, unit);
        const prev = map.get(k);
        if (!prev) {
          map.set(k, { item: norm(item), unit: norm(unit), ...(Number.isFinite(quantity) ? { quantity } : {}) });
        } else {
          if (Number.isFinite(prev.quantity) && Number.isFinite(quantity)) {
            prev.quantity += quantity;
          } else if (prev.quantity === undefined && Number.isFinite(quantity)) {
            prev.quantity = quantity;
          }
        }
      }
    }

    const items = Array.from(map.values()).sort((a, b) => a.item.localeCompare(b.item, "fr"));

    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("compute-shopping-totals GET:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }
}
