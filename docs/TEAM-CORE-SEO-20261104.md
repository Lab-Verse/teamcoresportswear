# Team Core technical SEO and Google Search Console — 4 November 2026

Scope: `https://teamcoresportswear.org/`, the English-language public storefront for custom team uniforms, clubs, apparel brands and wholesale buyers. Admin and API use separate HTTPS hostnames. Vite builds the React client; the Node renderer serves HTML and the sitemap using the published NestJS storefront catalogue. Nginx terminates TLS and routes each host. Source baseline: `main` at `31e511f` with 156 pre-existing status entries. Production baseline: `20261025-01`. Published: `20261104-01`.

## Prioritized audit and changes

| Priority | Baseline evidence | Change or disposition |
| --- | --- | --- |
| P0 | No verified property was available in the signed-in Team Core Search Console account. | Verified the public HTTPS URL-prefix property by HTML tag and submitted `sitemap.xml` once. Later verified the Domain property by DNS after the owner restored hosting access. |
| P1 | `/products?page=2` was a generic client shell with `X-Robots-Tag: noindex`; navigation used buttons without crawlable `href` values. | Pagination now returns distinct server-rendered products, numbered self-canonicals, and actual previous/next links. Page 1 redirects to the clean URL. Pages 2–4 were added to the sitemap. |
| P1 | Missing products/categories with query parameters and excessive page numbers could return a 200 shell. Tracking-only URLs also lost HTML. | Check route and product existence before choosing the shell; missing and invalid pure-pagination requests return 404. Tracking-only variants render with the clean canonical. Sorting, filtering, search and personal design links remain noindex. Public trailing slashes redirect to clean paths. |
| P1 | robots.txt blocked access to four public-host routes whose headers already say noindex. | Allow crawlers to see noindex on these non-sensitive utility shells; protected data remains behind API authentication. Private routes are excluded from sitemap. Admin and API host configuration unchanged. |
| P2 | Collection and quote-only product metadata reused generic descriptions. Buyer pages used slogan titles; quote-only Product markup had no eligible Google price, offer, review or rating. | Added specific titles and descriptions, buyer answers, verified absolute social images, organization data and visible product breadcrumbs. No fictional offers, price, reviews or FAQ rich-result claims. |
| Preserve | Canonical host, HTTPS, 37 active published products, six sports, public product routes, auth, quote flow, assets, forms, admin noindex and protected APIs. | Kept intact. No business data changes, credentials, analytics/tracking installation, payment settings, or backend/admin deployment. |
| Admin | Admin `robots.txt` returns its generic HTML shell; admin pages have `noindex, nofollow` headers. | Domain-property inspection found the three checked admin URLs unindexed. Google read the live login `noindex` header. No admin sitemap or removal request was submitted. |

The sitemap went from **63 to 66** URLs. The three added URLs are `/products?page=2`, `?page=3`, and `?page=4`; no previous URL was removed. Sitemap generation uses the published API plus public content routes; duplicate URLs are removed. The dynamic renderer supports query pagination; the static prerender sitemap omits query URLs. `lastmod` is omitted where meaningful page-level revision dates are not reliably available. No `hreflang` was added because there are no genuine alternate-language equivalents.

## Content and evidence

| Intent | Primary page | Added or improved | Evidence |
| --- | --- | --- | --- |
| Custom team uniforms, artwork, names and numbers | `/custom-uniforms` | Design brief checklist and what to verify on the proof; link to Design Studio. | Existing Team Core capabilities, catalogue, and design workflow. |
| Bulk quote and team delivery | `/wholesale` | Product/quantity selection, quote submission, destination and what happens next. | Live quote basket, `QuoteRequestPage`, and quotation contract. |
| Private-label sportswear and sampling | `/private-label` | Brief checklist covering styles, quantities, labels, packaging, sample requirements and destination. | Existing private-label offering; terms, costs and minimums left for confirmation. |
| Team uniform sizing and purchasing questions | `/size-guide`, `/faq` | Product-specific chart guidance, counts by size, quote and delivery guidance. | Existing product information, quote requirements and production limits. |
| Sport-specific comparison and product discovery | `/products`, `/categories/:slug`, `/products/:slug` | Sport descriptions and canonical links, unique product snippets and breadcrumbs. | Published API and existing Team Core sport descriptions. |

These questions are editorial recommendations based on buyer tasks and verified storefront behavior, not measured query demand. Search Console Performance (Web, default 3 months, checked 4 November) was processing and disabled Queries and Add filter; clicks, impressions, CTR, position and period comparisons are unavailable. When the report opens, compare the latest 28 days with the preceding 28 days and apply Queries → Custom regex → Matches regex:

```text
(?i)(^\s*(who|what|when|where|why|which|whose|whom|how|can|could|should|would|will|do|does|did|is|are|was|were|has|have|had|may|might|must)\b|\?\s*$)
```

The filter is incomplete by design. Missing rows may reflect privacy filtering and reporting thresholds. No traffic, ranking or click change is inferred.

## Google Search Console results

Account: Team Core's existing Google account. Two properties verified on 4 November 2026: `https://teamcoresportswear.org/` (URL-prefix, HTML tag, public HTTPS only), and `sc-domain:teamcoresportswear.org` (Domain, DNS TXT, includes subdomains and alternate protocols). Keep both the storefront verification tag and the root TXT record.

Sitemap submission: 4 November 2026, then **Success**, last read 4 November, **66 discovered pages**, zero videos. The first status briefly showed Couldn't fetch; the origin recorded a successful Google fetch and the report then showed Success without resubmission. The Page indexing report was processing; property-wide indexed and non-indexed counts are unavailable. Discovery is not indexing. The Overview enhancements report was processing, Google indicated HTTPS on the inspected indexed pages, and both Manual actions and Security issues reported no issues. Core Web Vitals lacked sufficient field data on mobile and desktop over the prior 90 days.

| URL | Google index record and last crawl | Live test on 4 Nov | Google-selected canonical | Request status | Updated crawl/index |
| --- | --- | --- | --- | --- | --- |
| `/` | Indexed, 29 Oct | Available, can be indexed | Inspected URL | Accepted into priority queue | Pending confirmation |
| `/custom-uniforms` | Indexed, 25 Oct | Available, can be indexed | Inspected URL | Google returned a submission error; no repeat sent | Pending confirmation |
| `/wholesale` | Indexed, 25 Oct | Available, can be indexed | Inspected URL | Accepted into priority queue | Pending confirmation |
| `/private-label` | Indexed, 25 Oct | Available, can be indexed | Inspected URL | Accepted into priority queue | Pending confirmation |
| `/products?page=2` | Not indexed; URL unknown, no prior crawl reported | Available, crawl allowed, successful fetch, indexing allowed. Google's tested HTML shows the catalogue heading and page links. | Live self-canonical; selection not yet determined | Accepted into priority queue | Pending confirmation |
| `/products?page=3`, `?page=4` | Not individually inspected | Verified by independent HTTP/HTML check | Site declares self-canonicals; Google's selection not inferred | Included in successful sitemap | Pending confirmation |

Admin check through the Domain property, 4 November: `https://admin.teamcoresportswear.org/`, `/login` and `/products` were all **not indexed**; Google reported each URL as unknown. The live `/login` test reported crawl allowed, successful fetch, and indexing disallowed by the `X-Robots-Tag` header. Independent HTTPS probes confirmed `noindex, nofollow` on all three admin responses, and the protected contact and quotation APIs returned 401 without auth. These are URL-level checks, not a claim about every possible admin URL. No private-host sitemap, admin indexing request, or removal request was submitted.

The Domain property's **All known pages** indexing report was last updated **23 October 2026**: **0 indexed, 17 not indexed** (15 crawled but not indexed, one redirect, one noindex). This historical report predates the newer indexed URL Inspection records for the public homepage and other buyer pages; it is not a current public-site index count. Evidence is in `teamcore/seo-20261104/domain-page-indexing.txt` and the individual URL inspection records.

## Crawler policy and validation

Public HTML, navigation and answers are readable without JavaScript. Google and other search crawlers including OAI-SearchBot and Claude-SearchBot are not blocked from public pages by robots.txt. Search access, model-training controls (such as GPTBot, ClaudeBot or Google-Extended), and user-requested retrieval are distinct. No new training policy was imposed, and no special AI file, citation guarantee, crawler allowlist, or bypass was introduced.

Live HTTP probes using Googlebot, Google-InspectionTool, Bingbot, OAI-SearchBot and Claude-SearchBot user-agent strings all returned 200 and HTML for the custom uniforms page. These probes test response policy; they do not establish actual crawler visits or AI inclusion. Google Search Console independently confirmed live access and sitemap parsing.

Sources: [Google ownership verification](https://support.google.com/webmasters/answer/9008080), [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), [Google robots directives](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [Product snippet eligibility](https://developers.google.com/search/docs/appearance/structured-data/product-snippet), [URL Inspection](https://support.google.com/webmasters/answer/9012289), [OpenAI crawler controls](https://developers.openai.com/api/docs/bots), and [Anthropic crawler controls](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler).

Validation: client and SSR build passed, Vitest 9/9, lint zero errors and 19 existing warnings. Local renderer passed all 66 sitemap entries, pagination, missing routes, noindex and redirects. Live HTTPS checks validated all 66 titles, descriptions, single primary headings, self-canonicals and indexability signals; JSON-LD parsed; 38 social images, five additional internal paths and 19 HTTP probes passed. Browser checks passed on four changed routes at 320, 390, 768 and 1440 px, plus forward/back pagination, contact form prefill and admin sign-in boundary. No browser errors in the checked flows. Contact form was not submitted to avoid sending a production email. Measurements are browser/HTTP checks and Search Console field-data availability, not a Lighthouse or field performance claim. Evidence: `docs/teamcore/seo-20261104/`.

The unthrottled Chrome spot checks used fresh contexts and reduced motion. Observed LCP samples were 2.24 s (390px home), 3.34 s (390px catalogue page two), and 3.19 s (1440px home). Catalogue images use lazy WebP delivery and explicit dimensions; fonts are self-hosted. The mobile homepage sample had a 0.123 layout-shift sum. A repeated controlled trace is needed before attributing the shift to an element or modifying the shared renderer/client mounting strategy. No baseline or field improvement is inferred from these samples.

## Release and rollback

Scoped storefront artifact SHA-256: `81bf730fe06aea603791ffde02b6215cb484117bdb6cb9f1661e8036c56290e6`. Compared 229 existing live storefront source/public files against local copies before packaging. Only SEO files differed; the archive included the two new SEO helper modules. Source paths: `index.html`, `src/lib/seo.ts`, `src/entry-prerender.tsx`, `src/components/common/SEOHead.tsx`, `src/index.css`, and the Home, Brand, Information, Contact, ProductListing and ProductDetail pages. Renderer and tests are in `scripts/`; `deploy/activate-teamcore-storefront.sh` performs the guarded release. The existing dirty tree was preserved without staging overlapping pre-existing redesign changes.

The backup `20261104T091124Z` ran before activation. Only the storefront service restarted. Backend PID `25347` remained unchanged; backend and admin build directories matched the prior release, and database health and unauthenticated checks passed. Admin, Nginx, database, email, secrets, uploads and payment configuration were not touched. Previous hashed static assets remain available for open browser tabs. The production state is identified by `/opt/teamcore/current` and the artifact digest, not a new Git commit.

Rollback from an authorized SSH session:

```bash
sudo ln -sfn /opt/teamcore/releases/20261025-01 /opt/teamcore/current
sudo systemctl restart teamcore-storefront
```

Rollback would also remove the new Google verification tag until the SEO release is restored. Do not restore the database for a storefront rollback.

## DNS verification follow-up — completed

After the owner signed in, the selected DirectAdmin zone was confirmed to be `teamcoresportswear.org`. A single Google-issued TXT record was added at the root with TTL 300; the before/after panel comparison showed no existing record changed or removed. Both authoritative nameservers (`dns56.topsecureservers.com`, `dns57.topsecureservers.com`) and Google Public DNS served the record. Google confirmed ownership using the domain name provider method. The existing public URL-prefix property and its sitemap were left intact; the live sitemap still contained 66 URLs. No application code, runtime configuration, or data changed during this follow-up.
