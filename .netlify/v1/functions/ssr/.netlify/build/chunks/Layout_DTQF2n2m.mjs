import { c as createComponent, d as createAstro, m as maybeRenderHead, f as addAttribute, r as renderTemplate, k as renderHead, i as renderComponent, l as renderSlot } from './astro/server_B-OLKkAn.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                 */

const $$Astro$1 = createAstro();
const $$Navbar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Navbar;
  const currentPath = Astro2.url.pathname;
  const links = [
    { href: "/", label: "Planning" },
    { href: "/recipes", label: "Recettes" },
    { href: "/shoppingList", label: "Liste de courses" }
  ];
  return renderTemplate`${maybeRenderHead()}<nav class="bg-white border-b border-gray-200 shadow-md"> <div class="max-w-screen-xl mx-auto px-4 py-3"> <ul class="flex flex-wrap justify-center gap-2 md:gap-6"> ${links.map((link) => renderTemplate`<li> <a${addAttribute(link.href, "href")}${addAttribute(`block py-1 px-2 text-sm md:text-base md:px-4 rounded-md font-medium
                     ${currentPath === link.href ? "bg-blue-600 text-white" : "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"}`, "class")}> ${link.label} </a> </li>`)} </ul> </div> </nav>`;
}, "/Users/jeremy/code/JBeaussart/cookingcalendar/src/components/Navbar.astro", void 0);

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  return renderTemplate`<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>Astro Basics</title>${renderHead()}</head> <body data-astro-cid-sckkx6r4> ${renderComponent($$result, "Navbar", $$Navbar, { "data-astro-cid-sckkx6r4": true })} ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/Users/jeremy/code/JBeaussart/cookingcalendar/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
