// src/lib/computeShoppingTotals.js
import { db } from "../firebase.js";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const norm = (s) => String(s || "").trim();
const key = (item, unit) => `${norm(item).toLowerCase()}|||${norm(unit).toLowerCase()}`;

/** Calcule la liste agrégée à partir du planning */
export async function computeShoppingTotalsFromPlanning() {
  // Récupérer tous les recipeId présents dans la collection "planning"
  const plSnap = await getDocs(collection(db, "planning"));
  const recipeIds = Array.from(new Set(
    plSnap.docs.map(d => (d.data()?.recipeId || "").toString().trim()).filter(Boolean)
  ));

  // Charger les recettes correspondantes
  const recipes = [];
  for (const id of recipeIds) {
    const r = await getDoc(doc(db, "recipes", id));
    if (r.exists()) recipes.push({ id: r.id, ...r.data() });
  }

  // Agréger ingrédients
  const map = new Map(); // key=item|unit -> { item, quantity?, unit, checked:false }
  for (const r of recipes) {
    const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
    for (const ing of ings) {
      const item = (typeof ing === "string" ? ing : ing?.item) || "";
      if (!item) continue;
      const low = item.toLowerCase();
      if (low === "sel" || low === "poivre") continue;

      const quantity = (typeof ing === "object" && ing.quantity !== undefined)
        ? Number(ing.quantity) : undefined;
      const unit = typeof ing === "object" ? (ing.unit || "") : "";

      const k = key(item, unit);
      const prev = map.get(k);
      if (!prev) {
        map.set(k, {
          item: norm(item),
          unit: norm(unit),
          checked: false,
          ...(Number.isFinite(quantity) ? { quantity } : {})
        });
      } else {
        if (Number.isFinite(prev.quantity) && Number.isFinite(quantity)) {
          prev.quantity += quantity;
        } else if (prev.quantity === undefined && Number.isFinite(quantity)) {
          prev.quantity = quantity;
        }
      }
    }
  }

  // Retourner tableau trié
  return Array.from(map.values()).sort((a, b) => a.item.localeCompare(b.item, "fr"));
}
