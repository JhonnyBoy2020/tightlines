import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile, rename, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { deployment } from "./deployment-context.generated.js";
const locks = new Map();
async function locked(key, operation) {
  const previous = locks.get(key) || Promise.resolve();
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  const tail = previous.then(() => hold);
  locks.set(key, tail);
  await previous;
  try { return await operation(); }
  finally { release(); if (locks.get(key) === tail) locks.delete(key); }
}

// Netlify uses managed durable Blobs. The sandbox preview uses disk, not a pretend cloud.
// Separate namespaces prevent preview records/subscriptions touching production.
export function store() {
  if (!process.env.TL_PREVIEW_DATA) return getStore({ name: deployment.production ? "tightlines-production-v3" : "tightlines-preview-v3", consistency: "strong" });
  const root = path.resolve(process.env.TL_PREVIEW_DATA);
  const file = key => path.join(root, Buffer.from(key).toString("base64url") + ".json");
  const get = async key => { try { return JSON.parse(await readFile(file(key), "utf8")); } catch (e) { if (e.code === "ENOENT") return null; throw e; } };
  return {
    async get(key) { return (await get(key))?.data ?? null; },
    async getWithMetadata(key) { return get(key); },
    async setJSON(key, data, options = {}) {
      return locked(file(key), async () => {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const old = await get(key);
      if (options.onlyIfNew && old || options.onlyIfMatch && old?.etag !== options.onlyIfMatch) return { modified: false };
      const etag = createHash("sha256").update(JSON.stringify(data) + randomUUID()).digest("hex");
      const temp = file(key) + "." + randomUUID();
      await writeFile(temp, JSON.stringify({ data, etag }), { mode: 0o600 });
      await rename(temp, file(key));
      return { modified: true, etag };
      });
    },
    async delete(key) { await unlink(file(key)).catch(e => { if (e.code !== "ENOENT") throw e; }); },
    async list({ prefix = "" } = {}) {
      await mkdir(root, { recursive: true, mode: 0o700 });
      return { blobs: (await readdir(root)).filter(f => f.endsWith(".json")).map(f => ({ key: Buffer.from(f.slice(0, -5), "base64url").toString() })).filter(f => f.key.startsWith(prefix)) };
    },
  };
}
