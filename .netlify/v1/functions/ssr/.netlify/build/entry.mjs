import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_BbIB3MPP.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/add-recipe.astro.mjs');
const _page2 = () => import('./pages/api/assign-recipe.astro.mjs');
const _page3 = () => import('./pages/api/clear-planning.astro.mjs');
const _page4 = () => import('./pages/api/compute-shopping-totals.astro.mjs');
const _page5 = () => import('./pages/api/custom-items.astro.mjs');
const _page6 = () => import('./pages/api/delete-recipe.astro.mjs');
const _page7 = () => import('./pages/api/remove-recipe.astro.mjs');
const _page8 = () => import('./pages/api/save-shopping-totals.astro.mjs');
const _page9 = () => import('./pages/api/update-recipe.astro.mjs');
const _page10 = () => import('./pages/debug-compute.astro.mjs');
const _page11 = () => import('./pages/debug-shopping.astro.mjs');
const _page12 = () => import('./pages/recipes/_id_.astro.mjs');
const _page13 = () => import('./pages/recipes.astro.mjs');
const _page14 = () => import('./pages/shoppinglist.astro.mjs');
const _page15 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/add-recipe.js", _page1],
    ["src/pages/api/assign-recipe.js", _page2],
    ["src/pages/api/clear-planning.js", _page3],
    ["src/pages/api/compute-shopping-totals.js", _page4],
    ["src/pages/api/custom-items.js", _page5],
    ["src/pages/api/delete-recipe.js", _page6],
    ["src/pages/api/remove-recipe.js", _page7],
    ["src/pages/api/save-shopping-totals.js", _page8],
    ["src/pages/api/update-recipe.js", _page9],
    ["src/pages/debug-compute.astro", _page10],
    ["src/pages/debug-shopping.astro", _page11],
    ["src/pages/recipes/[id].astro", _page12],
    ["src/pages/recipes/index.astro", _page13],
    ["src/pages/shoppingList.astro", _page14],
    ["src/pages/index.astro", _page15]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "a7c9bdc2-66c4-4813-b8c3-cc0b8c2d5376"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
