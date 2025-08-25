// src/pages/api/remove-recipe.js
import { db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day"); // ex: "lundi"

    if (!day) {
      return new Response("Paramètre 'day' manquant.", { status: 400 });
    }

    // Met le jour à vide dans planning/{day}
    await setDoc(doc(db, "planning", day), { recipeId: "" }, { merge: true });

    // Redirection vers la page planning (index)
    return new Response(null, { status: 303, headers: { Location: "/" } });
  } catch (err) {
    console.error("Erreur remove-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
