# Team Core Sports Wear — complete storefront redesign plan

**Prepared:** 13 October 2026. **Status:** Approved by the owner; locally implemented. See `TEAM-CORE-IMPLEMENTATION.md` for verification. **Project:** `D:\work\Live-Projects\teamcore`.

Build a distinctive Team Core Sports Wear storefront combining clear catalogue discovery, custom uniform ordering, wholesale quotations, and the existing customer account and design tools. The recommended experience is a single manufacturer's sportswear store, with a quotation-led custom-order journey and online buying wherever the configured product and checkout rules permit it.

The owner approved implementation and requested complete removal of the copied sports branding from this local repository. Local implementation and verification are documented in `TEAM-CORE-IMPLEMENTATION.md`; production publication remains separate.

## 1. Scope and evidence

### What the repository contains now

The copied customer application uses React 19, TypeScript, Vite 8, Tailwind 4, Radix components, TanStack Query, Zustand, and React Router. Reuse that stack and the existing commerce contracts.

Source inspection confirms:

- Public catalogue, category, search, and product-detail screens, with server-rendered public pages.
- Separate shopping and quote baskets, protected quote submission, checkout, payment return/cancellation, and payment recovery.
- Authentication and customer pages for orders, quotations, messages, saved designs, addresses, wishlist, reviews, returns, notifications, profile, and settings.
- A design studio with templates, artwork, player personalization, saving, submission, and production-proof decisions.
- Existing `purchaseMode`, minimum order quantity, quantity increment, SKU/variant, and currency fields. Reuse these; the copied discovery document predates several of them.
- Copied brand text and imagery across pages, placeholders, customer layouts, the design studio, metadata, and server-rendered fallbacks.
- A large CSS file containing earlier orange/navy tokens and later hard-coded burgundy/cream storefront styles. Changing one primary colour will leave inconsistent screens.
- Hard-coded copied brand values in deployment and some backend responses. These are launch dependencies even when the main work is the customer frontend.

The working tree already contains extensive modified and untracked work in the frontend, backend, admin, and deployment folders. Preserve that baseline and review only the new Team Core changes when implementation begins.

No repository `AGENTS.md`, `PROJECT.md`, `PROJECT_STATE.yaml`, `TASKS.md`, `DECISIONS.md`, `RISKS.md`, or `MANUAL_ACTIONS.md` was found. The instructions supplied in chat and the copied `docs/` plans were read as context. This copy has no initialized Hengshi project state; use direct repository work for this redesign.

### Team Core references checked

The supplied [Team Core website](https://teamcoresportswear.com/) identifies a custom uniform manufacturer in Sialkot. Its main categories are American Football, Baseball, Basketball, Ice Hockey, Rugby, and Soccer. Its content discusses sublimation, embroidery, screen printing, custom branding, and private labels. Treat those as the initial content direction.

The [source logo](https://teamcoresportswear.com/wp-content/themes/theme/image/logo.jpeg) is a 1254 × 1254 JPEG with a red-and-white TC symbol on black. The wording in the new application must always be **Team Core Sports Wear**, as requested by the owner.

All six linked category pages were fetched. Each contains eight product-image references: 48 references total. These are not necessarily 48 distinct products: some describe back views, side details, or a kit view. The [Soccer reference](https://teamcoresportswear.com/wp-content/themes/theme/categories/soccer.html) also shows bulk pricing and a quote configurator. Map each image to a verified product or gallery before importing.

Local reference evidence:

- `docs/teamcore/reference/team-core-source-logo.jpeg` — original logo, unedited.
- `docs/teamcore/reference/source-home-desktop.png` — screenshot of the supplied site's desktop hero.
- `docs/teamcore/reference/source-asset-inventory.json` — category URLs, all 48 image references, source labels, and logo hash.

Source-site limitations affecting the plan:

- Several homepage illustrations use a `/generated/` asset path. Their provenance is unresolved; they are reference artwork, not proof of a real factory or customer delivery.
- Some category images had not loaded at initial browser inspection. Validate final image responses and decoding before using them; do not classify lazy images as broken solely from that snapshot.
- The soccer table includes a 1–99 tier while its configurator states a minimum of 15. Resolve the actual MOQ and price basis before publishing transactional prices.
- Published testimonials, customer counts, export counts, turnaround promises, and certification-style claims need business evidence before reuse. A public website statement alone is insufficient verification.
- The reference site's privacy and terms links point to `#`. Provide real policy destinations in the redesigned store.

No local storefront runtime, copied database, payment provider, mail delivery, or production host was tested in this planning pass. This plan distinguishes implemented source capabilities from operational acceptance.

## 2. Recommended direction and platform inspiration

**Direction:** a product-led sportswear storefront with white catalogue surfaces, a charcoal header/footer, strong red actions, clear product information, and occasional dark photographic brand sections. Keep the TC logo prominent and bring the buyer quickly to their sport and order requirements.

| Reference reviewed | Pattern to adapt for Team Core | Result in this plan |
| --- | --- | --- |
| [Alibaba](https://www.alibaba.com/) | Category discovery, sourcing language, quotation entry, buyer account access | Persistent quote basket, visible customization/MOQ information, short path to a bulk request |
| [Amazon](https://www.amazon.com/) | Prominent search, category selector, accessible account/orders/cart destinations | Search-centred header; scannable cards; clear variant, quantity, total, and order information |
| [Airbnb](https://www.airbnb.com/) | Focused search, clear browsing groupings, approachable navigation | Simple sport selection, spacious content hierarchy, concise mobile filter interactions |
| [Nike](https://www.nike.com/pl/) | Sports collection storytelling and image-led merchandising | Confident sporting imagery and focused collection panels with a direct catalogue action |

These are design interpretations, not claims that these platforms implement Team Core's business rules. Airbnb's public extraction was partially limited without JavaScript; Nike redirected to its Polish storefront. Use their interaction principles as inspiration and develop original Team Core layouts, copy, and assets.

### Intended buyers and primary actions

| Buyer | Main need | Primary path |
| --- | --- | --- |
| Team, school, club, or league | Uniforms with sizes, names, numbers, and team artwork | Sport → design/product → quote basket → request → reviewed quotation |
| Wholesaler or apparel brand | Repeatable products and private labels | Catalogue/private-label page → specifications → bulk quotation |
| Returning customer | Existing designs, order progress, repeat enquiry | Account → saved design or order → explicit next action |
| Buyer of a directly purchasable item | Available variant and complete checkout total | Product → shopping cart → checkout → provider-confirmed order |

Quote actions lead on custom uniforms. Direct purchase actions remain available according to the current backend `purchaseMode` and checkout availability. Do not silently change every product into a quote-only product.

## 3. Brand and design system

### Identity rules

- Display the complete name in the header lockup, footer, titles, contact screen, auth screens, customer documents, and relevant account views.
- Use the original TC mark, with correct proportions and readable surrounding space. In compact navigation, pair the logo with a legible live-text name; the small wording inside the square image should not be the only brand identification.
- The supplied asset is opaque JPEG. Initially place it on a black/charcoal logo tile. If a transparent or horizontal production asset is needed, derive it deliberately from an owner-approved source and visually review its edges. Renaming it to PNG will not create transparency.
- Provide source artwork, header/footer versions, a TC favicon, application icons, and a dedicated social-share image. Use the full logo on larger surfaces and an approved TC mark at favicon size.
- Retire copied taglines, initials, fallback art and partner text, and the former burgundy/cream visual language from the customer experience.

### Proposed palette

| Token | Proposed colour | Use |
| --- | --- | --- |
| Brand red | `#C6010B` | Primary actions, active navigation, selected controls, small brand accents |
| Red hover | `#A50009` | Hover/pressed actions |
| Charcoal | `#111114` | Header, footer, dark feature sections |
| Main text | `#18181B` | Headings, product names, totals |
| Secondary text | `#62666F` | Supporting copy, labels and metadata |
| White | `#FFFFFF` | Cards, forms and main page surfaces |
| Soft surface | `#F5F6F8` | Catalogue background and section separation |
| Border | `#E2E4E8` | Dividers and normal controls |
| Red tint | `#FFF0F1` | Selected options and supporting brand panels |
| Success | `#166534` | Confirmed state labels with an icon/text label |
| Warning | `#92400E` | Pending/review states with explicit wording |

`#C6010B` is a representative sampled red from the JPEG, not an official Pantone value. The palette is proposed for implementation review. Keep functional colours semantically separate from the brand colour; measure text and control contrast in the final designs.

### Typography, proportions, and components

- Reuse locally bundled Inter for body copy, labels, product titles, and forms. Retain Barlow Condensed only as an optional restrained display face for sports campaign headings; avoid condensed transactional text.
- Body text: 16px default; form inputs: at least 16px; supporting text: generally 14px. Headings use a responsive scale, with campaign titles approximately 36–64px.
- Main content width: up to 1440px. Gutters: 16px mobile, 24px tablet, 32px desktop. Use a consistent 4/8px spacing scale.
- Cards and controls: 8–12px corners, clear borders, modest shadows. Product photography sits on neutral surfaces without heavy colour overlays.
- Shared variants: primary/secondary/text actions; cards; price/MOQ facts; purchase-mode badges; selects; accordions; drawers; dialogs; step indicators; status labels; skeletons; notices; tables and mobile equivalents.
- Every component specifies default, hover, focus, selected, disabled, loading, error, empty, and success states as applicable.
- Animate opacity/transform gently, generally 150–250ms. Support reduced motion. Keep essential information visible without scroll-reveal scripts. No rotating autoplay offer banners or moving content required to understand a product.

## 4. Navigation and overall layout

### Desktop shell

1. Slim utility bar: manufacturer/location text, contact/help access, and wholesale entry. Avoid unsupported promises or an inactive currency switcher.
2. Main charcoal header: TC logo and full name; prominent white search field; account, quote basket, shopping cart; red quotation entry.
3. Light navigation row: All Sports, six sport destinations, Custom Uniforms, Private Label, Design Your Kit, About, Contact. Use a concise sport mega menu when space permits.

Search placeholder: **“Search uniforms, kits or product code”**. Existing name/SKU search remains the baseline. The main search submits to `/search?search=...`. Sport shortcuts navigate to real category routes; do not introduce server search filters implicitly. Autosuggestions are optional enhancement work after verifying suitable API support.

The quotation entry goes to `/wholesale`, where buyers can choose products, open their quote basket, or discuss a custom brief. Do not send an empty quote basket directly into a protected submission form.

### Mobile shell

- First row: compact logo/name, quote and cart counts, menu. Account/help live in the navigation drawer.
- Full-width search immediately below. Keep the primary sticky portion short after scrolling.
- Sport chips may scroll horizontally inside their own clearly bounded strip. Main content must not overflow.
- Drawer groups: Shop by Sport, Custom Orders, Company & Support, Your Account.
- Product pages may have one sticky bottom action matching the product's allowed purchase mode. It must account for device safe areas, open keyboards, notices, and contact controls.
- Avoid competing bottom navigation, multiple floating buttons, and a sticky purchase bar all occupying the same area.

### Footer

Full logo/name and short manufacturer introduction; six sport links; custom orders/private label/design studio; help/policies; account order/quote links; contact details; copyright. Every link resolves to a real destination.

Contact details displayed on the [reference site](https://teamcoresportswear.com/#contact): Sialkot, Punjab, Pakistan; `+92 307 5448383`; `teamcoresportswear@gmail.com`; Instagram `@teamcoresportswear`. Use these as proposed configuration and verify them with the owner before publication. A WhatsApp link opens the customer's conversation; it does not automatically send a message.

## 5. Homepage — complete section order

| Order | Section | Content and layout | Main action |
| --- | --- | --- | --- |
| 1 | Header and search | Shared navigation described above | Search or browse by sport |
| 2 | Compact sporting hero | Original product/team visual; full brand; proposed headline **“Your team. Your colours. Your uniform.”**; one short paragraph | Explore Uniforms; Request a Bulk Quote |
| 3 | Capability strip | Custom design, team personalization, private labels, export support as supported by approved content | Learn about customization |
| 4 | Shop by Sport | All six categories: clear images, category names, real destinations | Open category |
| 5 | Uniform Design Selection | Up to eight curated, verified catalogue products; neutral product cards | Product detail; View All |
| 6 | Build Your Team Kit | Split panel explaining colour, logo, player name/number and size selection | Open design studio if available |
| 7 | Private Label & Wholesale | Wholesaler/brand panel with specification, branding and packaging guidance | Private-label details or quote guidance |
| 8 | Fabrics & Decoration | Sublimation, embroidery and screen-printing explanations with suitable approved visuals | Custom Uniforms page |
| 9 | From Brief to Finished Kit | Brief → design/proof → specification agreement → production → quality check → dispatch | Manufacturing Process page |
| 10 | About Team Core | Concise Sialkot company introduction, supported factory/product image | About page |
| 11 | Customer Work | Verified delivered-kit stories with consent; omit when unavailable | Relevant product or enquiry |
| 12 | FAQ | MOQ, custom design, artwork, sizing, quotation, payment and delivery questions | Full FAQ or contact |
| 13 | Final quote panel | Specific prompt to share sport, quantity and branding requirements | Quote guidance or custom enquiry |
| 14 | Footer | Full company/support/contact structure | Working destinations |

Do not label a default API slice “Best Sellers” or “Trending”. Use “Uniform Design Selection” until a real curation/ranking source exists. Missing optional marketing content should collapse cleanly; required catalogue areas show honest empty/error/retry states.

Keep the hero approximately 400–480px on desktop so the first sport/category content is close to the fold. On mobile, use concise copy with a product image and immediate sport browsing, rather than a full-height video hero. Video can be a later optional enhancement with a poster and reduced-data/motion handling.

### Desktop homepage wireframe

```text
Manufacturer/contact utility row
TC + full name | Search uniforms / product code | Account | Quote | Cart
All Sports | Custom Uniforms | Private Label | Design Your Kit | About | Contact
Hero copy + two actions                 | Team Core uniform visual
Capability strip
Six sport cards
Uniform Design Selection — product cards
Design your team kit                     | Private-label / wholesale panel
Fabric and decoration cards
Manufacturing steps
About Team Core + approved image
Verified customer work, when available
FAQ + final quotation invitation
Company / Sports / Support / Contact footer
```

## 6. Catalogue, categories, search, and product details

### Sport/category pages

- Breadcrumb, sport title, short introduction, and compact supporting image.
- Product count, supported sorting, and a sidebar on desktop; Filter/Sort drawer on mobile.
- Initial filters: category, search, purchase mode. Initial sorting: newest, name, price ascending/descending, matching the current service.
- Only expose size, fabric, age group, decoration, price-range or lead-time filtering after validating structured data and server support. These must work across the whole paginated catalogue, not just the loaded page.
- Grid: four columns at wide desktop sizes, three when a sidebar narrows the content, two on tablet/mobile where cards remain readable. Very narrow screens can use one column.
- Shareable URL filters and pagination, reset-to-first-page on filter changes, result count, clear filters, no-result guidance, and a recoverable API error state.
- Source category names map to verified backend category slugs. Do not guess a slug or leave a branded tile linked to an unrelated copied collection.

### Product card

Square product image; category; product name; verified product code where available; price/currency or “Request pricing”; MOQ only when provided; concise customization indicator when supported; one clear detail action. Product selection occurs on the detail page when a variant is required. Wishlist controls appear only where the existing wishlist flow is connected.

Cards do not invent ratings, savings, quantity tiers, stock urgency, or delivery dates. Missing images use a Team Core placeholder and keep the product accessible.

### Product detail

| Area | Planned presentation |
| --- | --- |
| Gallery | Large garment view, thumbnails, front/back/detail labels, accessible zoom/lightbox |
| Product summary | Name, SKU, sport, description, actual reviews if available |
| Commercial facts | Currency, configured price or quote language, MOQ, quantity increment, purchase eligibility |
| Variants | Existing size/colour/other options; available combinations and actual variant-specific image/price |
| Quantity | Server-aligned integer selection and errors; no arbitrary cap of 10 |
| Actions | Add to Quote Basket for permitted quote modes; Add to Cart for permitted direct modes; design entry for eligible products |
| Specification content | Material, fit, set contents, care and decoration where product-specific data exists |
| Size guide | Product-specific chart or contact guidance; no generic chart presented as universally correct |
| Custom order guidance | Explain artwork/proof and quotation; delivery/lead time remains estimate or agreed terms |
| Related range | Real same-category products; hide if unavailable |

Desktop uses a gallery and bounded sticky purchase panel. Mobile places gallery, title/commercial facts, options and actions before deeper accordions. The artwork preview remains a design proposal; only an explicit production-proof decision approves manufacture.

Quantity-tier tables are conditional on approved structured pricing. Current product fields do not establish a tier-pricing contract. Until that exists, describe bulk pricing through quotations; never use scraped tables to calculate checkout totals.

## 7. Custom orders, quote basket, checkout, and design studio

### Wholesale and custom enquiry

Rebuild `/wholesale` as a proper landing page for clubs and brands: uniform categories, customization options, how quotations work, access to the quote basket, and a contact path for a brief without existing catalogue products.

Catalogue quote journey:

```text
Product + variant + quantity
→ Quote basket
→ Sign in/register when submitting
→ Contact/team + destination + requirements
→ Review and submit
→ Reference and enquiry status
→ Staff quotation
→ Customer reviews terms and explicitly accepts/declines
→ Existing order and payment journey
```

- Quote basket shows selected variants, quantities, MOQ/increment feedback, edits, removal and a clear next action.
- Refresh product data from `/storefront/basket` before presenting submission-ready selections.
- Keep draft requirements and basket selections through authentication, with the current authorization boundaries.
- Existing form fields remain the base contract. Sport, deadline, fabric and decoration can initially be clearly labelled requirements in `notes`; dedicated fields need an agreed API extension.
- The basic wholesale inquiry DTO has no generic file-attachment field. Do not add a decorative upload that loses the file. Use the existing authenticated design-studio artwork path where appropriate, or separately scope a persistent attachment contract.
- For a custom brief without catalogue variants, use the existing contact service with labelled requirement text. The success screen says “Message received”; it must not impersonate a formal quote submission.
- Guest formal quotations and anonymous artwork upload are enhancements requiring backend/privacy/abuse design. Preserve the existing signed-in submission baseline.
- Formal quotation pages clearly show line items, currency, quantities, shipping, terms, expiry, status, and explicit acceptance/decline controls.

### Shopping cart and checkout

Restyle existing flows with concise steps and a clear order summary. Preserve server totals, shipping/tax calculation, idempotency, stock validation, currency consistency, eligibility and payment recovery.

Show only enabled payment methods. If checkout cannot serve a destination, provide the existing quote route. Return/cancellation/pending states explain the next action from the actual server/provider state. A payment redirect or quote acceptance is not payment confirmation.

### Design studio and saved designs

- Rebrand the studio shell, helper text, template cards, default sample text, save/submit panels, and proof screens.
- Desktop: clear garment workspace and grouped tools; mobile: focused workspace with tool drawers and manageable roster inputs.
- Retain existing artwork, player roster, draft recovery, preview/export, save, submission, revision and explicit proof-decision behavior.
- Respect the studio availability endpoint and valid templates. Hide or provide an honest unavailable state if the copied backend has not enabled it.
- Never rewrite an existing customer design's text, colours, or uploaded artwork during a brand migration. Default text changes apply only to new drafts.

## 8. Complete route coverage

The redesign includes every mounted customer route and all new company pages below. Authenticated customer screens are in scope because they are part of the storefront experience.

| Route(s) | Planned result |
| --- | --- |
| `/` | New homepage and full navigation shell |
| `/categories` | Six verified sport entry points and any additional approved Team Core collections |
| `/categories/:slug` | Sport landing/catalogue template |
| `/products`, `/search` | Search/filter/sort catalogue with truthful states |
| `/products/:slug` | New product-detail template and existing variant/commerce behavior |
| `/custom-uniforms` — new | Decoration, design choices, sizing, artwork and order guidance |
| `/private-label` — new | Brand/wholesaler capabilities and enquiry entry |
| `/manufacturing-process` — new | Brief, proof, specification, production and dispatch guidance |
| `/about`, `/wholesale`, `/contact`, `/faq` | Team Core content and working enquiry actions |
| `/design-studio` | Fully rebranded studio and availability states |
| `/cart`, `/quote-basket` | Consistent, distinct basket experiences |
| `/request-quote`, `/request-quote/success/:id` | Existing protected submission and reference/status experience |
| `/checkout`, `/checkout/return`, `/checkout/cancelled` | Existing protected checkout and reliable payment-state screens |
| `/login`, `/register` | Team Core auth layouts and original redirect/draft behavior |
| `/forgot-password`, `/reset-password`, `/verify-email` | Consistent form, loading, expiry/error and success screens |
| `/account` | Useful overview with orders, enquiries and saved designs |
| `/account/orders`, `/account/orders/:id` | Clear orders, detail, invoice, tracking and payment actions |
| `/account/wholesale`, `/account/wholesale/:id` | Enquiry and quotation lists/details with existing decisions |
| `/account/designs`, `/account/designs/:id` | Saved designs, revisions and proof review |
| `/account/chat`, `/account/notifications` | Restyled messages/notifications with existing privacy/access |
| `/account/profile`, `/account/addresses`, `/account/settings` | Consistent editable account forms |
| `/account/wishlist`, `/account/reviews`, `/account/returns` | Existing customer utilities with connected actions and empty states |
| `/help`, `/size-guide`, `/shipping-delivery`, `/returns-refunds`, `/payment-options` | Useful support pages tied to real business rules |
| `/privacy-policy`, `/terms`, `/cookie-policy`, `/accessibility` | Real pages with reviewed owner-specific content |
| Unknown paths and unavailable product/category slugs | Branded, helpful 404 with correct server status |
| Existing `/brands`, `/brands/:slug`, `/flash-sales` | Preserve/review current catalogue redirects |
| `/stores/:slug` | Preserve single-company behavior; no public competing-store directory |

A “Why Choose Us” navigation entry can target the About page's capability section. It does not require a repetitive standalone marketing page.

## 9. Content, assets, and catalogue preparation

### Asset preparation

1. Keep the original logo and source inventory for traceability.
2. Review the 48 image references: identify distinct garments versus galleries; check encoding, case-sensitive extensions, response status, image decoding, resolution and any embedded other-brand marks.
3. Obtain/reuse approved Team Core product/factory imagery. Treat generated reference illustrations as artwork, with suitable descriptions, not real manufacturing evidence.
4. Create optimized derivatives with dimensions and responsive `srcset`; use suitable WebP/AVIF with fallbacks and consistent garment framing. Product details need larger sources where available; avoid overstretching 550px images.
5. Save production assets under a dedicated Team Core path or approved asset storage. Do not depend on long-term hotlinking to WordPress theme directories.
6. Create the approved logo variants, favicon and social-share artwork. Check visibility on dark and light surfaces.

### Catalogue alignment

Changing frontend text will not replace copied catalogue records, categories, or products returned by the backend. Before public launch, use an isolated Team Core store/database configuration and a reviewed catalogue mapping.

Each product mapping records: source reference, real product identity, sport/category, images and gallery grouping, SKU/variant mapping, size/colour options, description/specifications, purchase mode, MOQ, increments, approved currency/price, and owner sign-off for commercial rules.

Do not relabel unrelated copied products as Team Core uniforms. Do not change product IDs merely to match source-site codes. Maintain operational identifiers deliberately during any separately scoped import.

Website scraping is discovery evidence. Catalogue import, store binding, transactional pricing and any database writes require their own reviewed implementation scope before launch.

### Copy direction

Use direct, practical language about team identity, garment choices, design review, and ordering. Suggested campaign headline and copy are new proposals, not existing company slogans. Avoid invented awards, certifications, factory scale, customer logos, review ratings, guaranteed delivery, or unsupported discounts.

Business terms needing final content: lead-time estimates, sample policy, MOQ, custom-item returns, delivery countries, taxes/duties, payment methods, quotation expiry, privacy contacts, retention and legal entity details. The visual implementation can progress while these are being resolved; publication requires complete accurate content.

## 10. Technical implementation map

| Area | Files/modules to address | Treatment |
| --- | --- | --- |
| Brand/config | `src/constants/config.ts`, new `src/config/brand.ts`, `src/components/common/Brand.tsx`, `public/` | One public brand configuration, accessible logo/name, contact and asset references |
| Visual system | `src/index.css`, `src/components/ui/*`, `src/components/home/manufacturing.css`, `src/features/design/studio.css` | Semantic tokens; remove/replace conflicting storefront hard-coded colours within scoped changes |
| Shared shells | `src/components/layout/{TopBar,Header,Footer,MainLayout,AuthLayout,AccountLayout}.tsx` | Desktop/mobile navigation and consistent public/auth/account presentation |
| Home/catalogue | `src/pages/{HomePage,CategoriesPage,ProductListingPage,ProductDetailPage}.tsx`, product/home components | Recompose sections and new reusable catalogue cards; keep real data/query states |
| Company/support | `src/pages/{InformationPage,ContactPage}.tsx`, new marketing page components | Team Core content and real routes |
| Commerce | `src/pages/{BasketPage,QuoteRequestPage,CheckoutPage}.tsx`, account order/quote screens | Presentation and usability improvements around unchanged financial/state contracts |
| Design | `src/features/design/*`, account design screens | Brand/presentation updates around the shared design contract |
| Routes and SEO | `src/App.tsx`, `src/constants/routes.ts`, `src/components/common/SEOHead.tsx`, `index.html` | New routes, page names, metadata and branding |
| Renderer | `src/entry-prerender.tsx`, `scripts/{prerender,serve,test-renderer}.mjs` | CSR/SSR parity, new marketing routes, assets, sitemap, hydration and fallback branding |
| Publicly surfaced supporting text | Relevant backend errors, design mail, notifications and generated invoices | Inventory brand references; make narrowly reviewed text/config changes if these reach customers |
| Release configuration | Existing workflow/site-origin/store-binding settings | Audit copied targets and origins; isolate Team Core before any deployment |

All `src/` and `scripts/` paths above are relative to `frontend/customer-portal` unless described otherwise. Admin visual redesign and seller experience changes are excluded. Backend changes are limited to explicitly reviewed public-brand/configuration dependencies; filter/data/upload extensions are separate bounded slices.

### Branding and persistence migration rules

- Search all customer-reachable text for TEAM CORE, TEAMCORE, Zaroox, Zerox, ShopVerse and obsolete taglines, then inspect context. The owner additionally required removal of copied branding from local history documents and artifacts; those originals are preserved outside the repository.
- Preserve API contracts, existing query behavior, amounts, currency, stock rules, authentication, permissions and payment/session identifiers.
- The frontend and renderer share `teamcore-query-state`; rename them together or keep the internal identifier during a safe compatibility transition. It is not enough to rename one side.
- Baskets and drafts use TEAM CORE storage namespaces. A new Team Core namespace prevents unrelated same-origin copied state from appearing in the new store. Migrate only when store identity and product IDs are validated; never silently carry TEAM CORE variant IDs into a new Team Core catalogue.
- Preserve existing legitimate saved designs and account data; do not clear unrelated state during branding edits.
- Give public assets stable Team Core names and update both the renderer's asset handling and metadata references.
- Never activate copied deployment jobs, original-host SSH targets, store IDs, SMTP identities or payment-return origins as an incidental frontend change.

## 11. Responsive, accessibility, performance, and SEO acceptance

### Responsive and accessibility

- Validate 360, 390, 768, 1024, 1440 and 1920px layouts; also inspect 320px and zoom/reflow for overflow and long labels.
- Header, navigation, product options, filters, baskets, forms, studio and customer tables must work by keyboard and touch.
- Visible focus, skip-to-content, semantic headings/landmarks, labelled fields, described validation, dialog focus trapping/return, and Escape-to-close where appropriate.
- Aim for 44px comfortable touch controls; comply with applicable WCAG 2.2 AA criteria. Normal text contrast at least 4.5:1; large text and essential control/focus contrast at least 3:1 where applicable.
- Selection/status cannot depend on red/green alone. Maintain clear labels and programmatically exposed states.
- Respect reduced motion; avoid surprise autoplay. Lightboxes have accessible controls and image alternatives.
- No horizontal page overflow or obscured actions at any tested viewport. Mobile order/specification tables have usable stacked or controlled-scroll representations.

### Performance and SEO

- Eager-load only the main hero image and preload the critical font subset; lazy-load below-fold images. Set dimensions to avoid layout shift.
- Retain route code splitting and defer the studio's heavier workspace until needed. Avoid adding a new UI framework.
- Target LCP ≤ 2.5s, INP ≤ 200ms and CLS ≤ 0.1, measured under documented conditions. Local lab results are provisional; field results need traffic after release.
- Public product/category/company pages retain meaningful server HTML, metadata, canonical URLs and proper error statuses. Add the new marketing routes to both routing/rendering and sitemap generation.
- Product JSON-LD uses actual product, price, availability and review information. Do not emit an offer for a quote-only product with an invented price.
- Keep account, basket, checkout, quotation and private-design routes out of public indexing, consistent with current privacy behavior.
- Set the Team Core canonical origin at publication; validate redirects for former theme-category URLs if this replaces the supplied WordPress website. Do not infer that replacing its hosting is authorized by a frontend-planning request.

## 12. Implementation sequence and review points

| Phase | Work and deliverables | Exit evidence |
| --- | --- | --- |
| 1. Baseline and content map | Preserve dirty state; verify local API/store isolation; map categories/products/assets; resolve commercial mismatches | Baseline diff, source inventory, supported-field/route checklist |
| 2. Brand system and visual specification | Final palette/logo treatment; shared component states; desktop/mobile header, homepage, catalogue and product-detail specifications | Reviewable layouts and design-system examples |
| 3. Shared shell and discovery | Tokens, brand, header/footer, homepage, categories, catalogue, search and product detail | Responsive screenshots, working destinations, genuine data/error states |
| 4. Custom order and purchase flows | Wholesale/private-label/custom pages; baskets; quote form; checkout and return presentation | Variant/quantity, quote and checkout regression evidence on local/test services |
| 5. Customer/auth/design | All auth/account pages, studio, saved-design and proof screens | Protected navigation, session/draft continuity and proof-decision checks |
| 6. Content and rendering completion | About/support/policies, metadata, favicons/share assets, SSR routes/sitemap and fallback text | Route/brand audit and renderer evidence |
| 7. Local release candidate | Typecheck/build, meaningful regressions, browser/accessibility/performance checks; defects revised and revalidated | Reviewable frontend diff, screenshots, check summary, unresolved content list |
| 8. Approved publication | Confirm isolated Team Core data/config, origin/redirects and release destination; publish only after release authorization | Separate live revision, HTTP/SSR, assets and approved transaction checks |

Each material iteration follows create → validate → inspect → review → revise → validate again → approve → continue. Keep review focused on the defined deliverables. This plan creates no separate workflow application or infrastructure stack.

Allow up to two revision rounds for each visual specification or implementation review batch. If a substantive disagreement remains, document the exact unresolved issue and request the owner's choice rather than continually redesigning.

The immediate decision is acceptance of the overall visual/scope direction. Further clarification is necessary only for choices that materially affect implementation, or unresolved owner-controlled publication facts. Routine component and responsive decisions can proceed within an accepted plan.

## 13. Verification plan

These are implementation checks, not checks claimed to have passed during planning. Inspect existing scripts and use an isolated local API/renderer before running commands that rely on catalogue services.

From `frontend/customer-portal`:

```powershell
npm run lint
npm run test
npm run build
npm run build:server
```

When local backend/catalogue and the storefront renderer are available:

```powershell
npm run build:prerender
node scripts/test-renderer.mjs
```

Update renderer assertions only as necessary for deliberate branding/route changes. Review existing failures against the recorded baseline so unrelated copied work is not misattributed to the redesign.

| Scenario | Required evidence |
| --- | --- |
| Branding | Logo/full name, no obsolete customer-facing brand text in UI, SSR, metadata, fallback/error pages and documents |
| Catalogue | Six real category destinations; actual mapped products; persistent URL filters; pagination/search; missing-image and API errors |
| Product selection | Valid variant, image/price changes, unavailable combinations, MOQ/increments, direct/quote/both modes |
| Quotations | Basket editing, sign-in return, preserved requirements, successful reference, invalid submission recovery, correct account status |
| Payments | Enabled methods, server totals/currency, checkout recovery, cancellation/pending/success without duplicate orders; no real charge for a frontend visual check |
| Customer access | Auth redirects, private account access, logged-out/expired state, orders, messages and forms remain functional |
| Studio | New default branding, supported templates, local draft recovery, upload/save/submit, proof approval and rejection; existing designs unchanged |
| Rendering/SEO | New and existing public routes; 404 statuses; sitemap/canonical/structured data; private noindex routes; hydration consistency |
| Responsive/accessibility | Desktop/tablet/mobile screenshots, keyboard/touch flows, focus/dialog behavior, reduced motion, contrast and overflow checks |
| Release identity | Correct Team Core host/store/origin and version; no accidental original-store deployment or shared-store relabelling |

Add tests for changed behaviors and meaningful regressions; do not write tests that merely mirror CSS declarations or brand strings. If implementation is exclusively presentational in a particular area, visual and focused manual evidence may be the appropriate validation.

## 14. Final deliverables and completion criteria

Deliverables after implementation approval:

1. Complete rebranded customer frontend with shared responsive navigation and consistent design tokens.
2. Team Core homepage, six verified sport destinations, catalogue, product details and new custom/private-label/process pages.
3. Restyled buying, quotation, authentication, customer account and design-studio journeys using existing contracts.
4. Prepared brand/product assets with source mapping, metadata/favicons/social artwork and SSR/sitemap parity.
5. Tested local release candidate with screenshots, focused regression evidence and a bounded change list.
6. Explicit catalogue/configuration/content dependencies before publication, and separate live-release evidence if deployment is authorized later.

Completion means the full route inventory is reviewed; the storefront presents Team Core consistently; supported buying/quote/design flows remain correct; verified Team Core data powers product discovery; and remaining owner-controlled publication facts are documented. A new logo on the old homepage alone does not meet this scope.

### Proposed decisions for acceptance

- Exact public brand: **Team Core Sports Wear**.
- Visual direction: logo-derived red, charcoal and white, with a clean product-led catalogue.
- Scope: entire customer portal including auth, account and design studio; admin visual redesign excluded.
- Business presentation: one manufacturer, custom/bulk quotation prominently featured, direct checkout retained where enabled.
- Launch categories: the six sports found on the supplied website; additional collections only after catalogue verification.
- Implementation method: direct work in the existing React application, preserving the current dirty baseline and commerce logic.

Accepting these decisions authorizes preparation and implementation of the frontend redesign. It does not by itself authorize a production data import, payment activation, source publication, or deployment to the current Team Core or former store host.
