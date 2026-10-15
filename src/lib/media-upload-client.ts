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
  const result = await readPhotoResponse(response);
  return result.asset;
}

export class PhotoUploadError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

async function readPhotoResponse(response: Response) {
  // Hosting limits may respond with plain text rather than our app's JSON.
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const message = result?.message ?? (
      response.status === 413 ? "This photo is too large. Choose a photo under 8 MB."
      : response.status === 401 || response.status === 403 ? "Please sign in again before uploading photos."
      : response.status === 429 ? "Please wait a moment before uploading again."
      : "The upload service is temporarily unavailable. Please try again."
    );
    throw new PhotoUploadError(message, response.status);
  }
  if (!result || response.redirected) throw new PhotoUploadError("Please reopen the app and sign in again.", 401);
  return result;
}

export async function uploadSharedPhoto(file: File, preparedCheck?: Promise<DuplicatePhotoCheck>, onStage?: (stage: "checking" | "uploading" | "verifying") => void): Promise<{ asset: LibraryAsset; duplicate: boolean }> {
  onStage?.("checking");
  const existing = preparedCheck ? await resolveDuplicatePhotoCheck(preparedCheck) : await findDuplicatePhoto(file);
  if (existing) return { asset: existing, duplicate: true };
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,"0")).join("");
  const permission = await readPhotoResponse(await fetch("/api/media/prepare", {
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({hash,bytes:file.size,mime:file.type}),signal:AbortSignal.timeout(20000),
  }));
  // Another member may have completed the same photo since the initial check.
  if (permission.asset) return { asset:permission.asset,duplicate:true };
  if (typeof permission.uploadUrl!=="string" || !/^https:\/\/api\.cloudinary\.com\/v1_1\/[^/]+\/image\/upload$/.test(permission.uploadUrl))
    throw new Error("The photo upload service is not configured correctly.");
  const form = new FormData();
  for (const [key,value] of Object.entries(permission.fields)) form.append(key,String(value));
  form.append("file",file);
  onStage?.("uploading");
  await readPhotoResponse(await fetch(permission.uploadUrl, {
    method:"POST",body:form,credentials:"omit",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(120000),
  }));
  // Only a small intent ID goes to Vercel. Provider URLs and client metadata are
  // never accepted as evidence that an asset belongs to this couple.
  onStage?.("verifying");
  return readPhotoResponse(await fetch("/api/media/complete", {
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({intentId:permission.intentId}),signal:AbortSignal.timeout(60000),
  }));
}
