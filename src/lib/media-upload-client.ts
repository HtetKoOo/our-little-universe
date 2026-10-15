import type { LibraryAsset } from "@/components/media-picker";

export type DuplicatePhotoCheck =
  | { asset: LibraryAsset | null; error?: never }
  | { error: Error; asset?: never };

// Start this when the file is chosen. Capture errors immediately so an early
// failure cannot become an unhandled rejection while the user adjusts the crop.
// Keep the promise on that selection, rather than caching it across sessions.
export function prepareDuplicatePhotoCheck(file: File): Promise<DuplicatePhotoCheck> {
  return findDuplicatePhoto(file).then(
    asset => ({ asset }),
    error => ({ error: error instanceof Error ? error : new Error("Couldn’t check this photo.") }),
  );
}

export async function resolveDuplicatePhotoCheck(check: Promise<DuplicatePhotoCheck>) {
  const result = await check;
  if (result.error) throw result.error;
  return result.asset ?? null;
}

export async function findDuplicatePhoto(file: File): Promise<LibraryAsset | null> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const response = await fetch("/api/media/check", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "Couldn’t check this photo.");
  return result.asset;
}

export class PhotoUploadError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function uploadSharedPhoto(file: File): Promise<{ asset: LibraryAsset; duplicate: boolean }> {
  const existing = await findDuplicatePhoto(file);
  if (existing) return { asset: existing, duplicate: true };
  const response = await fetch("/api/media", {
    method: "POST", body: file, headers: { "Content-Type": file.type },
    signal: AbortSignal.timeout(75000),
  });
  const result = await response.json();
  if (!response.ok) throw new PhotoUploadError(result.message ?? "Couldn’t add this photo.", response.status);
  return result;
}
