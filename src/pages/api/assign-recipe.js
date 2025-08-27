// src/pages/api/assign-recipe.js
import { db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { day, id } = body;

    if (!day || !id) {
      return new Response("Paramètres manquants (day, id).", { status: 400 });
    }

    // On stocke dans la collection planning : 1 doc = 1 jour
    await setDoc(doc(db, "planning", day), { recipeId: id }, { merge: true });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur assign-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
