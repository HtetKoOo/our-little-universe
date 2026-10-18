import { z } from "zod";
import { MAX_MEMORY_IMAGE_BYTES } from "./media-input";

export const directMediaInput = z.object({
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().min(1).max(MAX_MEMORY_IMAGE_BYTES),
  mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
});
export const completeMediaInput = z.object({ intentId: z.uuid() });
export const MAX_IMAGE_PIXELS = 40_000_000;
export const PREVIEW_TRANSFORMATION = [
  { width: 1280, height: 1280, crop: "limit" },
  { fetch_format: "jpg", quality: 70 },
];

export const THUMBNAIL_TRANSFORMATION = [
  { width: 320, height: 320, crop: "limit" },
  { fetch_format: "jpg", quality: 60 },
];
