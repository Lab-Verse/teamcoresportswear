export const listingPageSize = 12;

const privateRoute = /^\/(account|checkout|request-quote|cart|quote-basket|login|register|reset-password|forgot-password|verify-email|search)(?:\/|$)/;
const trackingParam = /^(utm_[a-z0-9_]+|gclid|dclid|gbraid|wbraid|fbclid|msclkid)$/i;

export function seoRoute(path: string, search: string) {
  const params = [...new URLSearchParams(search)].filter(([key]) => !trackingParam.test(key));
  const listing = path === "/products" || /^\/categories\/[^/]+$/.test(path);
  const pageValue = params.length === 1 && params[0][0] === "page" ? params[0][1] : "";
  const page = /^[1-9]\d{0,5}$/.test(pageValue) && listing ? Number(pageValue) : 1;
  const paginated = listing && pageValue === String(page);
  return {
    page,
    canonicalPath: path + (page > 1 ? `?page=${page}` : ""),
    noindex: privateRoute.test(path) || (params.length > 0 && !paginated),
    invalidPage: listing && params.length === 1 && params[0][0] === "page" && !paginated,
  };
}
