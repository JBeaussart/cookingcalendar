// src/pages/api/move-recipe.js
import { supabase } from "../../supabase";

export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const fromDay = String(body.fromDay || "")
      .trim()
      .toLowerCase();
    const toDay = String(body.toDay || "")
      .trim()
      .toLowerCase();
    const recipeId = String(body.recipeId || "").trim();
    const replaceWithRaw =
      typeof body.replaceWith === "string" ? body.replaceWith : "";
    const replaceWith = replaceWithRaw.trim();

    if (!fromDay || !toDay || !recipeId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // No-op guard
    if (fromDay === toDay) {
      return new Response(JSON.stringify({ ok: true, noop: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Optional: ensure the source day currently holds the recipe we move
    const { data: fromData } = await supabase
      .from('planning')
      .select('recipe_id')
      .eq('day', fromDay)
      .single();

    const currentSourceId = fromData?.recipe_id || "";
    if (currentSourceId && currentSourceId !== recipeId) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Source day does not match requested recipe",
        }),
        {
          status: 409,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Assign target day to recipeId
    await supabase
      .from('planning')
      .upsert({ day: toDay, recipe_id: recipeId }, { onConflict: 'day' });

    // If the target day already had a recipe, swap it back to the source day.
    if (replaceWith) {
      await supabase
        .from('planning')
        .upsert({ day: fromDay, recipe_id: replaceWith }, { onConflict: 'day' });
    } else {
      await supabase
        .from('planning')
        .update({ recipe_id: null })
        .eq('day', fromDay);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur move-recipe:", err);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
