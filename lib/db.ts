import postgres from 'postgres';

import { infrastructureConfig, requireEnvironment } from '@/lib/config';

let client: ReturnType<typeof postgres> | undefined;

function createClient() {
  const databaseUrl = requireEnvironment('DATABASE_URL');
  const cloudflare = infrastructureConfig.provider === 'cloudflare';
  return postgres(databaseUrl, {
    max: cloudflare
      ? 1
      : Number.parseInt(process.env.DATABASE_POOL_SIZE ?? '5', 10),
    connect_timeout: 5,
    idle_timeout: cloudflare ? 1 : 20,
    max_lifetime: cloudflare ? 2 : undefined,
    prepare: !cloudflare,
    ssl: infrastructureConfig.databaseSsl ? 'require' : false,
    transform: postgres.camel,
  });
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb() {
  // Cloudflare forbids reusing sockets created for an earlier request.
  if (infrastructureConfig.provider === 'cloudflare') return createClient();
  if (client) return client;
  client = createClient();
  return client;
}

export async function closeDb() {
  if (!client) return;
  await client.end({ timeout: 5 });
  client = undefined;
}
