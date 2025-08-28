import { d as db } from '../../chunks/firebase_De7FOwIs.mjs';
import { setDoc, doc } from 'firebase/firestore';
export { renderers } from '../../renderers.mjs';

// src/pages/api/assign-recipe.js

async function POST({ request }) {
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
