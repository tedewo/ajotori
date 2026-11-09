import { createCleanupWorker } from './worker.mjs';

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

Deno.serve(createCleanupWorker({
  get(name) {
    return Deno.env.get(name);
  },
  fetch: (input, init) => fetch(input, init),
}));
