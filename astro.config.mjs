import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";
import keystatic from "@keystatic/astro";
import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
// Markdoc must register `.mdoc` with the content layer before other integrations touch content.
export default defineConfig({
  // Set PUBLIC_SITE_URL in .env / Vercel if you want a canonical site URL (optional).
  site: process.env.PUBLIC_SITE_URL || undefined,
  adapter: vercel(),
  integrations: [
    markdoc(),
    react({ experimentalDisableStreaming: true }),
    keystatic(),
  ],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  },
});