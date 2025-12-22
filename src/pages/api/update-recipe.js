// src/pages/api/update-recipe.js
import { getAuthenticatedSupabase } from "../../lib/auth";

export async function PATCH({ request }) {
  try {
    // Récupérer un client Supabase authentifié
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response("Corps JSON invalide", { status: 400 });
    }

    const { id, title, image, ingredients, steps, maman, salt } = body;

    if (!id) {
      return new Response("Paramètre 'id' manquant.", { status: 400 });
    }
    if (!title || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response("Champs requis manquants (title, ingredients[])", {
        status: 400,
      });
    }

    // Nettoyage ingrédients
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
    };

    const { error } = await authSupabase
      .from('recipes')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id); // S'assurer que l'utilisateur ne peut modifier que ses propres recettes

    if (error) {
      console.error("❌ update-recipe error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ update-recipe error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
