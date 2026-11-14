#!/usr/bin/env bash
# Fresh Ubuntu host. Run as root after installing nginx, PostgreSQL, certbot and Node 24.
set -euo pipefail
id teamcore >/dev/null 2>&1 || useradd --system --home /opt/teamcore --shell /usr/sbin/nologin teamcore
install -d -m 755 /opt/teamcore/releases /etc/teamcore /var/lib/teamcore/uploads /var/lib/teamcore/backups /var/www/acme
chown teamcore:teamcore /var/lib/teamcore/uploads
install -d -m 700 -o teamcore -g teamcore /var/lib/teamcore/designs
python3 - <<'PY'
from pathlib import Path
import secrets, subprocess, os
p=Path('/etc/teamcore/backend.env')
if not p.exists():
    password=secrets.token_hex(32)
    subprocess.run(['sudo','-u','postgres','psql','-v','ON_ERROR_STOP=1'],input=f"CREATE USER teamcore WITH PASSWORD '{password}';\nCREATE DATABASE teamcore OWNER teamcore;\n",text=True,check=True)
    values={
      'NODE_ENV':'production','HOST':'127.0.0.1','PORT':'3001',
      'DB_HOST':'127.0.0.1','DB_PORT':'5432','DB_USERNAME':'teamcore','DB_DATABASE':'teamcore','DB_PASSWORD':password,
      'JWT_SECRET':secrets.token_hex(64),'ENCRYPTION_KEY':secrets.token_hex(32),'TRUST_PROXY':'true',
      'FRONTEND_URL':'https://teamcoresportswear.org','FRONTEND_URLS':'https://teamcoresportswear.org,https://www.teamcoresportswear.org,https://admin.teamcoresportswear.org',
      'STOREFRONT_URL':'https://teamcoresportswear.org','ADMIN_URL':'https://admin.teamcoresportswear.org',
      'STOREFRONT_CHECKOUT_ENABLED':'false','PAYMENT_PROVIDER':'disabled','STOREFRONT_CURRENCY':'USD',
      'NOTIFICATION_ENABLED':'false','SMTP_HOST':'mail.teamcoresportswear.org','SMTP_PORT':'465','SMTP_SECURE':'true',
      'EMAIL_USER':'notifications@teamcoresportswear.org','EMAIL_PASS':'',
      'MAIL_FROM':'Team Core Sports Wear <notifications@teamcoresportswear.org>','MAIL_REPLY_TO':'support@teamcoresportswear.org','ADMIN_EMAIL':'sales@teamcoresportswear.org',
      'DESIGN_STUDIO_ENABLED':'true','DESIGN_PRIVATE_DIR':'/var/lib/teamcore/designs','STORAGE_DRIVER':'local','UPLOAD_DIR':'/var/lib/teamcore/uploads','UPLOAD_PUBLIC_URL':'https://teamcoresportswear.org/uploads',
      'SUPER_ADMIN_EMAIL':'aws@teamcoresportswear.org','SUPER_ADMIN_PASSWORD':secrets.token_urlsafe(30),
      'SUPER_ADMIN_NAME':'Team Core Sports Wear Administrator',
    }
    p.write_text(''.join(f'{k}="{v}"\n' for k,v in values.items()))
    os.chmod(p,0o600)
    print('Protected application configuration created; no credentials printed.')
else:
    print('Existing application configuration preserved.')
PY
cat > /etc/teamcore/storefront.env <<'EOF'
NODE_ENV=production
STOREFRONT_PORT=3104
STOREFRONT_HOST=127.0.0.1
PRERENDER_API_URL=http://127.0.0.1:3001
VITE_SITE_URL=https://teamcoresportswear.org
EOF
chmod 600 /etc/teamcore/storefront.env
cat > /etc/systemd/system/teamcore-backend.service <<'EOF'
[Unit]
Description=Team Core Sports Wear API
After=network.target postgresql.service
Requires=postgresql.service
[Service]
Type=simple
User=teamcore
Group=teamcore
WorkingDirectory=/opt/teamcore/current/backend
EnvironmentFile=/etc/teamcore/backend.env
ExecStart=/opt/node24/bin/node dist/src/main.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/teamcore/uploads /var/lib/teamcore/designs
UMask=0027
[Install]
WantedBy=multi-user.target
EOF
cat > /etc/systemd/system/teamcore-storefront.service <<'EOF'
[Unit]
Description=Team Core Sports Wear storefront renderer
After=network.target teamcore-backend.service
[Service]
Type=simple
User=teamcore
Group=teamcore
WorkingDirectory=/opt/teamcore/current/frontend/customer-portal
EnvironmentFile=/etc/teamcore/storefront.env
ExecStart=/opt/node24/bin/node scripts/serve.mjs
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
[Install]
WantedBy=multi-user.target
EOF
usermod -aG teamcore www-data
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl daemon-reload
systemctl enable teamcore-backend teamcore-storefront nginx postgresql
echo 'Host prepared. SMTP stays disabled until a password is entered and verified.'
