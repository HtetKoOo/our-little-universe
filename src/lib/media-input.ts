import { imageMime, limitedBody } from "./heart-photo-input";

export const MAX_MEMORY_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_MEMORY_MEDIA = 100;
export const MAX_MEMORY_UPLOAD_BATCH = 10;

export { imageMime, limitedBody };

export function imageFormat(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}
