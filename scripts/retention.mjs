import process from 'node:process';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('Ustaw DATABASE_URL przed uruchomieniem retencji.');

const retentionDays = Number.parseInt(process.env.DATA_RETENTION_DAYS ?? '30', 10);
if (!Number.isSafeInteger(retentionDays) || retentionDays < 1) {
  throw new Error('DATA_RETENTION_DAYS musi być dodatnią liczbą całkowitą.');
}

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: process.env.DATABASE_SSL === 'false' ? false : 'require',
});

try {
  const result = await sql.begin(async (tx) => {
    const deletedVisits = await tx`
      DELETE FROM visits
      WHERE created_at < now() - (${retentionDays} * interval '1 day')
      RETURNING id
    `;
    const expiredBlocks = await tx`
      UPDATE ip_blocks
      SET active = false, updated_at = now()
      WHERE active = true AND indefinite = false AND expires_at <= now()
      RETURNING id
    `;
    await tx`
      DELETE FROM admin_audit_log
      WHERE created_at < now() - interval '365 days'
    `;
    return { deletedVisits: deletedVisits.length, expiredBlocks: expiredBlocks.length };
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} finally {
  await sql.end();
}
