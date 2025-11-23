// src/pages/api/remove-recipe.js
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day");

    if (!day) {
      return new Response("Paramètre 'day' manquant.", { status: 400 });
    }

    // 1. Récupérer l'ID de la recette avant suppression
    const planningRef = doc(db, "planning", day);
    const planningSnap = await getDoc(planningRef);
    const recipeId = planningSnap.exists() ? planningSnap.data()?.recipeId : null;

    // 2. Si une recette était présente, nettoyer les items cochés dans shoppingTotals
    if (recipeId) {
      const shoppingRef = doc(db, "shoppingTotals", "current");
      const shoppingSnap = await getDoc(shoppingRef);

      if (shoppingSnap.exists()) {
        const data = shoppingSnap.data() || {};
        const items = Array.isArray(data.items) ? data.items : [];

        // On filtre pour retirer les entrées liées à cette recette
        const suffix = `||recipe:${recipeId}`;
        const newItems = items.filter((it) => {
          const key = it.entryKey || "";
          return !key.endsWith(suffix);
        });

        if (newItems.length !== items.length) {
          await setDoc(shoppingRef, { items: newItems }, { merge: true });
        }
      }
    }

    // 3. Supprimer la recette du planning
    await setDoc(planningRef, { recipeId: "" }, { merge: true });

    console.log(`✅ Recette supprimée pour le jour ${day}`);

    return new Response(null, {
      status: 303,
      headers: { Location: "/" },
    });
  } catch (err) {
    console.error("❌ Erreur remove-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
