import { c as createComponent, i as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B-OLKkAn.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CurJWU1x.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DebugCompute = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Debug compute-shopping-totals" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="mx-auto max-w-2xl p-6 space-y-4"> <h1 class="text-xl font-bold">Debug /api/compute-shopping-totals</h1> <button id="btn" class="rounded bg-gray-800 px-3 py-2 text-white">Tester le calcul</button> <pre id="out" class="rounded border bg-gray-50 p-3 text-xs overflow-auto"></pre> </div> <script type="module">\n    const out = document.getElementById("out");\n    document.getElementById("btn").addEventListener("click", async () => {\n      const r = await fetch("/api/compute-shopping-totals");\n      const j = await r.json().catch(()=> ({}));\n      out.textContent = JSON.stringify({ ok:r.ok, status:r.status, body:j }, null, 2);\n    });\n  <\/script> '])), maybeRenderHead()) })}`;
}, "/Users/jeremy/code/JBeaussart/cookingcalendar/src/pages/debug-compute.astro", void 0);

const $$file = "/Users/jeremy/code/JBeaussart/cookingcalendar/src/pages/debug-compute.astro";
const $$url = "/debug-compute";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DebugCompute,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
