#!/usr/bin/env bash
set -euo pipefail
release=${1:?Provide a release directory name}
[[ "$release" =~ ^[a-zA-Z0-9_-]+$ ]] || exit 2
target=/opt/teamcore/releases/$release
test -f "$target/backend/dist/src/main.js"
test -f "$target/frontend/admin-portal/dist/index.html"
test -f "$target/frontend/customer-portal/server-build/entry-prerender.js"
cd "$target/backend"
export PATH=/opt/node24/bin:$PATH
if [ -L /opt/teamcore/current ]; then /usr/local/sbin/teamcore-backup; fi
node --env-file=/etc/teamcore/backend.env node_modules/typeorm/cli.js -d dist/src/config/data-source.js migration:run
if [ ! -f /etc/teamcore/initialized ]; then
  node --env-file=/etc/teamcore/backend.env dist/seeds/seed-permissions-super-admin.js
  node --env-file=/etc/teamcore/backend.env dist/seeds/seed-role-permissions.js
  node --env-file=/etc/teamcore/backend.env dist/seeds/seed-super-admin-user.js
  sudo -u postgres psql -d teamcore -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO stores(name,slug,description,logo_url,is_active,singleton_key)
VALUES('Team Core Sports Wear','teamcore-sports','Your team. Your colours.','/teamcore/logo.png',true,true)
ON CONFLICT(singleton_key) DO UPDATE SET name=EXCLUDED.name,logo_url=EXCLUDED.logo_url;
SQL
  touch /etc/teamcore/initialized
fi
chown -R root:root "$target"
chmod -R u=rwX,go=rX "$target"
ln -sfn "$target" /opt/teamcore/current
systemctl restart teamcore-backend teamcore-storefront
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3001/health >/dev/null && curl -fsS http://127.0.0.1:3104/health >/dev/null; then
    echo 'API and storefront are healthy'
    exit 0
  fi
  sleep 2
done
echo 'Application health check failed' >&2
exit 1
