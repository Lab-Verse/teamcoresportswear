#!/usr/bin/env bash
# Publish a checked storefront-only tar archive without migrating or restarting the API.
set -euo pipefail
previous_id=${1:?Current release ID required}
next_id=${2:?New release ID required}
archive=${3:?Storefront patch archive required}
sha=${4:?Expected SHA-256 required}
[[ $previous_id =~ ^[0-9]{8}-[0-9]+$ && $next_id =~ ^[0-9]{8}-[0-9]+$ && $sha =~ ^[0-9a-f]{64}$ ]]
test "$(id -u)" = 0
current=/opt/teamcore/current
previous=/opt/teamcore/releases/$previous_id
target=/opt/teamcore/releases/$next_id
test "$(readlink -f "$current")" = "$previous"
test ! -e "$target"
printf '%s  %s\n' "$sha" "$archive" | sha256sum --check --status
# Require a public-storefront-only archive, with no path traversal or environment files.
tar -tzf "$archive" | awk '$0 !~ /^frontend\/customer-portal\// || $0 ~ /(^|\/)\.\.?($|\/)|(^|\/)\.env/ { exit 1 }'
api_pid=$(systemctl show teamcore-backend -p MainPID --value)
test "$api_pid" -gt 0
/usr/local/sbin/teamcore-backup
cp -a "$previous" "$target"
portal="$target/frontend/customer-portal"
mv "$portal/dist" "$portal/dist-before-$next_id"
mv "$portal/server-build" "$portal/server-build-before-$next_id"
tar --no-same-owner -xzf "$archive" -C "$target"
cp -a --update=none "$portal/dist-before-$next_id/assets/." "$portal/dist/assets/"
test -s "$portal/dist/index.html"
test -s "$portal/server-build/entry-prerender.js"
test -s "$portal/scripts/serve.mjs"
chown -R root:root "$portal"
chmod -R u=rwX,go=rX "$portal"
rollback() {
  ln -sfn "$previous" "$current"
  systemctl restart teamcore-storefront
  echo 'Previous storefront restored.' >&2
}
ln -sfn "$target" "$current"
trap rollback ERR
systemctl restart teamcore-storefront
for attempt in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:3104/health >/dev/null 2>&1 &&
     curl -fsS http://127.0.0.1:3001/health >/dev/null 2>&1; then
    test "$(systemctl show teamcore-backend -p MainPID --value)" = "$api_pid"
    trap - ERR
    echo "Storefront release $next_id is healthy; backend PID unchanged ($api_pid)."
    exit 0
  fi
  sleep 2
done
trap - ERR
rollback
exit 1
