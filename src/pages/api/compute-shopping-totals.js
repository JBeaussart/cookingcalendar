// src/lib/computeShoppingTotals.js
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

/**
 * Agrège la liste de courses à partir de "planning" (docs: { recipeId })
 * et "recipes/{id}" (champ ingredients).
 * Multiplie les quantités si une même recette est planifiée plusieurs fois.
 * @param {import('firebase/firestore').Firestore} db
 * @param {object} opts  { debug?: boolean }
 * @returns {Promise<{ items: Array<{item:string, quantity?:number, unit?:string, checked:boolean}>, debug?: any }>}
 */
export async function computeShoppingTotals(db, opts = {}) {
  const debug = {
    version: "v2-mult-by-count",
    planning: [],
    recipeCounts: {},
    loaded: [],
    skipped: [],
    aggregated: []
  };

  // 1) Lire planning → compter les occurrences par recipeId (PAS de Set)
  const plSnap = await getDocs(collection(db, "planning"));
  const counts = new Map(); // recipeId -> occurrences
  for (const d of plSnap.docs) {
    const recipeId = (d.data()?.recipeId ?? "").toString().trim();
    if (opts.debug) debug.planning.push({ id: d.id, recipeId });
    if (!recipeId) continue;
    counts.set(recipeId, (counts.get(recipeId) || 0) + 1);
  }
  if (opts.debug) debug.recipeCounts = Object.fromEntries(counts);

  const recipeIds = Array.from(counts.keys());

  // 2) Charger chaque recette une seule fois
  const recipes = [];
  for (const id of recipeIds) {
    try {
      const r = await getDoc(doc(db, "recipes", id));
      if (r.exists()) {
        const data = r.data();
        recipes.push({ id: r.id, ...data });
        if (opts.debug) debug.loaded.push({ id: r.id, title: data?.title ?? null, times: counts.get(id) });
      } else {
        if (opts.debug) debug.skipped.push({ id, reason: "recipe not found" });
      }
    } catch (e) {
      if (opts.debug) debug.skipped.push({ id, reason: String(e?.message || e) });
    }
  }

  // 3) Agréger ingrédients (multiplication par occurrences)
  const map = new Map(); // key=item|unit -> { item, unit, quantity?, checked:false }
  const norm = (s) => String(s || "").trim();
  const key = (item, unit) => `${norm(item).toLowerCase()}|||${norm(unit).toLowerCase()}`;

  for (const r of recipes) {
    const mult = counts.get(r.id) || 1;
    const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
    for (const ing of ings) {
      const item = (typeof ing === "string" ? ing : ing?.item) || "";
      if (!item) continue;
      const low = item.toLowerCase();
      if (low === "sel" || low === "poivre") continue;

      const baseQty = (typeof ing === "object" && ing.quantity !== undefined)
        ? Number(ing.quantity)
        : undefined;
      const unit = typeof ing === "object" ? (ing.unit || "") : "";

      const k = key(item, unit);
      const prev = map.get(k);

      // Quantité ajustée par le nombre d'occurrences
      const adjQty = Number.isFinite(baseQty) ? baseQty * mult : undefined;

      if (!prev) {
        map.set(k, {
          item: norm(item),
          unit: norm(unit),
          checked: false,
          ...(Number.isFinite(adjQty) ? { quantity: adjQty } : {})
        });
      } else {
        if (Number.isFinite(prev.quantity) && Number.isFinite(adjQty)) {
          prev.quantity += adjQty;
        } else if (prev.quantity === undefined && Number.isFinite(adjQty)) {
          prev.quantity = adjQty;
        }
        map.set(k, prev);
      }
    }
  }

  const items = Array.from(map.values()).sort((a, b) => a.item.localeCompare(b.item, "fr"));
  if (opts.debug) debug.aggregated = items;
  return opts.debug ? { items, debug } : { items };
}
