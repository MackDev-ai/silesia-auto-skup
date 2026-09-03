import postgres from 'postgres';

import { infrastructureConfig, requireEnvironment } from '@/lib/config';

let client: ReturnType<typeof postgres> | undefined;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb() {
  if (client) return client;
  const databaseUrl = requireEnvironment('DATABASE_URL');
  client = postgres(databaseUrl, {
    max: Number.parseInt(process.env.DATABASE_POOL_SIZE ?? '5', 10),
    connect_timeout: 5,
    idle_timeout: 20,
    prepare: true,
    ssl: infrastructureConfig.databaseSsl ? 'require' : false,
    transform: postgres.camel,
  });
  return client;
}

export async function closeDb() {
  if (!client) return;
  await client.end({ timeout: 5 });
  client = undefined;
}
