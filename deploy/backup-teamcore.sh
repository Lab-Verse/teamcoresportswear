#!/usr/bin/env bash
set -euo pipefail
umask 077
backup_dir=/var/lib/teamcore/backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$backup_dir"
sudo -u postgres pg_dump -Fc teamcore > "$backup_dir/db-$stamp.dump"
paths=(var/lib/teamcore/uploads etc/teamcore)
if [ -d /var/lib/teamcore/designs ]; then paths+=(var/lib/teamcore/designs); fi
tar -czf "$backup_dir/files-$stamp.tar.gz" -C / "${paths[@]}"
# Only remove this application's backup files, under this fixed directory.
find /var/lib/teamcore/backups -maxdepth 1 -type f -name 'db-*.dump' -mtime +14 -delete
find /var/lib/teamcore/backups -maxdepth 1 -type f -name 'files-*.tar.gz' -mtime +14 -delete
echo "TEAM CORE backup completed: $stamp"
