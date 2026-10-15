import { createHash } from "node:crypto";
import { imageFormat, imageMime, MAX_MEMORY_IMAGE_BYTES } from "./media-input";
import { MAX_IMAGE_PIXELS } from "./direct-media-input";

type Intent = { publicId: string; expectedBytes: number; mime: string; contentHash: string };
type Resource = { public_id: string; resource_type: string; type: string; format: string; bytes: number; width: number; height: number };

export function verifyResource(resource: Resource, intent: Intent) {
  const format = imageFormat(`image/${resource.format === "jpg" ? "jpeg" : resource.format}`);
  if (resource.public_id !== intent.publicId || resource.resource_type !== "image" || resource.type !== "authenticated" || !format || resource.bytes !== intent.expectedBytes || resource.bytes < 1 || resource.bytes > MAX_MEMORY_IMAGE_BYTES || !Number.isInteger(resource.width) || !Number.isInteger(resource.height) || resource.width < 1 || resource.height < 1 || resource.width > 100000 || resource.height > 100000 || resource.width * resource.height > MAX_IMAGE_PIXELS)
    throw new Error("invalid-upload");
  return format;
}

export function verifyOriginalBytes(bytes: Uint8Array, intent: Intent) {
  if (bytes.length !== intent.expectedBytes || imageMime(bytes) !== intent.mime || createHash("sha256").update(bytes).digest("hex") !== intent.contentHash)
    throw new Error("invalid-upload");
}
