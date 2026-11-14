import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { publicPaths, renderRoute } from "../server-build/entry-prerender.js";
import { discoverySnapshot } from "./discovery-snapshot.mjs";
import { robotsText, sitemapPaths, sitemapXml } from "./seo-output.mjs";
const origin = process.env.VITE_SITE_URL;
const api = process.env.PRERENDER_API_URL;
if (!origin || !api)
  throw Error(
    "VITE_SITE_URL and PRERENDER_API_URL are required. The API must serve the intended catalogue.",
  );
const site = new URL(origin);
if (!["http:", "https:"].includes(site.protocol) || site.pathname !== "/")
  throw Error("VITE_SITE_URL must be an origin without a path");
async function get(path) {
  const response = await fetch(api.replace(/\/$/, "") + path, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw Error("Prerender API failed: " + path + " (" + response.status + ")");
  const result = await response.json();
  const value = result.success === true ? result.data : result;
  return value?.items ? { ...value, data: value.items } : value;
}
const categories = await get("/storefront/categories");
const first = await get("/storefront/products?limit=12");
const all = [];
for (let page = 1; page <= Math.max(1, Math.ceil(first.total / 48)); page++)
  all.push(...(await get("/storefront/products?limit=48&page=" + page)).data);
// Static output has no query-aware renderer; publish only path-based URLs here.
const paths = sitemapPaths(publicPaths, categories, all, 1);
const currentIndex = await readFile("dist/index.html", "utf8");
const template = currentIndex.includes('<div id="root"></div>')
  ? currentIndex
  : await readFile("dist/app.html", "utf8");
if (!template.includes('<div id="root"></div>'))
  throw Error("Rebuild the client to create an empty application shell before prerendering.");
await writeFile("dist/app.html", template);
for (const path of [...new Set(paths), "/404"]) {
  const product = path.startsWith("/products/")
    ? await get("/storefront/products/" + path.slice(10))
    : undefined;
  const products = path.startsWith("/categories/")
    ? await get("/storefront/products?limit=12&categorySlug=" + path.slice(12))
    : first;
  const collections = await discoverySnapshot(path, categories, product, get);
  const page = renderRoute(path, { categories, products, product, collections });
  const html = template
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
  const target =
    path === "/404"
      ? "dist/404.html"
      : path === "/"
        ? "dist/index.html"
        : "dist" + path + "/index.html";
  const destination = resolve(target);
  if (
    !destination.startsWith(resolve("dist") + "/") &&
    !destination.startsWith(resolve("dist") + "\\")
  )
    throw Error("Invalid output path");
  await mkdir(resolve(destination, ".."), { recursive: true });
  await writeFile(destination, html);
}
await writeFile(
  "dist/sitemap.xml",
  sitemapXml(site.origin, paths),
);
await writeFile(
  "dist/robots.txt",
  robotsText(site.origin),
);
console.log(
  "Rendered " +
    paths.length +
    " public routes, a 404 page, robots.txt and sitemap.xml. Rebuild when the catalogue changes.",
);
