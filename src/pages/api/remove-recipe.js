// src/pages/api/remove-recipe.js
import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day");

    if (!day) {
      return new Response("Paramètre 'day' manquant.", { status: 400 });
    }

    // Cherche la/les recette(s) assignée(s) à ce jour
    const q = query(collection(db, "recipes"), where("day", "==", day));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Rien à retirer, on redirige quand même vers le planning
      return new Response(null, { status: 303, headers: { Location: "/" } });
    }

    // Retire le 'day' de la première recette trouvée
    const first = snap.docs[0];
    await updateDoc(doc(db, "recipes", first.id), { day: "" });

    return new Response(null, { status: 303, headers: { Location: "/" } });
  } catch (err) {
    console.error("Erreur remove-recipe:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
