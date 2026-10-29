// Run with: node scripts/test-metal-font-access.mjs
// Exercise the real eligibility query in an isolated in-memory database and
// the real API handlers with fake authentication, credits and image generation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const client = createClient({ url: ':memory:' });
const database = drizzle(client);
const order = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  status: text('status'),
  paymentAmount: integer('payment_amount'),
  deletedAt: integer('deleted_at'),
});

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
      console,
      Buffer,
      Request,
      Response,
      URL,
      setTimeout,
      process,
      fetch: () => {
        throw new Error('Tests must never call a remote API');
      },
    },
    { filename }
  );
  return module.exports;
}

try {
  await client.execute(
    'CREATE TABLE orders (id TEXT PRIMARY KEY, user_id TEXT, status TEXT, payment_amount INTEGER, deleted_at INTEGER)'
  );
  const fixtures = [
    { userId: 'pending', status: 'created', paymentAmount: 499 },
    { userId: 'failed', status: 'failed', paymentAmount: 499 },
    { userId: 'canceled', status: 'canceled', paymentAmount: 499 },
    { userId: 'free', status: 'paid', paymentAmount: 0 },
    { userId: 'unconfirmed', status: 'paid', paymentAmount: null },
    { userId: 'deleted', status: 'paid', paymentAmount: 499, deletedAt: 1 },
    { userId: 'paid', status: 'paid', paymentAmount: 499 },
  ];
  await database.insert(order).values(
    fixtures.map((fixture) => ({
      id: fixture.userId,
      ...fixture,
    }))
  );

  const service = loadSource('../src/modules/metal-font/service.ts', {
    '@/core/db': { db: () => database },
    '@/config/db/schema': { order, aiTask: {} },
    '@/modules/config/service': { getAllConfigs: async () => ({}) },
    '@/modules/storage/service': { getStorage: async () => null },
    '@/lib/hash': { getUuid: () => 'test-id' },
  });
  const responseHelpers = loadSource('../src/lib/resp.ts', {});
  const state = {
    user: null,
    balance: 1000,
    consumes: 0,
    generated: 0,
    configChecks: 0,
    refunds: 0,
    revokes: 0,
  };
  const route = loadSource('../src/routes/api/metal-font.ts', {
    '@tanstack/react-router': { createFileRoute: () => (options) => options },
    '@/core/auth': {
      getAuth: () => ({
        api: {
          getSession: async () => (state.user ? { user: state.user } : null),
        },
      }),
    },
    '@/modules/credits/service': {
      getBalance: async () => state.balance,
      consume: async ({ credits }) => {
        state.consumes++;
        if (state.balance < credits) return { success: false };
        state.balance -= credits;
        return { success: true, consumedCredit: { id: 'reservation' } };
      },
      grant: async ({ credits }) => {
        state.balance += credits;
        state.refunds += credits;
      },
      revoke: async () => {
        state.revokes++;
      },
    },
    '@/modules/metal-font/service': {
      ...service,
      isMetalFontConfigured: async () => {
        state.configChecks++;
        return true;
      },
      generateMetalFont: async () => {
        state.generated++;
        return {
          imageUrl: '/test.png',
          model: service.METAL_FONT_MODEL,
          provider: 'evolink',
          upstreamCredits: 3,
        };
      },
      saveMetalFontHistory: async () => ({ id: 'history' }),
    },
    '@/lib/rate-limit': { enforceMinIntervalRateLimit: () => null },
    '@/lib/resp': responseHelpers,
  }).Route;
  const post = () =>
    route.server.handlers.POST({
      request: new Request('http://localhost/api/metal-font', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'FORGE',
          finish: 'steel',
          angle: 22,
          extrusion: 14,
          light: 72,
          tracking: 0,
        }),
      }),
    });

  assert.equal((await post()).status, 401);
  for (const userId of [
    'new-with-gift',
    'pending',
    'failed',
    'canceled',
    'free',
    'unconfirmed',
    'deleted',
  ]) {
    state.user = { id: userId, email: 'test@example.com' };
    assert.equal(await service.hasPaidMetalFontOrder(userId), false, userId);
    const response = await post();
    assert.equal(response.status, 402, userId);
    assert.equal((await response.json()).data.reason, 'payment_required');
  }
  assert.equal(
    state.configChecks,
    0,
    'Unpaid users must be rejected before provider access'
  );
  assert.equal(state.consumes, 0, 'Unpaid users must not lose gift credits');
  assert.equal(
    state.generated,
    0,
    'Unpaid users must never start a generation'
  );

  state.user = { id: 'paid', email: 'paid@example.com' };
  assert.equal(await service.hasPaidMetalFontOrder('paid'), true);
  const accessResponse = await route.server.handlers.GET({
    request: new Request('http://localhost/api/metal-font'),
  });
  assert.equal((await accessResponse.json()).data.hasPaidOrder, true);
  assert.match(accessResponse.headers.get('Cache-Control'), /no-store/);
  state.balance = 24;
  assert.equal((await (await post()).json()).code, -1);
  assert.equal(state.generated, 0, 'Paid users still need sufficient credits');

  state.balance = 25;
  const result = await (await post()).json();
  assert.equal(result.code, 0);
  assert.equal(state.generated, 1);
  assert.equal(result.data.chargedCredits, 24);
  assert.equal(state.refunds, 1, 'Only the unused reservation is refunded');
  assert.equal(state.balance, 1);
  assert.equal(
    state.revokes,
    0,
    'A partial refund must not restore the entire reservation'
  );
  console.log(
    'PASS: unpaid/gift/pending/failed/zero/deleted orders blocked; paid balance and credit settlement verified.'
  );
} finally {
  client.close();
}
