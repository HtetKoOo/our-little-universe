import assert from "node:assert/strict";
import test from "node:test";
import { setMemoryCover } from "../src/lib/memory-cover";

test("choosing a cover moves it first while keeping the other previews in order", () => {
  const ids = ["a", "b", "c", "d"];
  assert.deepEqual(setMemoryCover(ids, "c"), ["c", "a", "b", "d"]);
  assert.deepEqual(ids, ["a", "b", "c", "d"]);
  assert.deepEqual(setMemoryCover(ids, "a"), ids);
});
test("a cover must be attached; removing it falls back to the first remaining photo", () => {
  assert.deepEqual(setMemoryCover(["a", "b"], "unattached"), ["a", "b"]);
  const selected = setMemoryCover(["a", "b", "c"], "c");
  assert.equal(selected.filter(id => id !== "c")[0], "a");
  assert.deepEqual(setMemoryCover([], "unattached"), []);
});
