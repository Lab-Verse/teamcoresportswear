import assert from "node:assert/strict";
const base = process.env.RENDERER_TEST_URL || "http://127.0.0.1:3104";
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))
  throw Error("Use a local renderer only");
const sitemap = await fetch(base + "/sitemap.xml");
assert.equal(sitemap.status, 200);
const paths = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => {
    const url = new URL(match[1]);
    return url.pathname + url.search;
  },
);
assert.ok(paths.length >= 16);
assert.equal(paths.length, new Set(paths).size, "unique sitemap URLs");
for (const path of paths) {
  const page = await fetch(base + path);
  assert.equal(page.status, 200, path);
  const html = await page.text();
  assert.match(
    html,
    /<h1[\s>]/,
    path + " must contain server-rendered content",
  );
  assert.match(html, /teamcore-query-state/, path);
  assert.match(html, /rel="canonical"/, path);
  assert.ok(!page.headers.get("x-robots-tag")?.includes("noindex"), path);
  assert.doesNotMatch(html, /name="robots" content="noindex/i, path);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, path);
  assert.equal(new URL(html.match(/rel="canonical" href="([^"]+)"/)[1]).pathname + new URL(html.match(/rel="canonical" href="([^"]+)"/)[1]).search, path);
  const state = JSON.parse(html.match(/id="teamcore-query-state">([\s\S]*?)<\/script>/)[1]);
  if (path !== "/") assert.ok(!state.queries.some(q => q.queryKey[1] === "home"), path + " must not seed a category collection as the home range");
  if (path === "/") {
    assert.match(html, /aria-roledescription="carousel"/);
    assert.match(html, /Technology &amp; Fabric Capabilities/);
    const collections = state.queries.filter(q => q.queryKey[1] === "collection");
    assert.equal(collections.length, 2);
    for (const collection of collections) {
      const params = collection.queryKey[2];
      assert.equal(params.limit, 4);
      assert.ok(params.mode === "quote" || params.categorySlug);
      assert.ok(collection.state.data.data.length <= 4);
      if (params.categorySlug) assert.ok(collection.state.data.data.every(p => p.category?.slug === params.categorySlug));
      if (params.mode === "quote") assert.ok(collection.state.data.data.every(p => ["quote_only", "both"].includes(p.purchaseMode)));
    }
  }
  if (path.startsWith("/products/"))
    assert.match(html, /application\/ld\+json/, path);
}
for (const path of [
  "/unavailable-route-test",
  "/products/unavailable-product-test",
  "/products/unavailable-product-test?utm_source=test",
  "/categories/unavailable-category-test",
  "/categories/unavailable-category-test?sort=name_asc",
  "/products?page=999999",
  "/products?page=0",
]) {
  assert.equal((await fetch(base + path)).status, 404, path);
}
for (const path of ["/account/orders", "/checkout", "/request-quote"]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assert.ok(!(await response.text()).includes('id="teamcore-query-state"'));
}
const redirect = await fetch(base + "/brands", { redirect: "manual" });
assert.equal(redirect.status, 301);
assert.equal(redirect.headers.get("location"), "/products");
for (const [path, target] of [["/products/", "/products"], ["/products?page=1", "/products"]]) {
  const response = await fetch(base + path, { redirect: "manual" });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), target);
}
const tracking = await fetch(base + "/custom-uniforms?utm_source=test");
assert.equal(tracking.headers.get("x-robots-tag"), null);
assert.match(await tracking.text(), /What do I need to design custom team uniforms\?/);
assert.equal((await fetch(base + "/products?sort=name_asc")).headers.get("x-robots-tag"), "noindex");
if (paths.includes("/products?page=2")) {
  assert.match(await (await fetch(base + "/products")).text(), /href="\/products\?page=2"/);
  const second = await (await fetch(base + "/products?page=2")).text();
  assert.match(second, /Page 2/);
  assert.ok(/href="\/products"[^>]*>← Previous/.test(second), "page 2 must link to the unparameterized first page");
}
console.log(
  `${paths.length} unique, indexable sitemap routes passed; pagination, query handling, real 404s, private noindex and redirects passed.`,
);
