import { getStore } from '@netlify/blobs';

export function createViewsHandler(openStore) {
  return async (request) => {
    const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405);
    if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Invalid origin' }, 403);
    let id;
    if (request.method === 'POST') {
      try { ({ id } = await request.json()); } catch { return reply({ error: 'Invalid JSON' }, 400); }
      if (typeof id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) return reply({ error: 'Invalid visit ID' }, 400);
    }
    try {
      const store = openStore();
      // One unique key per tab session: retries and reloads cannot inflate the total.
      // Separate keys also prevent concurrent visitors from overwriting one another.
      if (id) await store.set(`visits/${id}`, '1');
      const { blobs } = await store.list({ prefix: 'visits/' });
      return reply({ views: blobs.length });
    } catch { return reply({ error: 'Counter temporarily unavailable' }, 503); }
  };
}
export default createViewsHandler(() => getStore({ name: 'silent-voice-views', consistency: 'strong' }));
