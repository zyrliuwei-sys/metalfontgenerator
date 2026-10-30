// Exercise the real service and API handlers with SQLite and mocked engines.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const { sqliteTable, text } = require('drizzle-orm/sqlite-core');
const client = createClient({ url: ':memory:' });
const database = drizzle(client);
const config = sqliteTable('config', {
  name: text('name').unique().notNull(),
  value: text('value'),
});
const requests = [];
let responses = [];

function loadSource(relativePath, mocks) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  });
  const module = { exports: {} };
  runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      require: (name) => {
        if (name in mocks) return mocks[name];
        if (name.startsWith('@/')) throw new Error(`Unmocked import: ${name}`);
        return require(name);
      },
      console: { warn() {} },
      Request,
      Response,
      URL,
      AbortSignal,
      Error,
      crypto: globalThis.crypto,
      btoa,
      atob,
      TextEncoder,
      TextDecoder,
      process: {
        env: { CONFIG_ENCRYPTION_KEY: 'indexnow-test-only-encryption' },
      },
      fetch: async (endpoint, options) => {
        requests.push({ endpoint, ...JSON.parse(options.body) });
        assert.ok(options.signal, 'engine requests must have a timeout');
        assert.ok(responses.length, 'unexpected remote request');
        const next = responses.shift();
        if (next instanceof Error) throw next;
        return new Response('', { status: next });
      },
    },
    { filename }
  );
  return module.exports;
}

const resetEngines = (...statuses) => {
  requests.length = 0;
  responses = statuses;
};

try {
  await client.execute(
    'CREATE TABLE config (name TEXT UNIQUE NOT NULL, value TEXT)'
  );
  const crypto = loadSource('../src/lib/crypto.ts', {});
  const mocks = {
    '@/core/db': { db: () => database },
    '@/config': { envConfigs: { app_url: 'https://indexnow.example' } },
    '@/config/db/schema': { config },
    '@/lib/crypto': crypto,
  };
  const service = loadSource('../src/modules/indexnow/service.ts', mocks);
  const legacyKey = await service.getIndexNowKey();
  assert.ok(service.isValidIndexNowKey(legacyKey));
  await service.saveIndexNowKey('  replacement-key-1234  ');
  assert.equal(await service.getIndexNowKey(), 'replacement-key-1234');
  const [stored] = await database.select().from(config);
  assert.ok(stored.value.startsWith('enc:v1:'));
  assert.notEqual(stored.value, 'replacement-key-1234');
  await assert.rejects(service.saveIndexNowKey('../invalid'));
  assert.equal(await service.getIndexNowKey(), 'replacement-key-1234');

  const state = { authenticated: false, allowed: true };
  const routeMocks = {
    '@tanstack/react-router': { createFileRoute: () => (options) => options },
    '@/modules/indexnow/service': service,
    '@/lib/resp': loadSource('../src/lib/resp.ts', {}),
    '@/core/auth': {
      getAuth: () => ({
        api: {
          getSession: async () =>
            state.authenticated ? { user: { id: 'admin' } } : null,
        },
      }),
    },
    '@/modules/rbac/service': { hasPermission: async () => state.allowed },
  };
  const handlers = loadSource('../src/routes/api/admin/indexnow.ts', routeMocks)
    .Route.server.handlers;
  const call = (method, body, origin = 'https://indexnow.example') =>
    handlers[method]({
      request: new Request('https://indexnow.example/api/admin/indexnow', {
        method,
        headers: { 'content-type': 'application/json', origin },
        ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
      }),
    });
  for (const method of ['GET', 'PUT', 'POST'])
    assert.equal((await call(method, {})).status, 401);
  state.authenticated = true;
  state.allowed = false;
  for (const method of ['GET', 'PUT', 'POST'])
    assert.equal((await call(method, {})).status, 403);
  state.allowed = true;
  assert.equal((await call('PUT', { key: 'invalid' })).status, 400);
  assert.equal((await call('POST', { urls: [7] })).status, 400);
  assert.equal(
    (await call('PUT', { key: 'changed-key-1234' }, 'https://foreign.example'))
      .status,
    403
  );
  assert.equal(requests.length, 0);
  const saved = await call('PUT', { key: 'changed-key-1234' });
  assert.equal(saved.headers.get('cache-control'), 'no-store');
  assert.equal((await saved.json()).data.key, 'changed-key-1234');

  const keyRoute = loadSource('../src/routes/{$key}[.]txt.ts', routeMocks).Route
    .server.handlers;
  const getFile = (key) =>
    keyRoute.GET({
      params: { key: undefined },
      request: new Request(`https://indexnow.example/${key}.txt`),
    });
  assert.equal(
    await (await getFile('changed-key-1234')).text(),
    'changed-key-1234'
  );
  assert.equal((await getFile(legacyKey)).status, 404);
  assert.equal((await getFile('unknown-key')).status, 404);
  assert.equal(
    (await getFile('changed-key-1234')).headers.get('cache-control'),
    'no-store'
  );

  resetEngines(429, 503, 202);
  const result = await call('POST', {
    urls: ['https://indexnow.example/a', 'https://indexnow.example/a#anchor'],
  });
  const data = (await result.json()).data;
  assert.equal(data.requested, 1);
  assert.equal(data.submitted, 1);
  assert.equal(data.results[0].attempts.length, 3);
  assert.equal(
    requests[0].keyLocation,
    'https://indexnow.example/changed-key-1234.txt'
  );

  resetEngines(403);
  const rejected = await service.submitUrls('changed-key-1234', [
    'https://indexnow.example/a',
  ]);
  assert.equal(rejected[0].ok, false);
  assert.equal(requests.length, 1, 'invalid keys must stop fallback');
  resetEngines(new Error('network unavailable'), 200);
  assert.equal(
    (
      await service.submitUrls('changed-key-1234', [
        'https://indexnow.example/a',
      ])
    )[0].ok,
    true
  );
  assert.equal(requests.length, 2);
  resetEngines(500, 500, 500);
  const failed = (
    await (await call('POST', { urls: ['https://indexnow.example/a'] })).json()
  ).data;
  assert.equal(failed.requested, 1);
  assert.equal(failed.submitted, 0);

  resetEngines(200, 202);
  const batches = await service.submitUrls(
    'changed-key-1234',
    Array.from({ length: 10_001 }, (_, i) => `https://indexnow.example/${i}`)
  );
  assert.equal(batches.length, 2);
  assert.equal(requests[0].urlList.length, 10_000);
  assert.equal(requests[1].urlList.length, 1);
  resetEngines();
  for (const url of [
    'https://foreign.example/a',
    'ftp://indexnow.example/a',
    'https://user:pass@indexnow.example/a',
    'invalid',
  ]) {
    await assert.rejects(service.submitUrls('changed-key-1234', [url]));
  }
  await assert.rejects(service.submitUrls('changed-key-1234', []));
  assert.equal(requests.length, 0);

  await database
    .insert(config)
    .values({ name: 'indexnow_auto_submit', value: '0' });
  await service.notifyIndexNow('http://localhost:3000/admin/posts', [
    'http://localhost:3000/blog/test',
  ]);
  assert.equal(requests.length, 0);
  await client.execute(
    "UPDATE config SET value='1' WHERE name='indexnow_auto_submit'"
  );
  resetEngines(200);
  await service.notifyIndexNow('http://localhost:3000/admin/posts', [
    'http://localhost:3000/blog/test',
  ]);
  assert.equal(requests[0].urlList[0], 'https://indexnow.example/blog/test');
  resetEngines(500, 500, 500);
  await assert.doesNotReject(
    service.notifyIndexNow('http://localhost:3000/admin/posts', [
      'http://localhost:3000/blog/test',
    ])
  );
  const unavailable = loadSource('../src/modules/indexnow/service.ts', {
    ...mocks,
    '@/core/db': {
      db: () => {
        throw new Error('DB offline');
      },
    },
  });
  await assert.doesNotReject(
    unavailable.notifyIndexNow('http://localhost:3000', [])
  );
  console.log(
    'IndexNow checks passed: encrypted key replacement, public key file, auth/RBAC/CSRF, validation, fallback, batching, accurate counts, and article notifications.'
  );
} finally {
  client.close();
}
