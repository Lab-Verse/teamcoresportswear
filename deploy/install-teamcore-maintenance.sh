#!/usr/bin/env bash
set -euo pipefail
test "$(id -u)" -eq 0
base=$(cd "$(dirname "$0")" && pwd)
install -m 750 "$base/backup-teamcore.sh" /usr/local/sbin/teamcore-backup
cat > /etc/systemd/system/teamcore-backup.service <<'EOF'
[Unit]
Description=Back up Team Core database, uploads, private designs and configuration
After=postgresql.service
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/teamcore-backup
UMask=0077
EOF
cat > /etc/systemd/system/teamcore-backup.timer <<'EOF'
[Unit]
Description=Daily Team Core backup
[Timer]
OnCalendar=*-*-* 03:15:00 UTC
RandomizedDelaySec=10m
Persistent=true
[Install]
WantedBy=timers.target
EOF
install -d /etc/letsencrypt/renewal-hooks/deploy
install -m 750 "$base/reload-nginx.sh" /etc/letsencrypt/renewal-hooks/deploy/teamcore-nginx
systemctl daemon-reload
systemctl enable --now teamcore-backup.timer certbot.timer
systemctl start teamcore-backup.service
echo 'Daily local backups and certificate reload hook installed.'
