// src/pages/api/clear-planning.js
import { db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";

const days = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];

export async function POST() {
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
