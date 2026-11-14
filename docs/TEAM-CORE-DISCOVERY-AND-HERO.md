# Team Core Sports Wear — discovery, hero and capabilities

Implemented locally on 13 October 2026 at `http://127.0.0.1:3013/`, extending the approved storefront redesign. Production publication remains separate.

## References and delivered sections

| Reference | Adaptation |
| --- | --- |
| [Airbnb](https://www.airbnb.com/) and [search guidance](https://www.airbnb.com/help/article/3117) | Club, school, league and brand guide cards; sport switching with category-specific API results. |
| [Amazon](https://www.amazon.com/) | Recently viewed shelves on home, catalogue, categories and product pages; related designs from the product's actual category. |
| [Alibaba](https://www.alibaba.com/) | Bulk planner on home, catalogue and wholesale; quote-ready product shelves showing configured purchase modes and minimum quantities. |
| [Daraz](https://www.daraz.pk/) | Quick sport discovery, modular catalogue previews, collection links and retry/empty states. |
| [Etsy](https://www.etsy.com/) | Buyer collections and an artwork, roster and sizing guide on home, custom uniforms and product pages. |
| [Client hero reference](https://hasnat-corporation.com/) and supplied screenshot | Large left headline, right-side uniform slider, display platform, arrows and dots in Team Core's red theme. |
| Client capabilities screenshot | Twelve enquiry-linked technique/fabric cards on home, custom uniforms, private label and manufacturing pages. |

Public page extraction and direct HTTP fetches informed the patterns. Some marketplace responses block automated requests or depend on session/location. These are design adaptations, not claims about rankings or sales. No competitor logo, product artwork, reviews or offers are used in the storefront.

## API connections

Categories use `GET /storefront/categories`. Hero and sport discovery share `GET /storefront/products?limit=4&sort=newest&categorySlug=...`; only configured Team Core sport categories become slides. The next collection is prefetched. Hero images come from current product records.

Quote shelves use `limit=4&sort=name_asc&mode=quote`. Related shelves request five category products, exclude the current design and display up to four. The storefront service normalizes the API's `items` envelope. SSR seeds the same query keys and filters, including the initial hero collection. Non-home SSR routes do not seed category results as the home range.

Recently viewed history stores only public slugs under `teamcore-browsing-v2`, capped at twenty. Displayed items reload current API details. Removed designs, partial failures, empty history and clearing history have appropriate states; previous generic browser history is not imported.

Bulk planner selections populate the contact form and are submitted through `POST /storefront/contact`. Contact sport choices use the categories API. Capability cards populate the enquiry subject. The quotation confirms available techniques, fabrics, performance requirements and environmental documentation; unverified reference claims are not presented as Team Core guarantees.

## Hero and transparent logo

Arrows, dots, left/right keys and horizontal swipes change imagery and category links. Automatic rotation runs every seven seconds, pauses on hover/focus or when the document is hidden, and stops after manual navigation. A pause/play button is available. Reduced motion disables automatic rotation and entry animation. Manual changes are announced without repeated automatic announcements.

The image-editing service failed twice; the owner explicitly authorized local processing. `scripts/prepare-teamcore-logo.mjs` extracts the original black matte while retaining red/white artwork and antialiased edges. It exports transparent PNG/WebP logos and favicon. Header CSS no longer paints a black rectangle; the social composition intentionally retains its designed background. Asset regeneration uses the same extraction routine.

Original: `docs/teamcore/reference/team-core-source-logo.jpeg`. Transparent master: `docs/teamcore/reference/team-core-transparent-logo.png`. Alpha checks confirm transparent background and opaque artwork; visual inspection confirms the original lettering and monogram.

## Verification

- Production client/server builds passed; 63 public paths prerendered.
- Renderer checks passed for all 63 public routes, actual 404s, private noindex shells, redirects, filtered initial collections and correct cache entries.
- All sixteen browser scenarios passed across the suite and a targeted rerun. One recent-history test encountered Chrome `ERR_NETWORK_CHANGED` while loading modules and passed unchanged on rerun.
- Browser checks cover API sport switching, fresh product details, recommendations, contact submission, quotes, account and design flows, slider controls, pause/reduced motion, capability enquiries, lazy images and transparent alpha.
- Responsive coverage: 320, 360, 390, 768, 1024, 1440 and 1920 pixels. Automated WCAG A/AA checks on core pages and new sections reported no violations.
- Nine customer unit tests passed. Lint has zero errors and nineteen existing non-null assertion warnings; new components add no warnings.
- Real local HTTP checks passed for catalogue, variants, quantities, basket resolution, quotation ownership/acceptance, order/payment boundaries and private design ownership.

Review data remains isolated locally. Payments and outbound email are disabled. No production catalogue, source remote or deployment was changed.
