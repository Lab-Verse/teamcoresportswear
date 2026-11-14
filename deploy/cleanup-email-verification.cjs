// Remove only this operator session's labelled email verification fixtures.
// Does not delete mailbox accounts, received messages or audit history.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Client } = require('/opt/teamcore/current/backend/node_modules/pg');
async function main() {
  const fixture = JSON.parse(fs.readFileSync('/home/ubuntu/.teamcore/email-test-account.json', 'utf8'));
  const contactId = process.argv[2];
  const quoteReference = process.argv[3];
  assert.ok(contactId && quoteReference, 'Supply the exact verified contact ID and quote reference');
  assert.equal(fixture.email, 'info@teamcoresportswear.org');
  assert.match(fixture.marker, /^EMAIL-VERIFY-20261024\d+$/);
  const db = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE });
  await db.connect();
  try {
    await db.query('BEGIN');
    const user = await db.query('SELECT id FROM users WHERE id=$1 AND email=$2 AND first_name=$3 AND last_name=$4 FOR UPDATE', [fixture.id, fixture.email, 'Email verification', fixture.marker]);
    assert.equal(user.rowCount, 1, 'Stop: fixture customer does not match');
    const inquiry = await db.query('SELECT id FROM wholesale_inquiries WHERE reference=$1 AND customer_id=$2 AND notes LIKE $3 FOR UPDATE', [quoteReference, fixture.id, fixture.marker + '%']);
    assert.equal(inquiry.rowCount, 1, 'Stop: fixture quotation does not match');
    const contact = await db.query('SELECT id FROM storefront_contacts WHERE id=$1 AND email=$2 AND subject LIKE $3 FOR UPDATE', [contactId, fixture.email, fixture.marker + '%']);
    assert.equal(contact.rowCount, 1, 'Stop: fixture contact does not match');
    assert.equal((await db.query('SELECT id FROM wholesale_quotations WHERE inquiry_id=$1', [inquiry.rows[0].id])).rowCount, 0, 'Stop: quotation has been acted on');
    await db.query('DELETE FROM wholesale_inquiries WHERE id=$1', [inquiry.rows[0].id]);
    await db.query('DELETE FROM storefront_contacts WHERE id=$1', [contactId]);
    await db.query('DELETE FROM users WHERE id=$1', [fixture.id]);
    await db.query('COMMIT');
    const counts = (await db.query('SELECT (SELECT count(*) FROM products) products,(SELECT count(*) FROM users) users,(SELECT count(*) FROM orders) orders,(SELECT count(*) FROM wholesale_inquiries WHERE customer_id=$1) remainingFixtureInquiries', [fixture.id])).rows[0];
    console.log(JSON.stringify({ removedOnlyLabelledFixtures: true, customerId: fixture.id, contactId, quoteReference, counts }));
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
