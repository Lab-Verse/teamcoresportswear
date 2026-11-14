"""Read-only mailbox verification for explicitly labelled live email tests.

Run on EC2 with sudo. Credentials remain in /etc/teamcore, never in output.
Only emails matching supplied test references are included in the evidence.
"""
import argparse
import email
import email.policy
import imaplib
import json
import ssl
from datetime import datetime, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--contact-id', required=True)
parser.add_argument('--quote-reference', required=True)
parser.add_argument('--output', default='/home/ubuntu/.teamcore/email-receipts.json')
args = parser.parse_args()
credentials = json.loads(Path('/etc/teamcore/mailboxes-20261024.json').read_text())
evidence = {'verifiedAt': datetime.now(timezone.utc).isoformat(), 'tlsCertificateValidation': True,
            'authenticatedMailboxes': [], 'deliveries': []}

for name, account in credentials['accounts'].items():
    with imaplib.IMAP4_SSL(credentials['smtpHost'], 993, ssl_context=ssl.create_default_context(), timeout=20) as mailbox:
        mailbox.login(account['email'], account['password'])
        evidence['authenticatedMailboxes'].append(account['email'])
        if name not in ('sales', 'info'):
            continue
        mailbox.select('INBOX', readonly=True)
        targets = [('New contact enquiry', args.contact_id, '/contacts'),
                   ('New quote request', args.quote_reference, '/wholesale')] if name == 'sales' else [
                       ('Quote request received', args.quote_reference, '/account/wholesale/')]
        for subject, reference, link_path in targets:
            status, found = mailbox.uid('search', None, 'SUBJECT', '"' + subject + '"')
            assert status == 'OK', 'Mailbox search failed'
            matching = None
            for uid in reversed(found[0].split()[-50:]):
                status, payload = mailbox.uid('fetch', uid, '(BODY.PEEK[])')
                assert status == 'OK', 'Mailbox fetch failed'
                raw = next(item[1] for item in payload if isinstance(item, tuple))
                message = email.message_from_bytes(raw, policy=email.policy.default)
                body = '\n'.join(part.get_content() for part in message.walk()
                                 if part.get_content_type() in ('text/plain', 'text/html'))
                if reference not in body:
                    continue
                assert 'notifications@teamcoresportswear.org' in str(message['From'])
                expected_reply = 'info@teamcoresportswear.org' if name == 'sales' else 'support@teamcoresportswear.org'
                assert expected_reply in str(message['Reply-To']), 'Incorrect reply address'
                expected_origin = 'https://admin.teamcoresportswear.org' if name == 'sales' else 'https://teamcoresportswear.org'
                assert expected_origin + link_path in body, 'Incorrect email destination link'
                if subject == 'New quote request':
                    assert '30 ×' in body and 'Soccer' in body and 'Sialkot, PK' in body, 'Quotation details missing'
                matching = {'recipient': account['email'], 'subject': str(message['Subject']),
                            'reference': reference, 'messageId': str(message['Message-ID']),
                            'from': str(message['From']), 'replyTo': str(message['Reply-To']),
                            'adminOrAccountLinkVerified': True, 'dkimSignaturePresent': bool(message['DKIM-Signature'])}
                break
            assert matching, 'Test message not yet received: ' + subject
            evidence['deliveries'].append(matching)

evidence['passed'] = len(evidence['deliveries']) == 3
Path(args.output).write_text(json.dumps(evidence, indent=2) + '\n')
print(json.dumps(evidence, indent=2))
