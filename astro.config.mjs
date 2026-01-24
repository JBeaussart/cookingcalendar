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
    build: {
      // Optimisations de build pour de meilleures performances
      cssCodeSplit: true, // Séparer le CSS par page
      minify: "esbuild", // Minification rapide avec esbuild
    },
  },

  adapter: netlify(),

  // Compression HTML pour réduire la taille
  compressHTML: true,
});
