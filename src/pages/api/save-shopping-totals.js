// src/pages/api/save-shopping-totals.js
import { db } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// GET -> renvoie les items existants (et crée le doc s'il n'existe pas)
export async function GET() {
  try {
    const ref = doc(db, "shoppingTotals", "current");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { items: [], savedAt: serverTimestamp() });
      return new Response(JSON.stringify({ ok: true, items: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    const data = snap.data() || {};
    const items = Array.isArray(data.items) ? data.items : [];
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/save-shopping-totals error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

// POST -> sauvegarde les items fournis
export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.items)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Bad payload: items[]" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const items = body.items.map((it) => {
      const item = String(it?.item || "").trim();
      const unit = String(it?.unit || "").trim();
      const q =
        it?.quantity === null || typeof it?.quantity === "undefined"
          ? undefined
          : Number(it.quantity);
      return {
        item,
        unit,
        checked: !!it?.checked,
        ...(Number.isFinite(q) ? { quantity: q } : {}),
      };
    });

    await setDoc(
      doc(db, "shoppingTotals", "current"),
      {
        items,
        savedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return new Response(JSON.stringify({ ok: true, count: items.length }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("POST /api/save-shopping-totals error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
