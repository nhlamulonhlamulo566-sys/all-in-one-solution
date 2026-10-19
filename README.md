# All In One Solution

## MySQL-backed application data and authentication

Customer quotations, callback requests, contact messages, staff accounts,
announcements, chat sessions, and chat messages are stored in the
`allinonesolution` MySQL database. The customer-request dashboard at `/admin`
shows the incoming leads, request totals, and 14-day live activity chart.
Staff dashboards refresh their MySQL data automatically.

### Configure and run

1. Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` (normally
   `allinonesolution`) in `.env.local`. `GEMINI_API_KEY` is required for the AI
   FAQ endpoint. Keep all values server-side and out of source control and
   `NEXT_PUBLIC_` variables. MySQL connections use TLS encryption but do not
   verify the server certificate, so a trusted CA is not required. This makes
   the connection vulnerable to interception by an active attacker; use only
   on a network you trust.
2. Use [`database/schema.sql`](./database/schema.sql) as the database schema
   reference. Existing deployments must also have the MySQL-auth tables and
   chat-column migration applied; do not rely on `CREATE TABLE IF NOT EXISTS`
   to alter existing tables.
3. Start the development server with `npm run dev`.

### MySQL accounts and staff roles

Create an account at `/signup` with a new password of at least 12 characters,
then sign in at `/login`. Passwords are hashed with Node.js `scrypt`; the
browser receives only an `HttpOnly`, `SameSite=Lax` session cookie, while
MySQL stores a hash of the opaque session token. Sign-out revokes the session
in MySQL. Public registration always creates a `user` role and cannot assign
staff privileges.

Firebase password hashes cannot be imported. Existing users must create a new
MySQL account/password. A database administrator promotes a trusted account
after signup, using its account email:

```sql
UPDATE website_users
SET role = 'staff'
WHERE email_address = 'staff@example.com';
```

Use `admin` only for administrators. Once an administrator account has been
provisioned, `/admin/users` lets administrators create accounts and change
roles. The runtime MySQL identity needs `SELECT` and `INSERT` on
`website_users`, plus permission to update only its `role` column; do not grant
unrestricted table updates just for the role manager. The first administrator
must be provisioned by a database administrator because public signup cannot
assign administrator privileges.

### Announcements, chat, and former Firebase data

Published announcements and visitor chat use MySQL. Anonymous chat sessions
are owned by random visitor tokens; MySQL stores only their SHA-256 hashes.
Staff chat and lead APIs require a valid MySQL session and a `staff` or
`admin` MySQL role.

AI FAQ answers and service descriptions use the server-side Gemini API; the
API key is never sent to the browser.

The app no longer uses Firebase Authentication or Firestore. Existing remote
Firebase/Firestore data has not been migrated or deleted. The checked-in
Firestore rules deny reads and writes, but must be deployed separately if
access to the remote Firestore database should also be blocked. Historical
records are intentionally left untouched.

For production, configure the MySQL server with a certificate signed by a CA
trusted by the application runtime and enable certificate verification before
handling customer personal data.
