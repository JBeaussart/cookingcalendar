// src/pages/api/remove-recipe.js
import { db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day");

    if (!day) {
      return new Response("Paramètre 'day' manquant.", { status: 400 });
    }

    // On supprime la recette associée au jour (on met recipeId = "")
    await setDoc(
      doc(db, "planning", day),
      { recipeId: "" },
      { merge: true },
    );

    console.log(`✅ Recette supprimée pour le jour ${day}`);

    return new Response(null, {
      status: 303,
      headers: { Location: "/" }, // redirige vers la page planning ("/" chez toi)
    });
  } catch (err) {
    console.error("❌ Erreur remove-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
