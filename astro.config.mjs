import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";
import keystatic from "@keystatic/astro";
import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

/**
 * Without this, Astro SSR builds `Request.url` with hostname `localhost` whenever
 * `security.allowedDomains` is empty (Host / X-Forwarded-Host are not trusted).
 * Keystatic’s GitHub OAuth then sets `redirect_uri` to `https://localhost/...`.
 *
 * @see https://docs.astro.build/en/reference/configuration-reference/#securityalloweddomains
 */
function securityAllowedDomains(site) {
  const patterns = [
    { hostname: "localhost", protocol: "http" },
    { hostname: "127.0.0.1", protocol: "http" },
    { hostname: "**.vercel.app", protocol: "https" },
  ];
  if (typeof site === "string" && site.trim() !== "") {
    try {
      const u = new URL(site.trim());
      patterns.unshift({
        hostname: u.hostname,
        protocol: u.protocol === "https:" ? "https" : "http",
      });
    } catch {
      /* ignore invalid PUBLIC_SITE_URL */
    }
  }
  return patterns;
}

// https://astro.build/config
// Markdoc must register `.mdoc` with the content layer before other integrations touch content.
export default defineConfig({
  // Set PUBLIC_SITE_URL in .env / Vercel if you want a canonical site URL (optional).
  site: process.env.PUBLIC_SITE_URL || undefined,
  security: {
    allowedDomains: securityAllowedDomains(process.env.PUBLIC_SITE_URL),
  },
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
