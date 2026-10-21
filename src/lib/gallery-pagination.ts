import { z } from "zod";
export const GALLERY_PAGE_SIZE = 60;
const cursorInput = z.object({ time: z.iso.datetime(), id: z.uuid() });
export type GalleryCursor = z.infer<typeof cursorInput>;
export function parseGalleryCursor(value: string): GalleryCursor | null {
  if (value.length > 200) return null;
  try { return cursorInput.parse(JSON.parse(value)); } catch { return null; }
}
export function galleryPage<T extends { id: string; cursorTime: string }>(rows: T[]) {
  const page = rows.slice(0, GALLERY_PAGE_SIZE);
  const last = page.at(-1);
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit the database cursor timestamp from photo metadata.
    assets: page.map(({ cursorTime: _cursorTime, ...asset }) => asset),
    nextCursor: rows.length > GALLERY_PAGE_SIZE && last ? JSON.stringify({ time: last.cursorTime, id: last.id }) : null,
  };
}
export function mergeGalleryPhotos<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const ids = new Set(current.map(photo => photo.id));
  return [...current, ...incoming.filter(photo => { if (ids.has(photo.id)) return false; ids.add(photo.id); return true; })];
}
