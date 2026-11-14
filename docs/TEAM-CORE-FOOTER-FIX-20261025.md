# Footer contact layout fix

Published 25 October 2026 to https://teamcoresportswear.org/ as release `20261025-01`. Previous release: `20261024-03`.

The general `.footer-grid > div > a:not(.brand)` selector set links to block layout and outranked the contact-row flex rule. This placed phone/email icons above their text and arrow icons below action labels. The contact selector now takes precedence, with explicit label spans for wrapping and fixed-size icons aligned to the first text line. Existing contact values, destinations, footer navigation and responsive column layout are preserved.

Only `frontend/customer-portal/src/components/layout/Footer.tsx` and `frontend/customer-portal/src/teamcore.css` differed from the deployed source when comparing 177 storefront source/configuration files before the build. The client and SSR production builds passed with `/api`, the public HTTPS origin and local preview disabled.

Local and live browser checks passed at 320, 390, 768, 1024, 1440 and 1920 pixels. Checks covered all five contact rows, icon/text alignment, text containment, correct phone/email/WhatsApp/contact links and no horizontal page overflow. The live check also verified no browser exceptions, no local-preview banner and healthy API/database responses. Screenshots and the live results are in `teamcore/footer-20261025/`.

Release archive SHA-256, matched locally and on EC2:

```text
7e3fabeddad989676b6bac3db4c6e8dc57c25ee04ee2a514e58635e7bd70c1f0
```

The release copied the prior release and replaced the storefront client/SSR output and the two source files. Previous hashed assets remain available for already-open browser sessions. A protected backup was taken before activation. Only `teamcore-storefront` restarted; the backend process ID remained unchanged. Database, administrator application, SMTP configuration and private uploads were not modified.

To restore the prior storefront from an authorized SSH session:

```bash
sudo ln -sfn /opt/teamcore/releases/20261024-03 /opt/teamcore/current
sudo systemctl restart teamcore-storefront
```
