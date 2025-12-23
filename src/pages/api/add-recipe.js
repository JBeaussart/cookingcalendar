// src/pages/api/add-recipe.js
import { getAuthenticatedSupabase, isAdmin } from "../../lib/auth";

export async function POST({ request }) {
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

    const {
      title,
      image,
      ingredients,
      steps,
      maman = false,
      salt = true,
    } = body;

    if (!title || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response("Champs requis manquants (title, ingredients[])", {
        status: 400,
      });
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

    // Seuls les admins peuvent définir maman à true
    const isUserAdmin = isAdmin(user);
    const mamanValue = isUserAdmin ? !!maman : false;

    const payload = {
      user_id: user.id,
      title: String(title).trim(),
      image: image ? String(image).trim() : "",
      ingredients: cleanIngredients,
      steps: cleanSteps,
      maman: mamanValue,
      salt: !!salt, // true = salé, false = sucré
    };

    const { data, error } = await authSupabase
      .from('recipes')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error("❌ add-recipe error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ add-recipe error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
