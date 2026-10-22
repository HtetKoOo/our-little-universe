import assert from "node:assert/strict";
import test from "node:test";
import { demoGalleryPhotos } from "../src/lib/demo";
import { defaultDemoState, demoMemoryPhotos, demoStateInput, updateDemoState } from "../src/lib/demo-v2";
test("demo selection persists across sections in state without changing sample content", () => {
  let state = updateDemoState(defaultDemoState, { type: "favorite", id: "sample-photo-2" });
  state = updateDemoState(state, { type: "home-memory", id: "2" });
  state = updateDemoState(state, { type: "home-photo", id: "sample-photo-4" });
  state = updateDemoState(state, { type: "cover", memoryId: "2", id: "sample-photo-5" });
  const restored = demoStateInput.parse(JSON.parse(JSON.stringify(state)));
  assert.ok(restored.favorites.includes("sample-photo-2"));
  assert.equal(restored.homeMemory, "2");
  assert.deepEqual(restored.homePhotos, ["sample-photo-4"]);
  assert.equal(demoMemoryPhotos("2", restored)[0].id, "sample-photo-5");
  assert.equal(demoGalleryPhotos.length, 66);
  assert.equal(defaultDemoState.homeMemory, null);
  assert.deepEqual(updateDemoState(restored, { type: "reset" }), defaultDemoState);
});
test("demo rejects private or invalid IDs, cross-memory covers and more than three Home photos", () => {
  assert.equal(updateDemoState(defaultDemoState, { type: "home-memory", id: "private-memory" }), defaultDemoState);
  assert.equal(updateDemoState(defaultDemoState, { type: "cover", memoryId: "1", id: "sample-photo-2" }), defaultDemoState);
  let state = defaultDemoState;
  for (const id of ["sample-photo-1", "sample-photo-2", "sample-photo-3"]) state = updateDemoState(state, { type: "home-photo", id });
  assert.equal(updateDemoState(state, { type: "home-photo", id: "sample-photo-4" }), state);
  assert.deepEqual(updateDemoState(state, { type: "home-photo", id: "sample-photo-2" }).homePhotos, ["sample-photo-1", "sample-photo-3"]);
  assert.equal(demoStateInput.safeParse({ ...state, homePhotos: ["real-asset"] }).success, false);
});
