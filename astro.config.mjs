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
});
