// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  // ← active le mode SSR
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: netlify(),

  // Prefetch les pages au survol des liens pour navigation plus rapide
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  // Compression HTML pour réduire la taille
  compressHTML: true,
});
