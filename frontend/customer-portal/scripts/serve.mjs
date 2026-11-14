// Optional Node renderer for fresh catalogue pages and real HTTP status codes.
// Place the supplied nginx location rules in front of this loopback listener.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { listingPageSize, publicPaths, renderRoute, seoRoute } from "../server-build/entry-prerender.js";
import { discoverySnapshot } from "./discovery-snapshot.mjs";
import { robotsText, sitemapPaths, sitemapXml } from "./seo-output.mjs";
const root = resolve("dist");
const api = process.env.PRERENDER_API_URL;
const origin = process.env.VITE_SITE_URL;
if (!api || !origin)
  throw Error("PRERENDER_API_URL and VITE_SITE_URL are required");
const site = new URL(origin);
if (
  !["http:", "https:"].includes(site.protocol) ||
  site.pathname !== "/" ||
  (process.env.NODE_ENV === "production" && site.protocol !== "https:")
)
  throw Error(
    "VITE_SITE_URL must be a canonical origin, with HTTPS in production",
  );
const template = await readFile(resolve(root, "app.html"), "utf8").catch(() =>
  readFile(resolve(root, "index.html"), "utf8"),
);
if (!template.includes('<div id="root"></div>'))
  throw Error("The renderer requires an empty app shell. Rebuild the client and prerender again.");
const empty = { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
const cache = new Map();
async function get(path) {
  const hit = cache.get(path);
  if (hit && hit.until > Date.now()) return hit.value;
  const result = await fetch(api.replace(/\/$/, "") + path, {
    signal: AbortSignal.timeout(10000),
  });
  if (!result.ok)
    throw Object.assign(Error("Catalogue request failed"), {
      status: result.status === 404 ? 404 : 503,
    });
  const body = await result.json();
  const data = body.success === true ? body.data : body;
  const value = data?.items ? { ...data, data: data.items } : data;
  if (cache.size > 500) cache.clear();
  cache.set(path, { value, until: Date.now() + 30000 });
  return value;
}
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const privateRoute =
  /^\/(account(?:\/|$)|checkout(?:\/|$)|request-quote(?:\/|$)|cart$|quote-basket$|login$|register$|forgot-password$|reset-password$|verify-email$|search$)/;
function html(page) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace("</head>", page.head + "</head>")
    .replace(
      '<div id="root"></div>',
      '<div id="root">' +
        page.body +
        '</div><script type="application/json" id="teamcore-query-state">' +
        page.state +
        "</script>",
    );
}
createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }
  const send = (status, body, type = "text/html; charset=utf-8") => {
    res.writeHead(status, { "Content-Type": type });
    res.end(req.method === "HEAD" ? undefined : body);
  };
  try {
    const url = new URL(req.url, origin);
    if (url.origin !== site.origin || url.pathname.startsWith("//"))
      return send(400, "Invalid request URL", "text/plain");
    let path;
    try {
      path = decodeURIComponent(url.pathname).replace(/\/+$/, "") || "/";
    } catch {
      res.setHeader("X-Robots-Tag", "noindex");
      return send(404, "Not found", "text/plain");
    }
    const seo = seoRoute(path, url.search);
    if (path === "/health") {
      send(200, "ok", "text/plain");
      return;
    }
    if (
      path.startsWith("/assets/") ||
      path.startsWith("/teamcore/")
    ) {
      const file = resolve(root, "." + path);
      if (!file.startsWith(root + sep))
        return send(404, "Not found", "text/plain");
      if (!(await stat(file)).isFile())
        return send(404, "Not found", "text/plain");
      res.setHeader(
        "Cache-Control",
        path.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=86400",
      );
      send(
        200,
        await readFile(file),
        mime[extname(file)] || "application/octet-stream",
      );
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    if (path === "/robots.txt") {
      send(
        200,
        robotsText(site.origin),
        "text/plain",
      );
      return;
    }
    if (path === "/sitemap.xml") {
      const categories = await get("/storefront/categories");
      const products = [];
      for (let page = 1; page <= 10000; page++) {
        const p = await get("/storefront/products?limit=48&page=" + page);
        products.push(...p.data);
        if (page >= p.totalPages) break;
      }
      const paths = sitemapPaths(publicPaths, categories, products, Math.ceil(products.length / listingPageSize));
      send(
        200,
        sitemapXml(site.origin, paths),
        "application/xml",
      );
      return;
    }
    if (privateRoute.test(path)) {
      res.setHeader("X-Robots-Tag", "noindex");
      send(200, template);
      return;
    }
    const known =
      publicPaths.includes(path) ||
      /^\/(products|categories)\/[^/]+$/.test(path);
    if (known && path !== "/" && url.pathname.endsWith("/")) {
      res.writeHead(301, { Location: url.pathname.replace(/\/+$/, "") + url.search });
      return res.end();
    }
    if (known && !seo.noindex && seo.page === 1 && url.searchParams.has("page")) {
      url.searchParams.delete("page");
      res.writeHead(301, { Location: url.pathname + url.search });
      return res.end();
    }
    if (path === "/design-studio") {
      if (seo.noindex) res.setHeader("X-Robots-Tag", "noindex");
      send(200, html(renderRoute(path, { categories: [], products: empty }, url.search)));
      return;
    }
    if (
      path === "/brands" ||
      path.startsWith("/brands/") ||
      path === "/flash-sales"
    ) {
      res.writeHead(301, { Location: "/products" });
      res.end();
      return;
    }
    if (!known || seo.invalidPage) {
      res.setHeader("X-Robots-Tag", "noindex");
      send(404, html(renderRoute("/404", { categories: [], products: empty })));
      return;
    }
    const categories = await get("/storefront/categories");
    if (
      path.startsWith("/categories/") &&
      !categories.some((c) => "/categories/" + c.slug === path)
    ) {
      res.setHeader("X-Robots-Tag", "noindex");
      send(404, html(renderRoute("/404", { categories, products: empty })));
      return;
    }
    const product = path.startsWith("/products/")
      ? await get("/storefront/products/" + encodeURIComponent(path.slice(10)))
      : undefined;
    if (seo.noindex) {
      res.setHeader("X-Robots-Tag", "noindex");
      send(200, template);
      return;
    }
    const products = await get(
      `/storefront/products?limit=${listingPageSize}` + (seo.page > 1 ? `&page=${seo.page}` : "") +
        (path.startsWith("/categories/")
          ? "&categorySlug=" + encodeURIComponent(path.slice(12))
          : ""),
    );
    if (seo.page > 1 && seo.page > products.totalPages)
      throw Object.assign(Error("Catalogue page not found"), { status: 404 });
    const collections = await discoverySnapshot(path, categories, product, get);
    send(200, html(renderRoute(path, { categories, products, product, collections }, seo.canonicalPath.includes("?") ? `?page=${seo.page}` : "")));
  } catch (error) {
    const status = error.code === "ENOENT" || error.status === 404 ? 404 : 503;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    if (status === 503) res.setHeader("Retry-After", "30");
    send(
      status,
      status === 404
        ? html(renderRoute("/404", { categories: [], products: empty }))
        : '<!doctype html><html lang="en"><title>Team Core Sports Wear — temporarily unavailable</title><meta name="viewport" content="width=device-width,initial-scale=1"><body><main><h1>We will be back shortly.</h1><p>The catalogue is temporarily unavailable. Please try again in a moment.</p><a href="/">Try again</a></main></body></html>',
    );
  }
}).listen(
  Number(process.env.STOREFRONT_PORT || 3104),
  process.env.STOREFRONT_HOST || "127.0.0.1",
  () => console.log("TEAM CORE storefront renderer started"),
);
