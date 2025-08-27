// src/pages/api/compute-shopping-totals.js
import { db } from "../../firebase";
import { computeShoppingTotals } from "../../lib/computeShoppingTotals.js";

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const debug = url.searchParams.get("debug") === "1";
    const result = await computeShoppingTotals(db, { debug });
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("compute-shopping-totals GET:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
