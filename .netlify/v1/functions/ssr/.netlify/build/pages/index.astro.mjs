import { c as createComponent, i as renderComponent, r as renderTemplate, m as maybeRenderHead, f as addAttribute } from '../chunks/astro/server_B-OLKkAn.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CurJWU1x.mjs';
import { d as db } from '../chunks/firebase_De7FOwIs.mjs';
import { getDocs, collection, query, where, documentId } from 'firebase/firestore';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const planningSnap = await getDocs(collection(db, "planning"));
  const planningMap = new Map(planningSnap.docs.map((d) => [d.id, d.data()?.recipeId || ""]));
  const recipeIds = days.map((d) => planningMap.get(d) || "").filter(Boolean);
  const recipesById = /* @__PURE__ */ new Map();
  if (recipeIds.length) {
    for (let i = 0; i < recipeIds.length; i += 10) {
      const chunk = recipeIds.slice(i, i + 10);
      const q = query(collection(db, "recipes"), where(documentId(), "in", chunk));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        recipesById.set(d.id, { id: d.id, ...d.data() });
      }
    }
  }
  const entries = days.map((day) => {
    const rid = planningMap.get(day) || "";
    return { day, recipe: rid ? recipesById.get(rid) ?? null : null };
  });
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Planning" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mx-auto max-w-5xl px-4 py-6 sm:py-8"> <header class="mb-6 sm:mb-8 flex items-center justify-between gap-3"> <div> <h1 class="text-2xl font-bold tracking-tight text-gray-900">🗓️ Planning de la semaine</h1> <p class="mt-1 text-sm text-gray-600">Sélectionne une recette pour chaque jour.</p> </div> <form method="post" action="/api/clear-planning" class="shrink-0"> <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700" title="Supprimer tout le planning"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"> <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path> </svg>
Réinitliser le planning
</button> </form> </header> <div class="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3"> ${entries.map(({ day, recipe }) => {
    const img = recipe?.image && String(recipe.image).trim() ? recipe.image : "/images/default-recipe.jpg";
    return renderTemplate`<section class="group rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"> <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100"> <h2 class="text-base font-semibold capitalize text-gray-900">${day}</h2> ${recipe ? renderTemplate`<span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Planifié</span>` : renderTemplate`<span class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">À choisir</span>`} </div> ${recipe ? renderTemplate`<div class="p-4"> <div class="flex items-start gap-3"> <img${addAttribute(img, "src")}${addAttribute(recipe.title, "alt")} class="h-16 w-16 flex-none rounded-lg object-cover ring-1 ring-gray-200"> <div class="min-w-0 flex-1"> <a${addAttribute(`/recipes/${recipe.id}`, "href")} class="block text-sm font-medium text-gray-900 hover:underline leading-snug"> ${recipe.title} </a> </div> <div class="flex shrink-0 items-center gap-2"> <a${addAttribute(`/recipes/${recipe.id}`, "href")} title="Voir la recette" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"> <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"></path> <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 0 1 6 0z"></path> </svg> </a> <form method="post"${addAttribute(`/api/remove-recipe?day=${day}`, "action")} class="inline-flex"> <button type="submit" title="Retirer la recette" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"> <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path> </svg> </button> </form> </div> </div> </div>` : renderTemplate`<div class="p-6 flex items-center justify-center"> <a${addAttribute(`/recipes?day=${day}`, "href")} class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700" title="Choisir une recette"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path> </svg> </a> </div>`} </section>`;
  })} </div> </div> ` })}`;
}, "/Users/jeremy/code/JBeaussart/cookingcalendar/src/pages/index.astro", void 0);

const $$file = "/Users/jeremy/code/JBeaussart/cookingcalendar/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
