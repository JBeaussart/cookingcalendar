// src/pages/api/compute-shopping-totals.js
import { db } from "../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const debug = url.searchParams.get("debug");

    // 1. Charger le planning
    const planningSnap = await getDocs(collection(db, "planning"));
    const planning = planningSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // 1.b Charger la sélection Réception (aperitif/entree/plat/dessert)
    const receptionDoc = await getDoc(doc(db, "reception", "current"));
    const reception = receptionDoc.exists() ? receptionDoc.data() || {} : {};

    // 2. Récupérer toutes les recettes (avec duplication si la même recette est utilisée plusieurs fois)
    const recipeIds = [
      ...planning.map((p) => p.recipeId).filter(Boolean),
      reception.aperitifId || null,
      reception.entreeId || null,
      reception.platId || null,
      reception.dessertId || null,
    ].filter(Boolean);

    const loaded = [];
    const skipped = [];

    // Compter combien de fois chaque recette apparaît
    const recipeCount = {};
    for (const p of planning) {
      if (p.recipeId) {
        recipeCount[p.recipeId] = (recipeCount[p.recipeId] || 0) + 1;
      }
    }
    // Ajouter les 4 slots de la réception
    const slots = ["aperitifId", "entreeId", "platId", "dessertId"]; 
    for (const s of slots) {
      const id = reception[s];
      if (id) recipeCount[id] = (recipeCount[id] || 0) + 1;
    }

    for (const id of [...new Set(recipeIds)]) {
      try {
        const snap = await getDoc(doc(db, "recipes", id));
        if (snap.exists()) {
          loaded.push({ id: snap.id, ...snap.data() });
        } else {
          skipped.push(id);
        }
      } catch (e) {
        console.error("Erreur chargement recette", id, e);
        skipped.push(id);
      }
    }

    // 3. Calcul des totaux (agrégation)
    const totalsMap = new Map();

    const normalize = (s) =>
      String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    for (const recipe of loaded) {
      const count = recipeCount[recipe.id] || 1;
      const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

      for (const ing of ings) {
        const item = (typeof ing === "string" ? ing : ing?.item) || "";
        if (!item) continue;

        // Exclure sel/poivre
        const raw = item.toLowerCase();
        if (raw === "sel" || raw === "poivre") continue;

        const quantity =
          typeof ing === "object" && typeof ing.quantity !== "undefined"
            ? Number(ing.quantity) * count
            : undefined;
        const unit = typeof ing === "object" ? ing.unit || "" : "";

        const key = `${normalize(item)}|${normalize(unit)}`;
        const prev = totalsMap.get(key);

        if (!prev) {
          totalsMap.set(key, {
            item: item.trim(),
            quantity: Number.isFinite(quantity) ? quantity : undefined,
            unit: unit.trim(),
            checked: false,
          });
        } else {
          if (Number.isFinite(prev.quantity) && Number.isFinite(quantity)) {
            prev.quantity += quantity;
          } else if (
            !Number.isFinite(prev.quantity) &&
            Number.isFinite(quantity)
          ) {
            prev.quantity = quantity;
          }
          totalsMap.set(key, prev);
        }
      }
    }

    const aggregated = Array.from(totalsMap.values()).sort((a, b) =>
      a.item.localeCompare(b.item, "fr"),
    );

    const result = { ok: true, items: aggregated };

    if (debug) {
      result.debug = { planning, reception, recipeIds, loaded, skipped, aggregated };
    }

    return new Response(JSON.stringify(result), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Erreur compute-shopping-totals:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
