import { d as db } from '../../chunks/firebase_De7FOwIs.mjs';
import { deleteDoc, doc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';
export { renderers } from '../../renderers.mjs';

// src/pages/api/delete-recipe.js

async function DELETE({ request }) {
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
    const qPlanning = query(collection(db, "planning"), where("recipeId", "==", id));
    const snap = await getDocs(qPlanning);
    await Promise.all(
      snap.docs.map(async (d) => {
        await updateDoc(doc(db, "planning", d.id), { recipeId: "" });
      })
    );

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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
