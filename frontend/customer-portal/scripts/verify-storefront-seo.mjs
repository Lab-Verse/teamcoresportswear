// Read-only production smoke check. No form submission or authentication changes.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const origin = "https://teamcoresportswear.org";
const evidence = process.env.SEO_EVIDENCE_DIR || "../../docs/teamcore/seo-20261104";
await mkdir(evidence, { recursive: true });
if (!process.argv.includes("--browser-only")) {
const fetchPage = (url, options) => fetch(url, { signal: AbortSignal.timeout(20000), ...options });
const sitemap = await fetchPage(origin + "/sitemap.xml");
assert.equal(sitemap.status, 200);
assert.match(sitemap.headers.get("content-type"), /xml/);
const urls = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].replaceAll("&amp;", "&"));
assert.equal(urls.length, new Set(urls).size);
assert.ok(urls.length >= 63);
const robots = await fetchPage(origin + "/robots.txt").then((r) => r.text());
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const rows = [];
const assets = new Set();
const links = new Set();
for (const url of urls) {
  assert.equal(new URL(url).origin, origin);
  const response = await fetchPage(url, { redirect: "manual" });
  assert.equal(response.status, 200, url);
  assert.ok(!response.headers.get("x-robots-tag")?.includes("noindex"), url);
  const html = await response.text();
  assert.ok(!/name="robots" content="noindex/i.test(html), url);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  const title = html.match(/<title[^>]*>(.*?)<\/title>/)?.[1];
  const desc = html.match(/name="description" content="([^"]+)"/)?.[1];
  const image = html.match(/property="og:image" content="([^"]+)"/)?.[1];
  assert.equal(canonical, url, url);
  assert.ok(title && desc && image, url + " metadata");
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, url + " h1");
  const types = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1])["@type"]);
  if (url.startsWith(origin + "/products/")) assert.deepEqual(types, ["BreadcrumbList"], url);
  if (url === origin + "/") {
    assert.deepEqual(types, ["Organization"]);
    assert.ok(html.includes('name="google-site-verification"'), "Google verification tag");
  }
  assets.add(image);
  for (const [, path] of html.matchAll(/<a\b[^>]*\bhref="(\/(?!\/)[^"?#]*)"/g)) links.add(path);
  rows.push({ url, status: response.status, canonical, title, description: desc, types });
}
assert.equal(new Set(rows.map((r) => r.title)).size, rows.length, "unique sitemap titles");
const knownPaths = new Set(urls.map((url) => new URL(url).pathname));
const linksChecked = [];
for (const path of [...links].filter((p) => !knownPaths.has(p))) {
  const r = await fetchPage(origin + path, { redirect: "manual" });
  assert.ok([200, 301, 302, 307, 308].includes(r.status), `Broken internal link ${path}: ${r.status}`);
  linksChecked.push({ path, status: r.status });
}
for (const url of assets) {
  assert.equal(new URL(url).origin, origin, url);
  const response = await fetchPage(url, { method: "HEAD" });
  assert.equal(response.status, 200, url);
  assert.match(response.headers.get("content-type"), /^image\//, url);
}
const probes = [];
for (const [url, status, noindex, redirect] of [
  [origin + "/products?page=99", 404, true],
  [origin + "/products/seo-missing-product?utm_source=check", 404, true],
  [origin + "/categories/seo-missing-category?sort=name_asc", 404, true],
  [origin + "/products?sort=name_asc", 200, true],
  [origin + "/custom-uniforms?utm_source=check", 200, false],
  [origin + "/design-studio?product=check", 200, true],
  [origin + "/login", 200, true],
  [origin + "/account/orders", 200, true],
  [origin + "/checkout", 200, true],
  [origin + "/search?search=soccer", 200, true],
  [origin + "/products/", 301, false, "/products"],
  [origin + "/products?page=1", 301, false, "/products"],
  ["https://www.teamcoresportswear.org/products", 301, false, origin + "/products"],
  ["http://teamcoresportswear.org/products", 301, false, origin + "/products"],
  ["https://admin.teamcoresportswear.org/", 200, true],
  ["https://admin.teamcoresportswear.org/login", 200, true],
  ["https://api.teamcoresportswear.org/health", 200, true],
  [origin + "/api/storefront/contacts", 401, false],
  [origin + "/api/wholesale/inquiries", 401, false],
]) {
  const r = await fetchPage(url, { redirect: "manual" });
  assert.equal(r.status, status, url);
  assert.equal(!!r.headers.get("x-robots-tag")?.includes("noindex"), noindex, url);
  if (redirect) assert.equal(r.headers.get("location"), redirect, url);
  probes.push({ url, status, noindex, redirect });
}
await writeFile(`${evidence}/live-http.json`, JSON.stringify({ checkedAt: new Date().toISOString(), sitemapUrls: rows, assets: assets.size, linksChecked, probes }, null, 2));
console.log(`${rows.length} live sitemap URLs, ${assets.size} social image URLs, ${linksChecked.length} additional internal links and ${probes.length} HTTP probes passed.`);
}

if (!process.argv.includes("--http-only")) {
const { chromium } = await import("@playwright/test");
const browser = await chromium.launch({ channel: "chrome", headless: true, args: process.env.SEO_BROWSER_RESOLVER ? [`--host-resolver-rules=${process.env.SEO_BROWSER_RESOLVER}`] : [] });
const errors = [];
const checks = [];
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === origin) errors.push(`${r.status()} ${new URL(r.url()).pathname}`);
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const [path, heading] of [["/custom-uniforms", "Custom Team Uniforms"], ["/private-label", "Private Label Sportswear"], ["/wholesale", "Wholesale Team Uniforms & Bulk Quotes"], ["/products?page=2", "Custom Sports Uniform Catalogue"]]) {
      await page.goto(origin + path);
      await page.getByRole("heading", { level: 1, name: heading, exact: true }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width} ${path} overflow`);
      checks.push({ width, path });
    }
    if (width === 390 || width === 1440) {
      await page.goto(origin + "/custom-uniforms");
      await page.getByRole("heading", { name: "What do I need to design custom team uniforms?" }).waitFor();
      await page.screenshot({ path: `${evidence}/custom-uniforms-${width}.png`, fullPage: true });
    }
  }
  await page.goto(origin + "/products");
  await page.getByRole("link", { name: "Next →", exact: true }).click();
  await page.waitForURL(origin + "/products?page=2");
  await page.getByText("Page 2 of", { exact: false }).waitFor();
  await page.getByRole("link", { name: "← Previous", exact: true }).click();
  await page.waitForURL(origin + "/products");
  await page.goto(origin + "/contact?topic=SEO%20form%20check");
  assert.equal(await page.getByRole("textbox", { name: "What can we help with?" }).inputValue(), "SEO form check");
  await page.getByRole("button", { name: "Send your message" }).waitFor();
  await page.goto("https://admin.teamcoresportswear.org/products");
  await page.getByRole("textbox", { name: /email/i }).waitFor();
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
await writeFile(`${evidence}/live-browser.json`, JSON.stringify({ checkedAt: new Date().toISOString(), responsive: checks, browserErrors: errors }, null, 2));
console.log(`${checks.length} live responsive checks, pagination, contact form and protected admin sign-in passed.`);
}
