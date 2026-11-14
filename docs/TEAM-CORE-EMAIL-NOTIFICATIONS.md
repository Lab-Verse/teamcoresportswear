# Team Core production email

Verified 24 October 2026 at 18:13 UTC. Production release: `/opt/teamcore/releases/20261024-03`.

## Mailboxes and credentials

| Address | Purpose |
| --- | --- |
| sales@teamcoresportswear.org | New contact enquiries, quotation requests and business alerts |
| notifications@teamcoresportswear.org | Authenticated application sender |
| support@teamcoresportswear.org | Replies to customer transactional emails |
| info@teamcoresportswear.org | General business correspondence |
| aws@teamcoresportswear.org | Mailbox for the existing administrator identity |

Each mailbox has an independently generated password, a 1 GB quota and the hosting account's 200-message daily send limit. The existing default hosting mailbox was preserved. No forwarding rules were added.

User-authorized generated credentials are saved outside Git in `.local/mailboxes-20261024.json`, restricted to the current Windows user. A root-only copy is in `/etc/teamcore/mailboxes-20261024.json` on EC2. Website administrator credentials are separate and were not changed.

Webmail: https://server55.hndservers.net/roundcube/ (verified by the hosting control panel's sales-mailbox sign-in). Sign in using the complete email address and its saved mailbox password. SMTP uses `mail.teamcoresportswear.org:465` with implicit TLS; IMAP uses the same hostname on port 993 with TLS. Certificate verification is enabled.

## Live application configuration

Protected `/etc/teamcore/backend.env` enables notifications, selects the notifications mailbox as sender, sales as `ADMIN_EMAIL`, support as `MAIL_REPLY_TO`, and the correct public and administration HTTPS origins. The password is read from `/etc/teamcore/smtp-password`, root:teamcore mode 640; the environment file and account credential backup are root-only mode 600.

Contact alerts include the reference, sender, subject and complete message, link to `/contacts` in the admin portal, and use the customer's email as Reply-To. Quotation alerts include the reference, company/contact information, products, quantities, destination and request notes; they link to admin `/wholesale` and reply to the customer. Customer acknowledgements link to their own quotation page and reply to support. Public contact and footer email links now use the sales address.

The existing mail service retries transient sending failures three times. This change does not introduce a durable contact/quotation mail queue. Enquiries remain saved in the admin portal if email delivery fails; SMTP failures are logged by `teamcore-backend`.

## DNS authentication

The original MX and mail-host A records continue to use the existing hosting mail server `176.9.65.136`. The existing single SPF record authorizes that server. DKIM is enabled in DirectAdmin with selector `x`; the public RSA key was confirmed through authoritative DNS. DMARC was added at `_dmarc.teamcoresportswear.org` with `v=DMARC1; p=none; adkim=r; aspf=r`, TTL 300.

The tested recipients are on the same mail server; their local-delivery messages do not carry a DKIM signature. DNS and hosting DKIM configuration are verified, while signed delivery to an external provider and external spam-folder placement were not tested.

## Verification and cleanup

Authenticated SMTP from EC2 passed before the application was restarted. All five mailboxes subsequently passed authenticated IMAP access with certificate verification. Tests used a separately generated, temporary customer at the owned info mailbox.

Real browser workflows on the public HTTPS website successfully submitted:

- Contact enquiry `01d1c486-8158-4ab0-87f1-fcc8c76375dd`.
- A quote basket containing 30 soccer jerseys, customer sign-in, and quotation request `RFQ-20261024-CE01E067`.

Read-only IMAP verification confirmed both alerts in sales and the quotation acknowledgement in info, including exact references, sender, Reply-To, admin/account URLs and quotation details. `teamcore/email-20261024/email-receipts.json` records the message IDs and checks. Screenshots show the live confirmations, sales inbox, received quotation and mailbox setup.

Only the uniquely labelled test contact, inquiry/items and temporary customer were removed after verification. Its sessions/tokens were removed by their database relationships. Audit history and the clearly labelled verification emails were retained. Final database counts were 37 products, one original administrator and zero orders. Existing business data and mailbox accounts were preserved.

Backend validation passed all eight suites (34 tests), followed by the expanded quotation suite (five passing tests, including the new notification-details assertion). This covers 35 distinct tests. Backend and customer client/SSR production builds passed. Live public forms and received messages verify the deployed runtime separately from these local checks.

## Release and maintenance

Release 03 starts from an untouched copy of release 02, with scoped backend and storefront patches. Linux dependencies, admin assets, database schema and private uploads are unchanged; no migrations were pending. The storefront was built with `/api`, the public HTTPS origin and local preview disabled.

Patch archive SHA-256 values, matched on EC2:

```text
backend:    d87e841b1ce64b518078a14d02c831ed5f2ad47cc99783ea7981c80e6f320890
storefront: 4912cf53eb00b87d56f125f74ded3bdfb3937a2d21ec1273b5f93aae73f0ce78
```

Activation took the existing protected backup before switching releases. The same daily backup includes `/etc/teamcore`, including the new SMTP credential and mailbox recovery file. A post-verification backup was also taken. Roll back application code with release 02's activation script if needed; email configuration is independent and can remain enabled. Payment collection remains disabled.

Operator tools under `deploy/` prepare a labelled temporary customer, verify exact receipt references read-only, and remove only matched test fixtures. They are explicit live-test tools and must not run as unattended smoke tests. Never commit or print the credential file, SMTP password or test-account password.
