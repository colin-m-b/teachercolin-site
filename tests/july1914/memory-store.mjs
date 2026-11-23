// In-memory stand-in for a Netlify Blobs store, with the same conditional-write behaviour
// (onlyIfNew / onlyIfMatch) and a log of every read and write so tests can check the storage rules.
export function memoryStore({ latencyMs = 0 } = {}) {
  const m = new Map();
  let n = 0;
  const ops = [];
  const wait = () => (latencyMs ? new Promise(r => setTimeout(r, latencyMs)) : null);
  return {
    ops, map: m,
    async getJSON(key) {
      ops.push(['get', key]); await wait();
      const v = m.get(key);
      return v ? { data: JSON.parse(v.body), etag: v.etag } : null;
    },
    async setJSON(key, value, opts = {}) {
      ops.push(['set', key]); await wait();
      const cur = m.get(key);
      if (opts.onlyIfNew && cur) return { modified: false };
      if (opts.onlyIfMatch && (!cur || cur.etag !== opts.onlyIfMatch)) return { modified: false };
      const etag = `"${++n}"`;
      m.set(key, { body: JSON.stringify(value), etag });
      return { modified: true, etag };
    },
  };
}
