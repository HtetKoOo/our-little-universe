import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import manifest from "../src/app/manifest";
import { pwaWorker } from "../src/lib/pwa-worker";
function worker(version = "test") {
  const handlers: Record<string, (event: Record<string, unknown>) => void> = {};
  const entries = new Map<string, Response>();
  const fetched: Array<{ url: string; options?: RequestInit }> = [];
  const deleted: string[] = [];
  let fail = false;
  let skipCount = 0;
  const cache = { put: async (path: string, response: Response) => { entries.set(path, response); }, match: async (path: string) => entries.get(path)?.clone() };
  vm.runInNewContext(pwaWorker(version), {
    URL, Response,
    self: { location: { origin: "https://app.test" }, addEventListener: (type: string, handler: typeof handlers[string]) => { handlers[type] = handler; }, clients: { claim: async () => {} }, skipWaiting: () => { skipCount++; } },
    caches: { open: async () => cache, keys: async () => ["olu-offline-old", `olu-offline-${version}`, "another-app"], delete: async (key: string) => { deleted.push(key); } },
    fetch: async (request: Request | string, options?: RequestInit) => {
      const url = typeof request === "string" ? request : request.url;
      fetched.push({ url, options });
      if (fail) throw new TypeError("offline");
      return new Response(url === "/offline.html" ? "public offline page" : "network response");
    },
  });
  return { handlers, entries, fetched, deleted, setOffline: () => { fail = true; }, skipped: () => skipCount };
}
async function lifecycle(handler: (event: Record<string, unknown>) => void) {
  let work: Promise<unknown> | undefined;
  handler({ waitUntil: (promise: Promise<unknown>) => { work = promise; } });
  await work;
}
async function request(w: ReturnType<typeof worker>, path: string, mode = "navigate", method = "GET") {
  let response: Promise<Response> | undefined;
  w.handlers.fetch({ request: { url: path, mode, method }, respondWith: (promise: Promise<Response>) => { response = promise; } });
  return response;
}
test("PWA manifest uses standalone private entry point and both normal and maskable icons", () => {
  const data = manifest();
  assert.equal(data.start_url, "/space");
  assert.equal(data.display, "standalone");
  assert.equal(data.scope, "/");
  assert.ok(data.icons?.some(icon => icon.sizes === "192x192"));
  assert.ok(data.icons?.some(icon => icon.sizes === "512x512" && icon.purpose === "maskable"));
});
test("worker caches only the public offline shell, without account credentials", async () => {
  const w = worker(); await lifecycle(w.handlers.install);
  assert.deepEqual([...w.entries.keys()], ["/offline.html", "/pwa/offline.css", "/pwa/offline.js"]);
  assert.ok(w.fetched.every(item => item.options?.credentials === "omit"));
  assert.equal(w.skipped(), 0);
  await lifecycle(w.handlers.activate);
  assert.deepEqual(w.deleted, ["olu-offline-old"]);
});
test("private navigations stay network-only and fall back to public offline HTML", async () => {
  const w = worker(); await lifecycle(w.handlers.install);
  const online = await request(w, "https://app.test/space/memories/secret");
  assert.equal(await online?.text(), "network response");
  assert.equal(w.entries.size, 3);
  w.setOffline();
  const offline = await request(w, "https://app.test/space/memories/secret");
  assert.equal(await offline?.text(), "public offline page");
  assert.equal(w.entries.size, 3);
});
test("APIs, photos, mutations, RSC and other origins are never intercepted or cached", async () => {
  const w = worker();
  assert.equal(await request(w, "https://app.test/api/media/private"), undefined);
  assert.equal(await request(w, "https://app.test/api/auth/session"), undefined);
  assert.equal(await request(w, "https://app.test/space", "cors", "POST"), undefined);
  assert.equal(await request(w, "https://app.test/space?_rsc=example", "cors"), undefined);
  assert.equal(await request(w, "https://cloudinary.test/photo.jpg", "no-cors"), undefined);
  assert.equal(w.fetched.length, 0); assert.equal(w.entries.size, 0);
});
test("worker update activation requires an explicit message and versions change the script", () => {
  const w = worker(); w.handlers.message({ data: { type: "UNRELATED" } }); assert.equal(w.skipped(), 0);
  w.handlers.message({ data: { type: "SKIP_WAITING" } }); assert.equal(w.skipped(), 1);
  assert.notEqual(pwaWorker("release-1"), pwaWorker("release-2"));
});
