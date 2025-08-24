// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: 'server', // ← active le mode SSR

  vite: {
    plugins: [tailwindcss()],
  },
});
