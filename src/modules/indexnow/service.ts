/**
 * IndexNow — push changed URLs to Bing, Yandex, Naver, Seznam, … in one call.
 *
 * The key lives in the DB config table (`indexnow_key`, set at /admin/indexnow)
 * and is served at `/{key}.txt` (src/routes/{$key}[.]txt.ts) so search
 * engines can verify the site owns it.
 * Spec: https://www.indexnow.org/documentation
 *
 * Key-file checks and sitemap reads run in the admin's browser, avoiding
 * requests from a Worker back to its own custom domain.
 */

import { eq, inArray } from 'drizzle-orm';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { config } from '@/config/db/schema';
import { decryptSecret, encryptSecret } from '@/lib/crypto';

export const INDEXNOW_CONFIG_KEY = 'indexnow_key';
// Preserve this deployment's previous public verification file during upgrade.
// A key saved in the new page always takes precedence; it is no longer locked.
const LEGACY_PUBLIC_KEY = '4c7f4e7d194d46498fb7775716c95d68';
// Tried in order. Submissions are shared between engines, so one success is
// enough; the next is only tried on an error such as 429 (Workers egress IPs
// are shared and can be rate-limited by one endpoint but not another).
export const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];
const MAX_URLS_PER_POST = 10_000;

/** 8–128 chars of a-z, A-Z, 0-9 and dashes. */
export function isValidIndexNowKey(key: string) {
  return /^[a-zA-Z0-9-]{8,128}$/.test(key);
}

export async function getIndexNowKey() {
  const [row] = await db()
    .select({ value: config.value })
    .from(config)
    .where(eq(config.name, INDEXNOW_CONFIG_KEY))
    .limit(1);
  const key = row
    ? (await decryptSecret(row.value ?? ''))?.trim()
    : LEGACY_PUBLIC_KEY;
  return key && isValidIndexNowKey(key) ? key : null;
}

export async function saveIndexNowKey(key: string) {
  const normalized = key.trim();
  if (!isValidIndexNowKey(normalized)) {
    throw new Error('Key must be 8–128 characters: a-z, A-Z, 0-9 or -');
  }
  const value = await encryptSecret(normalized);
  const database = db();
  const [row] = await database
    .select({ name: config.name })
    .from(config)
    .where(eq(config.name, INDEXNOW_CONFIG_KEY))
    .limit(1);
  if (row) {
    await database
      .update(config)
      .set({ value })
      .where(eq(config.name, INDEXNOW_CONFIG_KEY));
  } else {
    await database.insert(config).values({ name: INDEXNOW_CONFIG_KEY, value });
  }
}

export function siteOrigin() {
  return new URL(envConfigs.app_url).origin;
}

export function keyFileUrl(key: string) {
  return `${siteOrigin()}/${key}.txt`;
}

const MEANINGS: Record<number, string> = {
  200: 'OK — URLs submitted',
  202: 'Accepted — key validation pending',
  400: 'Bad request — invalid format',
  403: 'Forbidden — key not valid (key file missing or wrong content)',
  422: "Unprocessable — URLs don't belong to this host or key doesn't match",
  429: 'Too many requests — slow down',
};

/**
 * Submit URLs (must be on this site's host). Splits into 10k batches.
 * Returns one result per batch with the engine's status code.
 */
export async function submitUrls(key: string, urls: string[]) {
  if (!isValidIndexNowKey(key)) throw new Error('Invalid IndexNow key');
  const origin = siteOrigin();
  const host = new URL(origin).host;
  const normalized = urls.map((value) => {
    try {
      const url = new URL(value.trim());
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.host !== host ||
        url.username ||
        url.password
      ) {
        throw new Error('Invalid host or protocol');
      }
      url.hash = '';
      return url.href;
    } catch {
      throw new Error(`URLs must be HTTP(S) URLs on ${host}`);
    }
  });
  const list = [...new Set(normalized)];
  if (!list.length) throw new Error('No URLs to submit');

  const results = [];
  for (let i = 0; i < list.length; i += MAX_URLS_PER_POST) {
    const batch = list.slice(i, i + MAX_URLS_PER_POST);
    const body = JSON.stringify({
      host,
      key,
      keyLocation: keyFileUrl(key),
      urlList: batch,
    });
    const attempts: { endpoint: string; status: number; meaning: string }[] =
      [];
    for (const endpoint of INDEXNOW_ENDPOINTS) {
      let status = 0;
      let meaning: string;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body,
          signal: AbortSignal.timeout(15_000),
        });
        status = res.status;
        meaning = MEANINGS[status] ?? (await res.text()).slice(0, 200);
      } catch (error) {
        meaning = error instanceof Error ? error.message : 'Network error';
      }
      attempts.push({ endpoint: new URL(endpoint).host, status, meaning });
      if (status === 200 || status === 202) break;
      // A bad request or key won't get better on another engine.
      if (status === 400 || status === 403 || status === 422) break;
    }
    const last = attempts[attempts.length - 1];
    results.push({
      ok: last.status === 200 || last.status === 202,
      count: batch.length,
      attempts,
    });
  }
  return results;
}

/** Keep the existing article notifications, including previously saved opt-outs. */
export async function notifyIndexNow(
  origin: string,
  urls: string[]
): Promise<void> {
  try {
    const rows: { name: string; value: string | null }[] = await db()
      .select({ name: config.name, value: config.value })
      .from(config)
      .where(
        inArray(config.name, ['indexnow_enabled', 'indexnow_auto_submit'])
      );
    if (rows.some((row) => row.value === '0')) return;
    const key = await getIndexNowKey();
    if (!key) return;
    const requestOrigin = new URL(origin).origin;
    const canonicalUrls = urls.map((value) => {
      const url = new URL(value);
      if (url.origin !== requestOrigin)
        throw new Error('Unexpected article host');
      return new URL(url.pathname + url.search, siteOrigin()).href;
    });
    const results = await submitUrls(key, canonicalUrls);
    const failed = results.find((result) => !result.ok);
    if (failed)
      throw new Error(failed.attempts.at(-1)?.meaning || 'Submit failed');
  } catch (error) {
    console.warn(
      '[indexnow] notification failed:',
      error instanceof Error ? error.message : 'Submit failed'
    );
  }
}
