// src/pages/api/assign-reception.js
import { db } from "../../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const SLOTS = new Set(["aperitif", "entree", "plat", "dessert"]);

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { slot, id } = body || {};

    if (!SLOTS.has(String(slot))) {
      return new Response("Slot invalide", { status: 400 });
    }

    const field = `${slot}Id`;
    const payload = { [field]: id || null, updatedAt: serverTimestamp() };

    await setDoc(doc(db, "reception", "current"), payload, { merge: true });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur assign-reception:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}

