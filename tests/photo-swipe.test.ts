import test from "node:test";
import assert from "node:assert/strict";
import { photoSwipe } from "../src/lib/photo-swipe";

const start = { x: 200, y: 200, time: 100 };
test("horizontal swipes select next to the left and previous to the right", () => {
  assert.equal(photoSwipe(start, { x: 100, y: 210, time: 400 }), 1);
  assert.equal(photoSwipe(start, { x: 300, y: 190, time: 400 }), -1);
});
test("photo navigation ignores taps, vertical or diagonal scrolling, and long presses", () => {
  for (const end of [
    { x: 180, y: 200, time: 200 },
    { x: 210, y: 300, time: 400 },
    { x: 260, y: 260, time: 400 },
    { x: 100, y: 200, time: 1100 },
    { x: 100, y: 200, time: 50 },
  ]) assert.equal(photoSwipe(start, end), null);
});
