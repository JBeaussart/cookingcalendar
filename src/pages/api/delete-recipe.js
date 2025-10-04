// src/pages/api/delete-recipe.js
import { db } from "../../firebase";
import {
  doc,
  deleteDoc,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  setDoc,
} from "firebase/firestore";

export async function DELETE({ request }) {
  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id");
    if (!id) {
      const body = await request.json().catch(() => null);
      id = body?.id;
    }
    if (!id) {
      return new Response("Paramètre 'id' manquant.", { status: 400 });
    }

    // Supprimer la recette
    await deleteDoc(doc(db, "recipes", id));

    // Nettoyer le planning (retire la recette si utilisée)
    const qPlanning = query(
      collection(db, "planning"),
      where("recipeId", "==", id),
    );
    const snap = await getDocs(qPlanning);
    await Promise.all(
      snap.docs.map(async (d) => {
        await updateDoc(doc(db, "planning", d.id), { recipeId: "" });
      }),
    );

    const receptionRef = doc(db, "reception", "current");
    const receptionSnap = await getDoc(receptionRef);
    if (receptionSnap.exists()) {
      const data = receptionSnap.data() || {};
      const slots = ["aperitifId", "entreeId", "platId", "dessertId"];
      const updates = {};
      for (const field of slots) {
        if (data[field] === id) updates[field] = null;
      }
      if (Object.keys(updates).length > 0) {
        await setDoc(receptionRef, updates, { merge: true });
      }
    }

    // Renvoie une URL de redirection (change-la si tu utilises /recettes)
    const redirect = "/recipes";

    return new Response(JSON.stringify({ ok: true, redirect }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ delete-recipe error:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
