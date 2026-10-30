# IndexNow feature

Installed from the local `indexnow-installer` bundle and adapted to this
project's API client, independent modules, encryption, and article hooks.
It uses the existing `config` table, so no schema migration is required.

At `/admin/indexnow`, paste and save a key, check its verification file, then
submit the sitemap or a list of URLs. Sitemap XML and the key file are read
in the browser through `apiGetText`, avoiding Worker self-fetches. Nested
sitemap indexes are supported, with cycle detection and same-origin reads.

Submissions use the configured `VITE_APP_URL` host, deduplicate HTTP(S)
URLs, and split them into batches of 10,000. Each batch tries IndexNow,
Bing, then Yandex until one accepts it. Invalid requests and keys stop
retries. Results show each attempt and count only accepted URLs as submitted.

The new key is stored under `indexnow_key`, encrypted when
`CONFIG_ENCRYPTION_KEY` is configured. Reads bypass the general settings
cache so saves take effect immediately. Until a new key is saved, the
previous deployment's public verification key remains available. Unlike
the previous implementation, a saved key takes precedence over that fallback.

Existing article notifications use the new submission service and still
respect the legacy `indexnow_enabled` / `indexnow_auto_submit` opt-outs.
Article publishing succeeds even if configuration or IndexNow is unavailable.

Regression checks (no remote API requests): `node scripts/test-indexnow.mjs`.

## Copy to another ShipAny project

Copy these paths:

- `src/features/indexnow/`
- `src/modules/indexnow/service.ts`
- `src/routes/admin/indexnow.tsx`
- `src/routes/api/admin/indexnow.ts`
- `src/routes/{$key}[.]txt.ts`

Then copy the `admin.nav.indexnow` and `admin.indexnow.*` messages from both
locale files, add the `/admin/indexnow` item to `src/routes/admin/route.tsx`,
and add the `notifyIndexNow` calls from `src/routes/api/admin/posts.ts` if the
target project has the posts module.

Remove the deployment-specific `LEGACY_PUBLIC_KEY` fallback before copying
this module to a different website.
