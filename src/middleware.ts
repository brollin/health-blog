import { defineMiddleware } from "astro:middleware";

/**
 * Vercel (and similar proxies) forward the real public URL via headers, but the
 * incoming Request URL can still look like localhost. Keystatic builds GitHub
 * OAuth `redirect_uri` from `request.url`, so we rewrite it to the public origin.
 *
 * @see https://github.com/Thinkmill/keystatic/issues/1022
 */
export const onRequest = defineMiddleware((context, next) => {
  // Proxied public URL only matters in production; skip locally to avoid odd header combos.
  if (import.meta.env.DEV) {
    return next();
  }

  const { request, url } = context;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (
    !url.pathname.startsWith("/api/keystatic") ||
    !forwardedProto ||
    !forwardedHost
  ) {
    return next();
  }

  const publicOrigin = `${forwardedProto}://${forwardedHost}`;
  let publicUrl: URL;
  try {
    publicUrl = new URL(url.pathname + url.search, `${publicOrigin}/`);
  } catch {
    return next();
  }

  if (url.origin === publicUrl.origin) {
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
