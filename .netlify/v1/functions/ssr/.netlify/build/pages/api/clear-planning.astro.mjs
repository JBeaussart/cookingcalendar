import { d as db } from '../../chunks/firebase_De7FOwIs.mjs';
import { setDoc, doc } from 'firebase/firestore';
export { renderers } from '../../renderers.mjs';

// src/pages/api/clear-planning.js

const days = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];

async function POST() {
  try {
    // On vide tous les recipeId
    for (const day of days) {
      await setDoc(doc(db, "planning", day), { recipeId: "" }, { merge: true });
    }
    return new Response(null, {
      status: 303,
      headers: { Location: "/" },
    });
  } catch (err) {
    console.error("Erreur clear-planning:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
