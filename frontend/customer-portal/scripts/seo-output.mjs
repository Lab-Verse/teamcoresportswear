export function robotsText(origin) {
  // Let search engines read the noindex headers on public-host utility shells.
  // Authentication remains the access boundary for the data behind them.
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}

export function sitemapPaths(publicPaths, categories, products, pageCount) {
  return [...new Set([
    ...publicPaths,
    ...categories.map((c) => "/categories/" + encodeURIComponent(c.slug)),
    ...products.map((p) => "/products/" + encodeURIComponent(p.slug)),
    ...Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => `/products?page=${i + 2}`),
  ])];
}

export function sitemapXml(origin, paths) {
  const escape = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((path) => `<url><loc>${escape(origin + path)}</loc></url>`).join("\n") + "\n</urlset>\n";
}
