// src/pages/api/planning/remove.js
import { db } from "../../firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { computeShoppingTotalsFromPlanning } from "../../lib/computeShoppingTotals";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day"); // ex: "lundi"
    if (!day) return new Response("Paramètre 'day' manquant.", { status: 400 });

    // 1) Retirer la recette du jour (on peut supprimer le doc ou vider recipeId)
    await deleteDoc(doc(db, "planning", day));

    // 2) Recalculer & sauvegarder la liste (remplacement total)
    const items = await computeShoppingTotalsFromPlanning();
    await setDoc(doc(db, "shoppingTotals", "current"), {
      items,
      savedAt: serverTimestamp(),
      updatedBy: "remove"
    });

    return new Response(null, { status: 303, headers: { Location: "/" } });
  } catch (e) {
    console.error("remove error:", e);
    return new Response("Erreur serveur", { status: 500 });
  }
}
