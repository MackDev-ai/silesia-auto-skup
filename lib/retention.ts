export function retentionCutoff(now: Date, retentionDays: number) {
  if (!Number.isSafeInteger(retentionDays) || retentionDays < 1) {
    throw new Error('Retencja musi wynosić co najmniej jeden dzień.');
  }
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}
