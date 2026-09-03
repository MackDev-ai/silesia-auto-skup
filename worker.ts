import nextHandler from 'vinext/server/fetch-handler';

import { applicationSecurityHeaders } from './security-headers';

type WorkerContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

export default {
  async fetch(
    request: Request,
    env: Record<string, unknown>,
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
};
