# Team Core Sports Wear — local implementation and verification

**Production update, 24 October 2026:** The owner subsequently authorized EC2 publication on `teamcoresportswear.org`. See [TEAM-CORE-PRODUCTION-DEPLOYMENT.md](TEAM-CORE-PRODUCTION-DEPLOYMENT.md) for the actual release, DNS, TLS, production catalogue, operating procedures and verification. The original local-delivery notes below describe the earlier stage.

Implemented 13 October 2026 in `D:\work\Live-Projects\teamcore` following the approved frontend plan and the owner's repository-wide branding removal instruction.

The subsequent discovery sections, transparent logo, reference-based hero slider and twelve capability cards are documented in [TEAM-CORE-DISCOVERY-AND-HERO.md](TEAM-CORE-DISCOVERY-AND-HERO.md), with API contracts and additional verification.

## Delivered

- Red, charcoal and white design system with the supplied TC logo, full company name, favicon and social image.
- New search-centred desktop/mobile header, sport menu, quote/cart controls, company footer, and original homepage with sport discovery, uniform selections, customization, private labels, decoration, manufacturing guidance, about and FAQ content.
- Six-sport directory, catalogue cards, supported search/sort/purchase-mode filters, mobile filter drawer, and product presentation around the existing variant/quantity contracts.
- Dedicated custom-uniform, private-label, wholesale, about and manufacturing-process layouts; enhanced contact details and optional team requirements persisted through the contact service.
- Consistent customer, authentication, basket, checkout and design-studio presentation. Shared primary actions now use white text on red; password controls have comfortable targets.
- Customer identity, baskets, quote drafts, checkout recovery and design drafts use Team Core namespaces. Copied browser state is not silently transferred into a different store. Server-saved designs and permission/financial contracts were retained.
- Brand text updated in customer/admin supporting screens, API responses, notifications, invoices, mail templates, configuration, rendering and deployment file names.
- CSR/SSR public-route parity, new marketing routes, metadata, canonical configuration and sitemap handling.
- Repeated prerender runs preserve the empty client shell. The renderer refuses to start with a populated homepage shell, protecting private-route rendering from public catalogue snapshots.
- Browser regressions and isolated API checks, with a reproducible validation workflow. The copied production deployment workflow is manual-only.

## Repository cleanup

The existing dirty baseline was preserved before editing. Copied legacy logos, historical screenshots/documents, stale local data and build artifacts, and obsolete catalogue/provisioning helper artifacts were moved to a recovery directory **outside this repository**. Active deployment files were renamed and their references updated.

Recovery directory: `C:\Users\artte\AppData\Local\Temp\teamcore-recovery-20261013-175702`. This includes a baseline patch and preserved source. Do not copy its historical branding or old local credentials back into the new checkout.

The working-file text and filename audit found **zero former sports-brand matches**. It covered hidden and ignored working files, including rebuilt frontend/backend output, while excluding Git object storage, dependency packages and database binary storage. Git history was retained. The audit was repeated after the final documentation/build changes.

## Assets and local catalogue

The original website logo is retained under `docs/teamcore/reference/`. Optimized production assets are under `frontend/customer-portal/public/teamcore/`.

Of 48 image references on the supplied site, **47 decoded successfully**; the seventh baseball image returned HTTP 404 and was excluded. Alternate garment/kit/back/detail views were grouped into **37 reference designs**, with the mapping in `docs/teamcore/reference/local-catalogue-map.json`.

The catalogue is seeded only into an isolated loopback review database: PostgreSQL port **55443**, database `teamcore_redesign_test`. It is not an import into a business or production database. All source-reference designs are quote-only; commercial prices, specifications, sizes and minimums require owner confirmation for publication. Local quantities/variants are review fixtures. A local review banner makes this distinction visible.

One design-brief template is available for saving and reviewing a uniform proposal. It is not a sample-approved production template. Local account credentials are generated and stored only in ignored `.local/`; they are not included in documentation or Git.

## Verified results

| Check | Result |
| --- | --- |
| Customer TypeScript/client build | Passed |
| Customer unit regressions | 9 tests passed |
| Backend regression suite | 33 tests passed in 8 suites |
| Browser regression suite | 8 tests passed |
| Browser route coverage | 24 public routes plus 12 account routes, signed-out redirect, and private saved design flow |
| Responsive checks | Home/product/private-label pages fit 320, 360, 390, 768, 1024, 1440 and 1920px without page overflow |
| Automated accessibility | No WCAG A/AA violations detected on home, catalogue, product, contact and login in the documented browser checks |
| Local HTTP checks | Catalogue/variants, MOQ/increments, quotations and acceptance, ownership isolation, saved design, priced direct preview, disabled payment/checkout safety passed |
| Renderer | 63 public routes, 3 real 404s, 3 private noindex shells and a legacy redirect passed |
| Brand audit | Zero former-brand text or filename matches in audited working files |

Lint has no errors. Nineteen existing non-null assertion warnings remain in the copied design implementation/tests; they are recorded separately from the passing checks. Automated accessibility and browser evidence do not substitute for physical-device or assistive-technology UAT.

Evidence is saved in `docs/teamcore/`, including desktop/mobile homepage, account, quotation and studio screenshots and `http-verification.json`.

## Local review

- Frontend: `http://127.0.0.1:3013/`.
- Backend: loopback port 3011.
- Renderer: loopback port 3114, normally behind an API/assets reverse proxy.
- PostgreSQL: isolated loopback port 55443.

The local frontend `.env.local` points at the isolated API. Vite now loads the configured proxy target correctly. Payments and outbound email are disabled; local form submissions are saved locally and do not send business messages.

Normal commands, from the appropriate package directory:

```powershell
# backend
npm run build
npm test -- --runInBand
node scripts/seed-teamcore-local.cjs
node dist/src/main.js
node scripts/test-teamcore-http.cjs

# frontend/customer-portal
npm run dev -- --host 127.0.0.1 --port 3013 --strictPort
npm run lint
npm test
npm run build
npm run build:server
npm run test:e2e
```

The seed script refuses a non-loopback or differently named database. Seed only after the current migrations have run in the isolated review database. It refreshes generated review credentials. For browser tests install Chromium with `npx playwright install chromium`, or on this workstation set `PLAYWRIGHT_CHANNEL=chrome` to use the installed Chrome in a separate test profile.

For renderer/prerender verification set `PRERENDER_API_URL=http://127.0.0.1:3011` and an explicit local `VITE_SITE_URL`. The renderer reads compiled artifacts at startup; restart it after a new build. `scripts/test-renderer.mjs` accepts only a loopback test origin.

## Publication boundary

This delivery is local. No source push, production deployment, real charge, SMTP setup or live catalogue change was performed.

Before publication, replace review fixtures with the approved Team Core catalogue/store binding, confirm commercial rules and owner-specific legal/policy content, configure the real API/canonical origin and verified sender/payment settings, set `VITE_LOCAL_PREVIEW=false`, and choose an authorized release destination. The existing Git remote and copied infrastructure must be reviewed before source publication or deployment.
