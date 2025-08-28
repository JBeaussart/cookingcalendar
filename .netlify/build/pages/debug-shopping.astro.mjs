import { c as createComponent, i as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B-OLKkAn.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CurJWU1x.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DebugShopping = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Debug Shopping API" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="mx-auto max-w-xl p-6 space-y-4"> <h1 class="text-xl font-bold">Debug /api/save-shopping-totals</h1> <div class="flex gap-2"> <button id="btnGet" class="rounded bg-gray-800 px-3 py-2 text-white">Test GET</button> <button id="btnPost" class="rounded bg-blue-600 px-3 py-2 text-white">Test POST (demo items)</button> </div> <pre id="out" class="rounded border bg-gray-50 p-3 text-xs overflow-auto"></pre> </div> <script type="module">\n    const out = document.getElementById("out");\n    const log = (o) => out.textContent = JSON.stringify(o, null, 2);\n\n    document.getElementById("btnGet").addEventListener("click", async () => {\n      const r = await fetch("/api/save-shopping-totals", { method: "GET" });\n      const j = await r.json().catch(()=> ({}));\n      log({ok:r.ok, status:r.status, body:j});\n    });\n\n    document.getElementById("btnPost").addEventListener("click", async () => {\n      const r = await fetch("/api/save-shopping-totals", {\n        method: "POST",\n        headers: { "content-type": "application/json" },\n        body: JSON.stringify({\n          items: [\n            { item: "\u0152uf", quantity: 6, unit: "pi\xE8ce", checked: false },\n            { item: "Pomme", quantity: 4, unit: "", checked: true }\n          ]\n        })\n      });\n      const j = await r.json().catch(()=> ({}));\n      log({ok:r.ok, status:r.status, body:j});\n    });\n  <\/script> '])), maybeRenderHead()) })}`;
}, "/Users/jeremy/code/JBeaussart/cookingcalendar/src/pages/debug-shopping.astro", void 0);

const $$file = "/Users/jeremy/code/JBeaussart/cookingcalendar/src/pages/debug-shopping.astro";
const $$url = "/debug-shopping";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DebugShopping,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
