#!/usr/bin/env python3
"""Run interactively with sudo. Never prints or stores a password in shell history."""
import getpass
import grp
import os
import sys
from pathlib import Path

incoming = Path('/home/ubuntu/.teamcore/smtp-password.txt')
password = (incoming.read_text(encoding='utf-8-sig').removesuffix('\n').removesuffix('\r')
            if '--import' in sys.argv else getpass.getpass('Password for notifications@teamcoresportswear.org (hidden): '))
if not password or '\n' in password or '\r' in password:
    raise SystemExit('A nonempty, single-line password is required.')
path = Path('/etc/teamcore/smtp-password')
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as f:
    f.write(password)
os.chown(path, 0, grp.getgrnam('teamcore').gr_gid)
os.chmod(path, 0o640)
env = Path('/etc/teamcore/backend.env')
lines = [line for line in env.read_text().splitlines() if not line.startswith(('SMTP_PASSWORD_FILE=', 'NOTIFICATION_ENABLED='))]
env.write_text('\n'.join(lines) + '\nSMTP_PASSWORD_FILE=/etc/teamcore/smtp-password\nNOTIFICATION_ENABLED=true\n')
os.chmod(env, 0o600)
print('SMTP credential saved securely. Verify authenticated SMTP before restarting the application.')
if '--import' in sys.argv:
    incoming.unlink()
