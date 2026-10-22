import { z } from "zod";
import { demoGalleryPhotos, demoMemories } from "./demo";
const photoId = z.string().refine(id => demoGalleryPhotos.some(photo => photo.id === id));
const memoryId = z.string().refine(id => demoMemories.some(memory => memory.id === id));
export const demoStateInput = z.object({
  favorites: z.array(photoId).max(66).refine(ids => new Set(ids).size === ids.length),
  homePhotos: z.array(photoId).max(3).refine(ids => new Set(ids).size === ids.length),
  homeMemory: memoryId.nullable(),
  covers: z.record(z.string(), photoId),
}).refine(state => Object.entries(state.covers).every(([id, photo]) => demoGalleryPhotos.some(item => item.id === photo && item.memoryId === id)));
export type DemoV2State = z.infer<typeof demoStateInput>;
export const defaultDemoState: DemoV2State = { favorites: ["sample-photo-1", "sample-photo-5"], homePhotos: [], homeMemory: null, covers: {} };
export type DemoV2Action = { type: "favorite" | "home-photo"; id: string } | { type: "cover"; id: string; memoryId: string } | { type: "home-memory"; id: string | null } | { type: "reset" };
export function updateDemoState(state: DemoV2State, action: DemoV2Action): DemoV2State {
  if (action.type === "reset") return defaultDemoState;
  let next = state;
  if (action.type === "favorite" || action.type === "home-photo") {
    const field = action.type === "favorite" ? "favorites" : "homePhotos";
    const selected = state[field];
    next = { ...state, [field]: selected.includes(action.id) ? selected.filter(id => id !== action.id) : [...selected, action.id] };
  } else if (action.type === "cover") next = { ...state, covers: { ...state.covers, [action.memoryId]: action.id } };
  else next = { ...state, homeMemory: action.id };
  return demoStateInput.safeParse(next).success ? next : state;
}
export function demoMemoryPhotos(memoryId: string, state: DemoV2State) {
  const photos = demoGalleryPhotos.filter(photo => photo.memoryId === memoryId);
  const cover = state.covers[memoryId];
  return [...photos.filter(photo => photo.id === cover), ...photos.filter(photo => photo.id !== cover)];
}
