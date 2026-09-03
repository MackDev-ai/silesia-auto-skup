import nextHandler from 'vinext/server/fetch-handler';

import { applicationSecurityHeaders } from './security-headers';

type WorkerContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

type WorkerEnvironment = Record<string, unknown> & {
  CRON_SECRET?: unknown;
};

const worker = {
  async fetch(
    request: Request,
    env: WorkerEnvironment,
    ctx: WorkerContext,
  ) {
    const response = await nextHandler.fetch(request, env, ctx);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(applicationSecurityHeaders)) {
      headers.set(name, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
  async scheduled(
    _controller: unknown,
    env: WorkerEnvironment,
    ctx: WorkerContext,
  ) {
    if (typeof env.CRON_SECRET !== 'string' || !env.CRON_SECRET) {
      throw new Error('CRON_SECRET is not configured.');
    }

    const response = await nextHandler.fetch(
      new Request('https://internal.silesia-auto-skup/api/cron/retention', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.CRON_SECRET}` },
      }),
      env,
      ctx,
    );
    await response.body?.cancel();
    if (!response.ok) {
      throw new Error(`Retention task failed with HTTP ${response.status}.`);
    }
  },
};

export default worker;
