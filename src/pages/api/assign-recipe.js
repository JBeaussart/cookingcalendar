// src/pages/api/assign-recipe.js
import { db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day"); // ex: "lundi"
    const id  = url.searchParams.get("id");  // recipeId

    if (!day || !id) {
      return new Response("Paramètres manquants (day, id).", { status: 400 });
    }

    // Écrit le recipeId dans planning/{day} (crée le doc s'il n'existe pas)
    await setDoc(doc(db, "planning", day), { recipeId: id }, { merge: true });

    // Redirection vers le planning (index)
    return new Response(null, { status: 303, headers: { Location: "/" } });
  } catch (err) {
    console.error("Erreur assign-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
