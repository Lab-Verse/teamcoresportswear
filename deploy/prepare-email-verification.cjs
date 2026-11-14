// Operator-only live email verification. Creates one labelled temporary customer.
// Run on EC2 with node --env-file=/etc/teamcore/backend.env.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { Client } = require('/opt/teamcore/current/backend/node_modules/pg');
async function main() {
  const db = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE });
  await db.connect();
  const email = 'info@teamcoresportswear.org';
  try {
    assert.equal((await db.query('SELECT id FROM users WHERE email=$1', [email])).rowCount, 0, 'Verification address already registered; stop without changing it');
    const password = crypto.randomBytes(27).toString('base64url');
    const marker = 'EMAIL-VERIFY-' + new Date().toISOString().replace(/[^0-9]/g, '');
    const response = await fetch('https://teamcoresportswear.org/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName: 'Email verification', lastName: marker }),
    });
    assert.equal(response.status, 201, 'Temporary registration failed');
    const account = (await response.json()).data;
    const target = '/home/ubuntu/.teamcore/email-test-account.json';
    fs.writeFileSync(target, JSON.stringify({ email, password, id: account.id, marker }, null, 2), { mode: 0o600 });
    fs.chownSync(target, 1000, 1000);
    console.log(JSON.stringify({ createdTemporaryCustomer: true, id: account.id, marker }));
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
