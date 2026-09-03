import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('Ustaw DATABASE_URL przed uruchomieniem migracji.');

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: process.env.DATABASE_SSL === 'false' ? false : 'require',
});

try {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const directory = path.join(process.cwd(), 'migrations');
  const files = (await readdir(directory))
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort();

  for (const file of files) {
    const [existing] = await sql`SELECT name FROM schema_migrations WHERE name = ${file}`;
    if (existing) continue;
    const migration = await readFile(path.join(directory, file), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    process.stdout.write(`Zastosowano migrację ${file}\n`);
  }
} finally {
  await sql.end();
}
