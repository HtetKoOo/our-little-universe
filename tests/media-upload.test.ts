import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { findDuplicatePhoto, uploadSharedPhoto, prepareDuplicatePhotoCheck, resolveDuplicatePhotoCheck } from "../src/lib/media-upload-client";

const asset = { id: "photo-id", format: "jpg", width: 1200, height: 800 };

test("a duplicate lookup hashes file bytes, ignores filename, and avoids uploading the file", async (context) => {
  const calls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push(url);
    assert.equal(url, "/api/media/check");
    assert.equal(JSON.parse(init.body as string).hash, createHash("sha256").update("same pixels").digest("hex"));
    return Response.json({ asset });
  });
  for (const name of ["first.jpg", "renamed.jpg"]) {
    const result = await uploadSharedPhoto(new File(["same pixels"], name, { type: "image/jpeg" }));
    assert.equal(result.duplicate, true);
    assert.deepEqual(result.asset, asset);
  }
  assert.deepEqual(calls, ["/api/media/check", "/api/media/check"]);
});

test("a new file is checked before uploading its unchanged bytes", async (context) => {
  const file = new File(["new pixels"], "photo.jpg", { type: "image/jpeg" });
  const calls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push(url);
    if (url === "/api/media/check") return Response.json({ asset: null });
    assert.equal(init.body, file);
    assert.deepEqual(init.headers, { "Content-Type": "image/jpeg" });
    return Response.json({ asset, duplicate: false }, { status: 201 });
  });
  assert.equal((await uploadSharedPhoto(file)).duplicate, false);
  assert.deepEqual(calls, ["/api/media/check", "/api/media"]);
});

test("failed duplicate checks stop before any upload", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ message: "Please sign in again." }, { status: 403 });
  });
  await assert.rejects(uploadSharedPhoto(new File(["pixels"], "photo.jpg")), /Please sign in again/);
  assert.equal(calls, 1);
});

test("editing file bytes produces a different fingerprint", async (context) => {
  const hashes: string[] = [];
  context.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    hashes.push(JSON.parse(init.body as string).hash);
    return Response.json({ asset: null });
  });
  await findDuplicatePhoto(new File(["original"], "photo.jpg"));
  await findDuplicatePhoto(new File(["edited"], "photo.jpg"));
  assert.notEqual(hashes[0], hashes[1]);
});


test("background result is reused without issuing a second check", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ asset });
  });
  const check = prepareDuplicatePhotoCheck(new File(["pixels"], "photo.jpg"));
  await check;
  assert.deepEqual(await resolveDuplicatePhotoCheck(check), asset);
  assert.deepEqual(await resolveDuplicatePhotoCheck(check), asset);
  assert.equal(calls, 1);
});

test("background errors are captured until the user submits", async (context) => {
  context.mock.method(globalThis, "fetch", async () => {
    throw new Error("Connection lost");
  });
  const check = prepareDuplicatePhotoCheck(new File(["pixels"], "photo.jpg"));
  const result = await check;
  assert.ok(result.error);
  await assert.rejects(resolveDuplicatePhotoCheck(check), /Connection lost/);
});

test("separate file selections keep their own results when replies arrive out of order", async (context) => {
  const firstHash = createHash("sha256").update("first").digest("hex");
  let finishFirst!: (response: Response) => void;
  const firstResponse = new Promise<Response>(resolve => { finishFirst = resolve; });
  context.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    if (JSON.parse(init.body as string).hash === firstHash) return firstResponse;
    return Response.json({ asset: null });
  });
  const first = prepareDuplicatePhotoCheck(new File(["first"], "same-name.jpg"));
  const second = prepareDuplicatePhotoCheck(new File(["second"], "same-name.jpg"));
  assert.equal(await resolveDuplicatePhotoCheck(second), null);
  finishFirst(Response.json({ asset }));
  assert.deepEqual(await resolveDuplicatePhotoCheck(first), asset);
  assert.equal(await resolveDuplicatePhotoCheck(second), null);
});
