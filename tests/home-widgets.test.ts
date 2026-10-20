import assert from "node:assert/strict";
import test from "node:test";
import { defaultHomeWidgets, homeWidgetsInput, normalizeHomeWidgets, withHomeMemory, withHomePhotos } from "../src/lib/home-widgets";
const id = "11111111-1111-4111-8111-111111111111";

test("existing Home layouts remain valid and retain a selected memory when normalized", () => {
  assert.ok(homeWidgetsInput.safeParse(defaultHomeWidgets).success);
  const chosen = defaultHomeWidgets.map(widget => widget.id === "memory" ? { ...widget, memoryId: id } : widget);
  assert.equal(normalizeHomeWidgets(chosen).find(widget => widget.id === "memory")?.memoryId, id);
  const automatic = chosen.map(widget => widget.id === "memory" ? { ...widget, memoryId: null } : widget);
  assert.ok(homeWidgetsInput.safeParse(automatic).success);
});
test("Home settings reject invalid memory IDs, other widgets with memory selections and duplicate widget IDs", () => {
  assert.equal(homeWidgetsInput.safeParse(defaultHomeWidgets.map(widget => ({ ...widget, memoryId: "invalid" }))).success, false);
  assert.equal(homeWidgetsInput.safeParse(defaultHomeWidgets.map(widget => widget.id === "photo" ? { ...widget, memoryId: id } : widget)).success, false);
  assert.equal(homeWidgetsInput.safeParse(Array(4).fill(defaultHomeWidgets[0])).success, false);
});

test("showing a memory preserves layout and makes a hidden memory widget visible", () => {
  const layout = [...defaultHomeWidgets].reverse().map(widget => ({ ...widget, visible: false }));
  const chosen = withHomeMemory(layout, id);
  assert.deepEqual(chosen.map(widget => widget.id), layout.map(widget => widget.id));
  assert.equal(chosen.find(widget => widget.id === "memory")?.visible, true);
  assert.equal(chosen.find(widget => widget.id === "memory")?.memoryId, id);
  assert.deepEqual(chosen.filter(widget => widget.id !== "memory"), layout.filter(widget => widget.id !== "memory"));
  assert.equal(layout.find(widget => widget.id === "memory")?.visible, false);
  const automatic = withHomeMemory(chosen, null);
  assert.equal(automatic.find(widget => widget.id === "memory")?.memoryId, null);
  assert.equal(automatic.find(widget => widget.id === "memory")?.visible, true);
});

test("gallery selections accept at most three distinct photos and belong only to the photo widget", () => {
  const ids = [id, "22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333"];
  const chosen = withHomePhotos(withHomeMemory(defaultHomeWidgets, id), ids);
  assert.ok(homeWidgetsInput.safeParse(chosen).success);
  assert.deepEqual(normalizeHomeWidgets(chosen).find(widget => widget.id === "photo")?.photoIds, ids);
  assert.equal(chosen.find(widget => widget.id === "memory")?.memoryId, id);
  assert.equal(homeWidgetsInput.safeParse(withHomePhotos(defaultHomeWidgets, [...ids, "44444444-4444-4444-8444-444444444444"])).success, false);
  assert.equal(homeWidgetsInput.safeParse(withHomePhotos(defaultHomeWidgets, [id, id])).success, false);
  assert.equal(homeWidgetsInput.safeParse(withHomePhotos(defaultHomeWidgets, ["invalid"])).success, false);
  assert.equal(homeWidgetsInput.safeParse(defaultHomeWidgets.map(widget => ({ ...widget, photoIds: [id] }))).success, false);
  assert.deepEqual(withHomePhotos(chosen, []).find(widget => widget.id === "photo")?.photoIds, []);
});
