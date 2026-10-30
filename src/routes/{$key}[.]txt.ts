import { createFileRoute } from '@tanstack/react-router';

import { getIndexNowKey } from '@/modules/indexnow/service';

// IndexNow key file: /{key}.txt must return exactly the key (UTF-8 text).
// Any other *.txt at the root 404s; static routes (robots.txt, ads.txt, …)
// take precedence over this dynamic one.
export const Route = createFileRoute('/{$key}.txt')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const key = await getIndexNowKey();
        const pathname = new URL(request.url).pathname;
        const requestedKey =
          pathname.endsWith('.txt') && !pathname.slice(1).includes('/')
            ? pathname.slice(1, -4)
            : params.key;
        if (!key || requestedKey !== key) {
          return new Response('Not found', {
            status: 404,
            headers: { 'Cache-Control': 'no-store' },
          });
        }
        return new Response(key, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
      },
    },
  },
});
