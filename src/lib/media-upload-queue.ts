import { MAX_MEMORY_UPLOAD_BATCH } from "./media-input";
import { PhotoUploadError, uploadSharedPhoto } from "./media-upload-client";

type UploadResult = Awaited<ReturnType<typeof uploadSharedPhoto>>;
export type FailedPhotoUpload = { file: File; message: string };
export type UploadProgress = { completed: number; total: number; filename: string; waiting: boolean };

// Sequential requests avoid competing with the couple-wide three-second gate.
// Retry temporary failures too; content-addressed uploads make retries safe.
export async function uploadPhotoBatch(
  files: File[],
  onUploaded: (result: UploadResult) => void,
  onProgress: (progress: UploadProgress) => void,
  dependencies: {
    upload?: (file: File) => Promise<UploadResult>;
    wait?: (milliseconds: number) => Promise<void>;
  } = {},
) {
  if (!files.length || files.length > MAX_MEMORY_UPLOAD_BATCH)
    throw new Error(`Choose between 1 and ${MAX_MEMORY_UPLOAD_BATCH} photos at a time.`);
  const upload = dependencies.upload ?? uploadSharedPhoto;
  const wait = dependencies.wait ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
  const failed: FailedPhotoUpload[] = [];
  let completed = 0;
  let cooldown = false;
  for (const file of files) {
    onProgress({ completed, total: files.length, filename: file.name, waiting: cooldown });
    if (cooldown) await wait(3100);
    onProgress({ completed, total: files.length, filename: file.name, waiting: false });
    try {
      let result: UploadResult | undefined;
      for (let attempt = 0; attempt < 4; attempt++) {
        try { result = await upload(file); break; }
        catch (error) {
          const temporary = error instanceof PhotoUploadError
            ? [408, 425, 429, 500, 502, 503, 504].includes(error.status)
            : error instanceof TypeError || (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name));
          if (!temporary || attempt === 3) throw error;
          onProgress({ completed, total: files.length, filename: file.name, waiting: true });
          await wait(3100 * (attempt + 1));
          onProgress({ completed, total: files.length, filename: file.name, waiting: false });
        }
      }
      if (!result) throw new Error("Couldn’t add this photo.");
      onUploaded(result);
      cooldown = !result.duplicate;
    } catch (error) {
      failed.push({ file, message: error instanceof Error ? error.message : "Couldn’t add this photo." });
      cooldown = true;
    }
    completed++;
    onProgress({ completed, total: files.length, filename: file.name, waiting: false });
  }
  return failed;
}
