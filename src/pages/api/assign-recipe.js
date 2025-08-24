// src/pages/api/assign-recipe.js
import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day");
    const id = url.searchParams.get("id");

    if (!day || !id) {
      return new Response("Paramètres manquants (day, id).", { status: 400 });
    }

    await updateDoc(doc(db, "recipes", id), { day });

    // Redirige vers le planning (change "/" en "/planning" si besoin)
    return new Response(null, {
      status: 303,
      headers: { Location: "/" },
    });
  } catch (err) {
    console.error("Erreur assign-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
