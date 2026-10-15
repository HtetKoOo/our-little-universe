import { z } from "zod";
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const cropInput = z.object({
  zoom: z.number().min(1).max(3),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});
export const defaultCrop = { zoom: 1, x: 50, y: 50 };
export type HeartCrop = z.infer<typeof cropInput>;
export type HeartPhotoFormat = "jpg" | "png" | "webp";
export type SavedHeartPhoto = {
  id: string;
  width: number;
  height: number;
  format: HeartPhotoFormat;
  crop: HeartCrop;
};
export const MAX_HEART_PHOTOS = 3;
export const savedHeartPhotoInput = z.object({
  id: z.uuid(),
  width: z.number().int().positive().max(2400),
  height: z.number().int().positive().max(2400),
  format: z.enum(["jpg", "png", "webp"]),
  crop: cropInput,
});
export const heartPhotosInput = z.array(savedHeartPhotoInput).max(MAX_HEART_PHOTOS);
export const photoCollectionEditInput = z.object({
  revision: z.number().int().min(0).max(2147483646),
  photos: heartPhotosInput,
});
export const photoEditInput = z.object({
  revision: z.number().int().min(0).max(2147483646),
  crop: cropInput,
});
export function photoGeometry(width: number, height: number, crop: HeartCrop) {
  const scale = Math.max(240 / width, 220 / height) * crop.zoom;
  const w = width * scale, h = height * scale;
  return { width: w, height: h, x: (240 - w) * crop.x / 100, y: (220 - h) * crop.y / 100 };
}
export function imageMime(bytes: Uint8Array) {
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)) return "image/png";
  if (String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return "image/webp";
  return null;
}
export function sameOrigin(request: Request, configuredOrigin: string | undefined) {
  if (!configuredOrigin) return false;
  try { return request.headers.get("origin") === new URL(configuredOrigin).origin; }
  catch { return false; }
}
export async function limitedBody(request: Request, limit = MAX_PHOTO_BYTES): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > limit) throw new Error("too-large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty-body");
  const parts: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw new Error("too-large"); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!size) throw new Error("empty-body");
  const result = new Uint8Array(size); let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}
