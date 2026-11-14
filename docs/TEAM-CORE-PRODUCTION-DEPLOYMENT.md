# Team Core Sports Wear production deployment

Deployment date: 24 October 2026, Asia/Karachi. Authorized destination: Ubuntu EC2 `3.87.169.239`, using the owner's existing SSH key. This publishes the current working-tree application; it does not push or rewrite Git history.

## Public endpoints

- Storefront: https://teamcoresportswear.org/
- Administration: https://admin.teamcoresportswear.org/
- API health: https://api.teamcoresportswear.org/health
- `www.teamcoresportswear.org` redirects to the canonical root domain.
- All HTTP hosts redirect to HTTPS. Storefront and admin API calls use same-origin `/api/`; WebSocket connections use `/socket.io/`.

## Release and source provenance

Active release: `/opt/teamcore/releases/20261104-01`, selected by `/opt/teamcore/current`. Previous release: `/opt/teamcore/releases/20261025-01`. The current release updates public SEO; see `TEAM-CORE-SEO-20261104.md` for Search Console, scoped deployment, checks and rollback. See `TEAM-CORE-FOOTER-FIX-20261025.md` and `TEAM-CORE-EMAIL-NOTIFICATIONS.md` for the prior footer and email releases.

The final release archive contains the application source and freshly compiled backend, admin frontend, storefront frontend and SSR bundle. Local environment files, dependency directories, review credentials, private designs, logs and browser-test output were excluded. Existing Linux dependency installations were retained when preparing release 02, using the unchanged package manifests and lockfiles.

Release archive SHA-256 (matched locally and remotely):

```text
6104aff2d3722a61046b7b5f870b14f319aa1850b72872ba5419489c2a8734fe
```

Git base: `31e511fa6a9cbc3ce3cbaaefed5b0390b2282dff`, with the owner's existing uncommitted redesign and backend changes included. The archive digest identifies the actual deployed snapshot; the Git base alone does not.

## Host configuration

- Ubuntu 26.04; Node.js 24.22.1 installed from the official distribution after SHA-256 verification.
- Nginx handles HTTP/HTTPS, static admin assets, uploads and proxying.
- PostgreSQL 18 runs only on `127.0.0.1:5432`.
- API service: `teamcore-backend`, bound to `127.0.0.1:3001`.
- SSR service: `teamcore-storefront`, bound to `127.0.0.1:3104`.
- Services run as the dedicated `teamcore` system user, restart on failure and start at boot. UFW allows SSH, HTTP and HTTPS; application/database ports are not public listeners.
- Persistent uploads: `/var/lib/teamcore/uploads`. Private design files: `/var/lib/teamcore/designs`, owned by the service user with mode 700.
- Protected application configuration: `/etc/teamcore/backend.env`, root-owned mode 600. Renderer configuration: `/etc/teamcore/storefront.env`.
- Fresh database credentials, JWT/encryption secrets and administrator password were generated on the server and were not printed or bundled into the release.
- Administrator identifier: `aws@teamcoresportswear.org`. Its initial password remains in the root-readable `SUPER_ADMIN_PASSWORD` setting on the server. Retrieve it privately through the authorized SSH session; do not paste it into chat or commit it.

Production runtime dependencies install with `npm ci --omit=dev --legacy-peer-deps`. This retains the peer resolution represented by the repository lockfiles; default peer resolution under the server's newer npm rejects those existing lockfiles.

## DNS and HTTPS

The signed-in hosting control panel is DirectAdmin. The following A records were configured with TTL 300, all pointing to `3.87.169.239`: root, `www`, `admin`, and `api`. Existing nameservers, MX, mail/pop/smtp and SPF records remain in place.

Some recursive resolvers initially retained the former root/www address under the previous 3600-second TTL. Both authoritative nameserver queries and Google/Cloudflare queries from EC2 confirmed the new target. The local network still returned the old host during verification and could show a certificate mismatch until its cache expired. No certificate warning was bypassed.

Let's Encrypt issued a certificate covering all four hosts, valid until 21 January 2027. DNS validation bootstrapped issuance while HTTP DNS caches were stale. Two public `_acme-challenge` TXT records were left as issuance evidence; renewal no longer depends on them.

Certificate configuration was then changed successfully to automatic HTTP webroot renewal with:

```bash
sudo certbot reconfigure --cert-name teamcoresportswear.org --webroot --webroot-path /var/www/acme --preferred-challenges http --non-interactive
```

The reconfiguration's simulated renewal passed. `certbot.timer` is active, and a successful-renewal deploy hook validates/reloads Nginx.

## Published business data and limits

All 31 migrations ran against the fresh database. A protected administrator and role/permission records were initialized. `backend/scripts/import-teamcore-catalogue.cjs` published 37 owner-source designs, six sports and one artwork-brief template into an initially empty catalogue.

No local test customers, orders, enquiries, simulated inventory, fabricated prices or assumed size ranges were imported. Products accept quotation enquiries using a custom-specification variant. The displayed production minimum, size measurements, fabrication and commercial terms require confirmation in the quotation; a minimum enquiry quantity of one is not advertised as a confirmed production MOQ.

Contact submissions persist in the database and are available through the protected admin enquiries page. Customer accounts, quote baskets, quotation APIs and design tools use the production API/database. Outbound email is now enabled and receipt-tested for contact enquiries, quotation alerts and customer acknowledgements. Alerts go to `sales@teamcoresportswear.org`. Payment collection remains disabled. The local-review banner is absent from production.

## Backup and rollback

`teamcore-backup.timer` runs daily at approximately 03:15 UTC with a randomized delay. Backups under `/var/lib/teamcore/backups` include a PostgreSQL custom-format dump, uploads, private designs and protected configuration, with fourteen-day local retention and restrictive file permissions. Backups currently reside on this EC2 host.

A completed backup was restored into a separate temporary database; all 37 products were confirmed, and that disposable database was removed. The production database was not replaced.

For an application rollback, use the reviewed activation script with the known prior release. Both releases use the same database schema:

```bash
sudo bash /opt/teamcore/releases/20261024-02/deploy/activate-teamcore-release.sh 20261024-02
```

Review migrations before using activation for a later release. Application rollback is separate from database restoration. Do not overwrite the current business database with a backup as part of a routine application rollback.

## Verification evidence

- Backend: 33 tests across eight suites passed; production build passed.
- Customer portal: nine unit tests passed; production client and SSR builds passed. Lint has zero errors and nineteen pre-existing non-null assertion warnings.
- Admin production build passed.
- Production API checks passed: six sports, 37 quote-only products, real variants, one brief template, protected administrator login, rejected unauthenticated enquiry access and saved contact round-trip. Only the newly generated deployment-verification contact was removed afterward. No real business messages or payments were sent.
- All 63 public SSR routes, actual 404s, private noindex shells, filtered collection data and redirects passed on EC2.
- Production browser checks passed for public routes, working assets, no browser exceptions, responsive overflow, slider controls, twelve capability cards, quote basket quantity, admin login and API health.
- The browser smoke test pinned the authorized domain names to the EC2 address during DNS propagation. TLS certificate validation remained enabled. Normal HTTPS requests from EC2 also passed using DNS resolution.
- Matching archive hashes, active services, private listener addresses, renewal configuration and backup restore were checked directly.

Screenshots and initial browser results are in `docs/teamcore/production-20261024/`. Email release evidence is in `docs/teamcore/email-20261024/`. Repeat the non-destructive browser smoke test from the customer portal using `node scripts/verify-production-browser.mjs`. The older `deploy/verify-teamcore-production.cjs` creates a labelled contact and now sends a real sales notification because email is enabled; it removes its test database row and never prints credentials. For email verification use the documented, labelled workflow in `TEAM-CORE-EMAIL-NOTIFICATIONS.md`.
