import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cropInput,
  defaultCrop,
  heartPhotosInput,
  imageMime,
  limitedBody,
  photoEditInput,
  photoGeometry,
  sameOrigin,
} from "../src/lib/heart-photo-input";
test("landscape and portrait crops always cover the heart", () => {
  for (const [w, h] of [
    [1600, 900],
    [2400, 1800],
    [900, 1600],
    [100, 100],
  ]) {
    for (const zoom of [1, 2, 3])
      for (const x of [0, 50, 100])
        for (const y of [0, 50, 100]) {
          const g = photoGeometry(w, h, { zoom, x, y });
          assert.ok(g.x <= 0 && g.y <= 0);
          assert.ok(
            g.width + g.x >= 240 - 1e-8 && g.height + g.y >= 220 - 1e-8,
          );
        }
  }
});
test("invalid crop and revisions cannot reach photo updates", () => {
  for (const change of [
    { zoom: 0 },
    { zoom: 3.1 },
    { x: -1 },
    { y: 101 },
    { x: NaN },
    { zoom: Infinity },
  ])
    assert.equal(
      cropInput.safeParse({ ...defaultCrop, ...change }).success,
      false,
    );
  for (const revision of [-1, 1.5, 2147483647, "0"])
    assert.equal(
      photoEditInput.safeParse({ revision, crop: defaultCrop }).success,
      false,
    );
  assert.deepEqual(
    photoEditInput.parse({
      revision: 0,
      crop: defaultCrop,
      coupleId: "untrusted",
      publicId: "untrusted",
    }),
    { revision: 0, crop: defaultCrop },
  );
});
test("heart photo collections are limited to three validated photos", () => {
  const photo = {
    id: "a1d8c032-6ff4-4cc7-99c1-9a6282fa4a1b",
    width: 100,
    height: 100,
    format: "jpg" as const,
    crop: defaultCrop,
  };
  assert.equal(heartPhotosInput.safeParse([photo, photo, photo]).success, true);
  assert.equal(heartPhotosInput.safeParse([photo, photo, photo, photo]).success, false);
  assert.equal(heartPhotosInput.safeParse([{ ...photo, width: 0 }]).success, false);
  // Shared library photos can exceed the legacy heart uploader's 1600px limit.
  assert.equal(heartPhotosInput.safeParse([{ ...photo, width: 2400, height: 1800 }]).success, true);
  assert.equal(heartPhotosInput.safeParse([{ ...photo, width: 2401 }]).success, false);
});
test("image headers allow only supported raster formats", () => {
  assert.equal(imageMime(new Uint8Array([255, 216, 255, 224])), "image/jpeg");
  assert.equal(
    imageMime(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
  assert.equal(
    imageMime(new TextEncoder().encode("RIFF0000WEBP")),
    "image/webp",
  );
  for (const text of ["<svg></svg>", "GIF89a", "%PDF-1.7", ""])
    assert.equal(imageMime(new TextEncoder().encode(text)), null);
});
test("mutations require exact configured origin, never forwarded host", () => {
  const req = (origin?: string) =>
    new Request("https://app.example/api/heart-photo", {
      headers: origin ? { origin, "x-forwarded-host": "evil.example" } : {},
    });
  assert.equal(
    sameOrigin(req("https://app.example"), "https://app.example"),
    true,
  );
  for (const origin of [
    undefined,
    "null",
    "https://evil.example",
    "http://app.example",
    "https://app.example.evil",
  ])
    assert.equal(sameOrigin(req(origin), "https://app.example"), false);
  assert.equal(sameOrigin(req("https://app.example"), undefined), false);
});
test("body reader enforces actual streamed size even without content-length", async () => {
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(3));
      c.enqueue(new Uint8Array(3));
      c.close();
    },
  });
  const req = new Request("https://app.example", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit);
  await assert.rejects(limitedBody(req, 5), /too-large/);
});
test("body reader rejects declared oversize and empty input", async () => {
  await assert.rejects(
    limitedBody(
      new Request("https://app.example", {
        method: "POST",
        headers: { "content-length": "100" },
        body: "x",
      }),
      5,
    ),
    /too-large/,
  );
  await assert.rejects(
    limitedBody(new Request("https://app.example", { method: "POST" })),
    /empty-body/,
  );
  assert.deepEqual(
    await limitedBody(
      new Request("https://app.example", { method: "POST", body: "abc" }),
      3,
    ),
    new TextEncoder().encode("abc"),
  );
});
