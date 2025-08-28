import { d as db } from '../../chunks/firebase_De7FOwIs.mjs';
import { updateDoc, doc } from 'firebase/firestore';
export { renderers } from '../../renderers.mjs';

// src/pages/api/remove-recipe.js

async function POST({ request }) {
  try {
    const url = new URL(request.url);
    const day = url.searchParams.get("day");

    if (!day) {
      return new Response("Paramètre 'day' manquant.", { status: 400 });
    }

    // On supprime la recette associée au jour (on met recipeId = "")
    await updateDoc(doc(db, "planning", day), { recipeId: "" });

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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
