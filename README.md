# All In One Solution

## MySQL-backed application data and authentication

Customer quotations, callback requests, contact messages, staff accounts,
announcements, chat sessions, and chat messages are stored in the
`allinonesolution` MySQL database. The customer-request dashboard at `/admin`
shows the incoming leads, request totals, and 14-day live activity chart.
Staff dashboards refresh their MySQL data automatically. Announcement and
request timestamps are displayed in South African time.

Administrators can update the About page leadership heading and introduction,
and add leadership profiles with photos, names, positions, and short bios from
`/admin/content`. Only administrators and super administrators can save
changes; the public About page reads the saved content from MySQL. Profile
photos are resized to JPEG and limited to 120 KiB each, six profiles, and 700
KiB combined. Apply migration
[`database/migrations/006-about-leadership-profiles.sql`](./database/migrations/006-about-leadership-profiles.sql)
before using profile editing on an existing database.

The Instant Quotation Calculator uses fixed, budget-conscious starter estimates
in South African rand rather than random prices: standard websites R3,500,
e-commerce R14,000, POS systems R18,000, and custom web apps R25,000 before
VAT. Other services start at R1,500, R3,500, or R7,500 depending on project
scale. Support starts at R200/month for other services and R250/month for
standard websites; hosting is R250/month for websites and R350/month for
databases. Expedited work adds 30%, advanced customization adds 25%, and
annual support/hosting is billed at ten monthly instalments. These are
preliminary estimates; confirm scope and the final amount in a written quote.

### Configure and run

1. For local development, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
   `DB_NAME` (normally `allinonesolution`), and the trusted MySQL certificate
   in `DB_SSL_CA` in `.env.local`. Multiline CA content may use literal `\n`
   sequences. Vercel uses the HTTPS database gateway described below.
   `GEMINI_API_KEY` is required for the AI FAQ endpoint. Keep all values
   server-side and out of source control and `NEXT_PUBLIC_` variables.
2. Use [`database/schema.sql`](./database/schema.sql) as the database schema
   reference. Existing deployments must also have the MySQL-auth tables and
   required migrations applied; do not rely on `CREATE TABLE IF NOT EXISTS` to
   alter existing tables. Apply [`database/migrations/005-about-leadership-content.sql`](./database/migrations/005-about-leadership-content.sql)
   and
   [`database/migrations/006-about-leadership-profiles.sql`](./database/migrations/006-about-leadership-profiles.sql)
   to existing databases before using the editable About page content and
   leadership profiles.
3. Start the development server with `npm run dev`.

### Provisioning an isolated database for another app

The database provisioner creates one `app_<name>` database and one matching
MySQL user, grants that user privileges only on its own database, generates a
random password, and writes the app's connection settings to a private file
under `~/.aio-app-databases/`. It refuses to reuse existing database names or
overwrite saved credentials.

1. Copy [`database-gateway/provisioner.env.example`](./database-gateway/provisioner.env.example)
   to `.env.provisioner` in the repository root. Enter a dedicated database
   administrator account with `CREATE DATABASE`, `CREATE USER`, and `GRANT
   OPTION` privileges. Configure `DB_PROVISIONER_SSL_CA` with the trusted CA
   certificate for MySQL and `DB_PROVISIONER_APP_HOST` as the private
   address or subnet used by the app's database gateway; never use the
   unrestricted `%` host.
2. Run `npm run db:provision -- --app <name>` (for example,
   `npm run db:provision -- --app customer-portal`). The name must be 1-16
   lowercase letters, digits, or hyphens and start with a letter. Use
   `--dry-run` to check the proposed database, user, and output path without
   connecting to MySQL.
3. Configure the generated `DB_*` values in the new app's private gateway
   service and hosting environment. The provisioner saves the verified MySQL
   CA as `DB_SSL_CA`. The provisioner does not publish MySQL or
   automatically change Cloudflare/Vercel settings; keep using the HTTPS
   gateway rather than exposing MySQL to the internet.

The generated credential file is private to the current Windows account (or
owner account on Unix-like systems). Keep `.env.provisioner` private and out of
source control. The provisioner requires a trusted CA and writes it to the
generated `DB_SSL_CA` setting so the new app can validate the database server.

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
and Cloudflare Tunnel encrypts traffic to the MySQL host. Set `DB_SSL_CA` to the
trusted CA certificate for the MySQL server (use `\n` for embedded newlines).
The gateway and direct database connections refuse to start without that CA
and always validate the server certificate. Do not disable certificate
validation to work around a TLS error; install the correct CA certificate
instead.

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

For editable About page content, the runtime database identity also needs
`SELECT` and `UPDATE` on `website_page_content`. Apply its migration using a
database administrator; the app account should not receive schema-change
privileges.

The public header does not expose a staff login button. A small footer dot is
kept as a discreet sign-in shortcut. Hiding a login link is not an access
control: staff APIs and admin pages must continue to enforce authenticated
sessions and roles. For an additional security layer, put staff routes behind
Cloudflare Access (or host a separate staff subdomain with the same identity
and authorization checks); a separate URL alone does not secure the app.

### Announcements, chat, and former Firebase data

Published announcements and visitor chat use MySQL. Anonymous chat sessions
are owned by random visitor tokens; MySQL stores only their SHA-256 hashes.
The public site displays a floating “Chat with us” launcher on visitor pages;
visitors can send questions without signing in, and staff can answer and manage
those conversations at `/admin/chat`. Chat sessions are created when a visitor
opens the widget. Each staff member can accept up to five waiting chats at
once; the next visitor is accepted in queue order when a slot is available.
Closing a resolved chat sends a courteous sign-off and frees that slot
immediately. Accepted chats include a personalized staff welcome, while
visitors see their place in the waiting queue. Apply
[`database/migrations/004-live-chat-capacity.sql`](./database/migrations/004-live-chat-capacity.sql)
to existing databases. Staff chat and lead APIs require a valid MySQL session
and a `staff`, `admin`, or `super_admin` MySQL role.

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
