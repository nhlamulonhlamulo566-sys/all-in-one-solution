# All In One Solution

## MySQL-backed application data and authentication

Customer quotations, callback requests, contact messages, staff accounts,
announcements, chat sessions, and chat messages are stored in the
`allinonesolution` MySQL database. The customer-request dashboard at `/admin`
shows the incoming leads, request totals, and 14-day live activity chart.
Staff dashboards refresh their MySQL data automatically.

### Configure and run

1. For local development, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
   and `DB_NAME` (normally `allinonesolution`) in `.env.local`. Vercel uses the
   HTTPS database gateway described below. `GEMINI_API_KEY` is required for
   the AI FAQ endpoint. Keep all values server-side and out of source control
   and `NEXT_PUBLIC_` variables.
2. Use [`database/schema.sql`](./database/schema.sql) as the database schema
   reference. Existing deployments must also have the MySQL-auth tables and
   chat-column migration applied; do not rely on `CREATE TABLE IF NOT EXISTS`
   to alter existing tables.
3. Start the development server with `npm run dev`.

### Vercel access to a locally hosted MySQL database

Vercel functions cannot open a raw MySQL connection through a standard
Cloudflare Tunnel TCP hostname. Run the restricted HTTPS gateway in
`database-gateway/server.mjs` on the MySQL host and configure a separate
Cloudflare Tunnel public hostname (for example, `db-api.example.com`) to route
HTTPS requests to `http://localhost:8787`.

On the MySQL host, install the project dependencies, set its existing
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` values plus a
random `DB_GATEWAY_TOKEN` of at least 32 characters, then run
`npm run db-gateway`. The gateway binds to `127.0.0.1` by default. If
`cloudflared` runs in an isolated container or VM, set `DB_GATEWAY_HOST` to a
private host-side address reachable from that connector and use the same
address as the tunnel service origin; do not bind to all interfaces unless
firewall rules restrict access to the connector. For a named tunnel, add a
public hostname such as `db-api.example.com` and route its service to
`http://localhost:8787` when the gateway and connector share a network
namespace. Add
`DB_GATEWAY_URL` (for example, `https://db-api.example.com`) and the same
`DB_GATEWAY_TOKEN` to the Vercel Production environment, then redeploy.
Only SQL statements extracted from the app's literal query strings are
accepted by the gateway. Do not expose its token to browser code.

The gateway uses TLS between the browser-independent app server and Cloudflare,
and Cloudflare Tunnel encrypts traffic to the MySQL host. Configure a trusted
CA for the MySQL host connection when possible; unverified TLS is supported for
self-signed local certificates but does not authenticate the database server.

### MySQL accounts and staff roles

Public registration is disabled. Visitors can use public site features,
including contact requests, published announcements, and visitor chat, without
signing in. Only staff, administrators, and super administrators can log in at
`/login`. Passwords are hashed with Node.js `scrypt`; the browser receives only
an `HttpOnly`, `SameSite=Lax` session cookie, while MySQL stores a hash of the
opaque session token. Sign-out revokes the session in MySQL.

The account roles are `staff`, `admin` (Administrator), and `super_admin`
(Super administrator). Administrators can use staff tools and create staff
accounts. Only a super administrator can create administrator accounts or
change account roles. The last super administrator cannot be demoted.

For existing databases, confirm there are no accounts with the legacy `user`
role, then apply the role migration:

```sql
ALTER TABLE website_users
  MODIFY role ENUM('staff', 'admin', 'super_admin')
  NOT NULL DEFAULT 'staff';
```

Provision the first super administrator through a trusted database
administrator. `/admin/users` then lets super administrators manage the team.
The runtime MySQL identity needs `SELECT` and `INSERT` on `website_users`, plus
permission to update only its `role` column; do not grant unrestricted table
updates just for the role manager.

### Announcements, chat, and former Firebase data

Published announcements and visitor chat use MySQL. Anonymous chat sessions
are owned by random visitor tokens; MySQL stores only their SHA-256 hashes.
The public site displays a floating “Chat with us” launcher on visitor pages;
visitors can send questions without signing in, and staff can answer and manage
those conversations at `/admin/chat`. Chat sessions are created when a visitor
opens the widget. Staff chat and lead APIs require a valid MySQL session and a
`staff`, `admin`, or `super_admin` MySQL role.

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
