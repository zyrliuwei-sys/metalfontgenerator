# Neon → Cloudflare D1 migration

Prepared on 2026-10-30 (Asia/Shanghai). Data import and verification are complete;
the production Worker has **not yet been switched** to D1.

## Source and destination

- Source: the project's Neon database configured in the original local environment,
  host `ep-old-meadow-b5tl9fm4-pooler.c-7.us-east-2.aws.neon.tech`.
- Destination: `metalfontgenerator-production`.
- D1 database ID: `2d9b03ce-ee7d-4384-8581-7b23b13c8b04`.
- Worker: `metalfontgeneratorai`, domain `https://metalfontgenerator.org`.
- The previous `redocor` Hyperdrive binding is removed from the prepared config.
  The shared Hyperdrive resource itself was not modified or deleted.

## Migrated records

All 23 application tables were created. The tables containing data are:

| Table           | Records |
| --------------- | ------: |
| user            |       1 |
| account         |       1 |
| permission      |      29 |
| role            |       4 |
| role_permission |      34 |
| session         |       5 |
| user_role       |       1 |
| **Total**       |  **75** |

The other 16 tables are empty, including orders, subscriptions, credits, and
application settings. Password hashes, user IDs, permission relationships, and
session tokens were copied without alteration. PostgreSQL timestamps were
converted according to each SQLite column's seconds or milliseconds mode;
booleans were converted to SQLite integers.

## Validation

- Consistent, read-only Neon snapshot; the source database was not changed.
- Local SQLite import: all tables match the converted source data.
- Remote D1: full-content SHA-256 comparison passed for all 23 tables.
- `PRAGMA foreign_key_check`: zero errors. One super-admin relationship exists.
- `DATABASE_PROVIDER=d1 pnpm build`: passed.
- Cloudflare production build: passed; generated config has binding `DB` and
  `DATABASE_PROVIDER=d1`, with no Hyperdrive binding.
- Isolated local D1 Worker: health, invalid login (401), test registration,
  password login (200), session lookup, and authenticated `/api/user/info` passed.
  Test accounts were created only in the isolated local D1 database.
- Local workerd supports compatibility dates through 2026-06-10, so only the
  local preview used that date. The production config remains 2026-09-24.
- TypeScript reports existing React key errors in marketing blocks
  (`audiences`, `changes-keeps`, `features`, `free-tier`, `how-it-works`).
  The migration script and changed configuration have no type errors.

## Files and private backup

- Reviewed, additive schema migration: `migrations/d1/0000_neon_to_d1.sql`.
- Drizzle metadata: `migrations/d1/meta/`.
- Export and verification utility: `scripts/migrate-neon-to-d1.ts`.
- Private backup directory: `data/neon-to-d1-20261030/` (gitignored, mode 0700).
  It contains the original Neon data, converted D1 data, import SQL, checksum
  report, and copies of the previous environment and Wrangler configuration.
  These files contain credentials or account data and must remain private.
- Local development now uses `data/d1-development.sqlite`, populated from the
  same snapshot. The original Neon environment is retained in the private backup.
- The CI deployment workflow now selects D1, preventing a later build from
  replacing the SQLite schema with the PostgreSQL template.

To repeat the read-only remote comparison before cutover:

```sh
node --import tsx scripts/migrate-neon-to-d1.ts \
  --output data/neon-to-d1-20261030 \
  --verify-remote metalfontgenerator-production
```

The export/import is intended for a new empty database; it never overwrites or
silently skips existing rows. The remote comparison checks against the export
snapshot and should run before the new database begins receiving live writes.

## Remaining cutover

After approval, run `pnpm run cf:deploy` to replace the current Worker with the
prepared D1 configuration, then check the homepage, auth endpoints, and admin
access. Existing passwords remain valid. The previous Neon database is retained.
