import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@libsql/client';
import { getTableName, is } from 'drizzle-orm';
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core';
import postgres from 'postgres';

import * as schema from '../src/config/db/schema.sqlite';

type Value = string | number | null;
type TableSnapshot = {
  name: string;
  columns: string[];
  rows: Value[][];
  checksum: string;
};
type Snapshot = {
  exportedAt: string;
  sourceHost: string;
  tables: TableSnapshot[];
};

const args = process.argv.slice(2);
const option = (key: string) => {
  const index = args.indexOf(key);
  return index < 0 ? undefined : args[index + 1];
};
const directory = resolve(option('--output') || 'data/neon-to-d1');
const quoteName = (name: string) => `"${name.replaceAll('"', '""')}"`;
const checksum = (rows: Value[][]) =>
  createHash('sha256')
    .update(JSON.stringify(rows.map((row) => JSON.stringify(row)).sort()))
    .digest('hex');
const literal = (value: Value) => {
  if (value === null) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite numeric value');
    return String(value);
  }
  if (value.includes('\0')) {
    return `CAST(X'${Buffer.from(value).toString('hex')}' AS TEXT)`;
  }
  return `'${value.replaceAll("'", "''")}'`;
};
const verifyRows = (table: TableSnapshot, rows: Value[][]) => {
  if (rows.length !== table.rows.length || checksum(rows) !== table.checksum) {
    throw new Error(`Data comparison failed for table ${table.name}`);
  }
};

async function verifyRemote(database: string) {
  const snapshot: Snapshot = JSON.parse(
    await readFile(resolve(directory, 'd1-data.json'), 'utf8')
  );
  const queries = snapshot.tables.map(
    (table) =>
      `SELECT ${table.columns.map(quoteName).join(',')} FROM ${quoteName(table.name)};`
  );
  queries.push('PRAGMA foreign_key_check;');
  queries.push(
    "SELECT COUNT(*) AS count FROM user_role ur JOIN role r ON r.id = ur.role_id WHERE r.name = 'super_admin';"
  );
  let output: string;
  try {
    output = execFileSync(
      'pnpm',
      [
        'exec',
        'wrangler',
        'd1',
        'execute',
        database,
        '--remote',
        '--json',
        '--command',
        queries.join('\n'),
      ],
      {
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
  } catch {
    // Wrangler's query output can contain credentials stored in the DB.
    // Never include child-process output in an error message.
    throw new Error('Remote D1 verification query failed; no data was printed');
  }
  const results = JSON.parse(output);
  if (
    results.length !== queries.length ||
    results.some((r: any) => !r.success)
  ) {
    throw new Error('Unexpected remote D1 query result');
  }
  for (const [index, table] of snapshot.tables.entries()) {
    const rows = results[index].results.map((row: Record<string, Value>) =>
      table.columns.map((column) => row[column])
    );
    verifyRows(table, rows);
  }
  if (results[snapshot.tables.length].results.length !== 0) {
    throw new Error('D1 foreign key validation failed');
  }
  const report = {
    verifiedAt: new Date().toISOString(),
    database,
    tables: snapshot.tables.map((table) => ({
      name: table.name,
      count: table.rows.length,
      checksum: table.checksum,
    })),
    totalRows: snapshot.tables.reduce(
      (total, table) => total + table.rows.length,
      0
    ),
    foreignKeyErrors: 0,
    superAdmins: results[snapshot.tables.length + 1].results[0].count,
  };
  await writeFile(
    resolve(directory, 'verification.json'),
    JSON.stringify(report, null, 2),
    { mode: 0o600 }
  );
  console.log(JSON.stringify(report));
}

async function exportSource() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !/^postgres(?:ql)?:/.test(databaseUrl)) {
    throw new Error('A Neon PostgreSQL DATABASE_URL is required');
  }
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const tables = new Map<string, ReturnType<typeof getTableConfig>>(
    Object.values(schema)
      .filter((value) => is(value, SQLiteTable))
      .map((table) => [getTableName(table), getTableConfig(table)])
  );
  const ordered: string[] = [];
  const visit = (name: string, visiting = new Set<string>()) => {
    if (ordered.includes(name)) return;
    if (visiting.has(name)) throw new Error(`Foreign key cycle at ${name}`);
    visiting.add(name);
    for (const fk of tables.get(name)!.foreignKeys) {
      const dependency = getTableName(fk.reference().foreignTable);
      if (dependency !== name) visit(dependency, visiting);
    }
    visiting.delete(name);
    ordered.push(name);
  };
  for (const name of tables.keys()) visit(name);

  const source = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 1,
  });
  const raw: Record<string, unknown[]> = {};
  const snapshot: Snapshot = {
    exportedAt: new Date().toISOString(),
    sourceHost: new URL(databaseUrl).hostname,
    tables: [],
  };
  try {
    await source.begin(
      'isolation level repeatable read read only',
      async (tx) => {
        const catalog =
          await tx`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`;
        const sourceNames = [
          ...new Set(catalog.map((column) => String(column.table_name))),
        ];
        if (
          sourceNames.length !== tables.size ||
          sourceNames.some((name) => !tables.has(name))
        ) {
          throw new Error(
            'Source and target table lists differ; review before migrating'
          );
        }
        for (const name of ordered) {
          const config = tables.get(name)!;
          const columns = config.columns.map((column) => column.name);
          const sourceColumns = catalog
            .filter((column) => column.table_name === name)
            .map((column) => String(column.column_name));
          if (
            sourceColumns.length !== columns.length ||
            sourceColumns.some((column) => !columns.includes(column))
          ) {
            throw new Error(`Column lists differ for ${name}`);
          }
          const rows = await tx`SELECT * FROM ${tx(name)}`;
          raw[name] = [...rows];
          const converted = rows.map((row) =>
            config.columns.map((column) => {
              const value = row[column.name];
              if (value === null) return null;
              const mapped = column.mapToDriverValue(value);
              if (typeof mapped !== 'string' && typeof mapped !== 'number') {
                throw new Error(`Unsupported value for ${name}.${column.name}`);
              }
              return mapped;
            })
          );
          snapshot.tables.push({
            name,
            columns,
            rows: converted,
            checksum: checksum(converted),
          });
        }
      }
    );
  } finally {
    await source.end({ timeout: 2 });
  }
  const statements = snapshot.tables.flatMap((table) =>
    table.rows.map(
      (row) =>
        `INSERT INTO ${quoteName(table.name)} (${table.columns.map(quoteName).join(',')}) VALUES (${row.map(literal).join(',')});`
    )
  );
  await writeFile(
    resolve(directory, 'neon-backup.json'),
    JSON.stringify({ exportedAt: snapshot.exportedAt, tables: raw }),
    { mode: 0o600 }
  );
  await writeFile(
    resolve(directory, 'd1-data.json'),
    JSON.stringify(snapshot),
    { mode: 0o600 }
  );
  await writeFile(
    resolve(directory, 'data.sql'),
    `${statements.join('\n')}\n`,
    { mode: 0o600 }
  );

  const migrationDir = resolve('migrations/d1');
  const files = (await readdir(migrationDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  if (!files.length) throw new Error('Generate the D1 schema migration first');
  const target = createClient({
    url: `file:${resolve(directory, 'staged.sqlite')}`,
  });
  try {
    const existing = await target.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    if (existing.rows.length)
      throw new Error(
        'Staging database already exists; use a new output directory'
      );
    await target.execute('PRAGMA foreign_keys = ON');
    for (const file of files)
      await target.executeMultiple(
        await readFile(resolve(migrationDir, file), 'utf8')
      );
    if (statements.length) await target.batch(statements, 'write');
    for (const table of snapshot.tables) {
      const rows = await target.execute(
        `SELECT ${table.columns.map(quoteName).join(',')} FROM ${quoteName(table.name)}`
      );
      verifyRows(
        table,
        rows.rows.map((row) =>
          table.columns.map((column) => row[column] as Value)
        )
      );
    }
    if ((await target.execute('PRAGMA foreign_key_check')).rows.length)
      throw new Error('Staging foreign key validation failed');
    console.log(
      JSON.stringify({
        exportedAt: snapshot.exportedAt,
        tables: snapshot.tables.map((table) => ({
          name: table.name,
          count: table.rows.length,
        })),
        totalRows: statements.length,
        localComparison: 'passed',
        foreignKeyErrors: 0,
        backupDirectory: directory,
      })
    );
  } finally {
    target.close();
  }
}

try {
  const database = option('--verify-remote');
  if (database) await verifyRemote(database);
  else await exportSource();
} catch (error) {
  // Do not print connection URLs, SQL payloads, password hashes, or sessions.
  console.error(
    error instanceof Error
      ? error.message.replace(
          /postgres(?:ql)?:\/\/\S+/g,
          '[redacted connection]'
        )
      : 'Migration failed'
  );
  process.exitCode = 1;
}
