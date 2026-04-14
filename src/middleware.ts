/// <reference types="node" />
import { env } from "node:process";
import { defineMiddleware } from "astro:middleware";

/**
 * Keystatic builds GitHub OAuth `redirect_uri` from `request.url` (`githubLogin` in
 * @keystatic/core). On Vercel, that URL can still look like localhost/internal host
 * even when the browser hit your real domain.
 *
 * Fix: rewrite the request to your public origin. Prefer PUBLIC_SITE_URL (set in
 * Vercel + .env) so we do not rely on x-forwarded-* being present on every invocation.
 *
 * @see https://github.com/Thinkmill/keystatic/issues/1022
 */
export const onRequest = defineMiddleware((context, next) => {
  if (import.meta.env.DEV) {
    return next();
  }

  const { request, url } = context;

  if (!url.pathname.startsWith("/api/keystatic")) {
    return next();
  }

  let publicOrigin: string | null = null;
  const site = import.meta.env.PUBLIC_SITE_URL ?? env.PUBLIC_SITE_URL;
  if (typeof site === "string" && site.trim() !== "") {
    try {
      publicOrigin = new URL(site.trim()).origin;
    } catch {
      publicOrigin = null;
    }
  }

  if (!publicOrigin) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (!host) {
      return next();
    }
    publicOrigin = `${proto}://${host}`;
  }

  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return next();
  }

  if (requestOrigin === publicOrigin) {
    return next();
  }

  let publicUrl: URL;
  try {
    publicUrl = new URL(url.pathname + url.search, `${publicOrigin}/`);
  } catch {
    return next();
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: request.headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  return next(new Request(publicUrl, init));
});
