// src/pages/api/add-recipe.js
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response("Corps JSON invalide", { status: 400 });
    }

    const {
      title,
      image,
      ingredients,
      steps,
      maman = false,
      salt = true,
    } = body;

    if (
      !title ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0 ||
      !Array.isArray(steps) ||
      steps.length === 0
    ) {
      return new Response(
        "Champs requis manquants (title, ingredients[], steps[])",
        { status: 400 },
      );
    }

    // Normalisation douce des ingrédients : garder item obligatoire, qty number ou undefined, unit optionnelle
    const cleanIngredients = ingredients
      .map((i) => {
        if (!i || typeof i !== "object") return null;
        const item = String(i.item || "").trim();
        if (!item) return null;
        const qty =
          i.quantity === "" ||
          i.quantity === null ||
          typeof i.quantity === "undefined"
            ? undefined
            : Number(i.quantity);
        const unit = String(i.unit || "").trim();
        return {
          item,
          ...(Number.isFinite(qty) ? { quantity: qty } : {}),
          ...(unit ? { unit } : {}),
        };
      })
      .filter(Boolean);

    const cleanSteps = steps
      .map((s) => String(s || "").trim())
      .filter((s) => s.length > 0);

    const payload = {
      title: String(title).trim(),
      image: image ? String(image).trim() : "",
      ingredients: cleanIngredients,
      steps: cleanSteps,
      maman: !!maman,
      salt: !!salt, // true = salé, false = sucré
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, "recipes"), payload);

    return new Response(JSON.stringify({ ok: true, id: ref.id }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ add-recipe error:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
