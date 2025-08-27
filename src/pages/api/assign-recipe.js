// src/pages/api/planning/assign.js
import { db } from "../../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { computeShoppingTotalsFromPlanning } from "../../lib/computeShoppingTotals";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day");      // ex: "lundi"
    const id = url.searchParams.get("id");        // recipeId

    if (!day || !id) {
      return new Response("Paramètres manquants (day,id).", { status: 400 });
    }

    // 1) Assigner la recette au jour (doc id = nom du jour)
    await setDoc(doc(db, "planning", day), { recipeId: id }, { merge: true });

    // 2) Recalculer & sauvegarder la liste de courses (remplacement total)
    const items = await computeShoppingTotalsFromPlanning();
    await setDoc(doc(db, "shoppingTotals", "current"), {
      items,
      savedAt: serverTimestamp(),
      updatedBy: "assign"
    });

    // Rediriger où tu veux (planning)
    return new Response(null, { status: 303, headers: { Location: "/" } });
  } catch (e) {
    console.error("assign error:", e);
    return new Response("Erreur serveur", { status: 500 });
  }
}
