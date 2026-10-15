import { MAX_MEMORY_MEDIA } from "./media-input";
import { z } from "zod";
export const memoryInput = z.object({
  title: z.string().trim().min(1, "Give this memory a title.").max(120),
  body: z
    .string()
    .trim()
    .min(1, "Write a little about this memory.")
    .max(10000),
  happenedOn: z.iso.date("Choose a valid date."),
  location: z
    .string()
    .trim()
    .max(160)
    .transform((value) => value || null),
  isMilestone: z.boolean(),
});
export const memoryAssetIdsInput = z.array(z.uuid()).max(MAX_MEMORY_MEDIA);
export const birthdayInput = z.object({
  birthday: z.union([z.literal(""), z.iso.date("Choose a valid birthday.")]).transform((value) => value || null),
});
export const coupleInput = z.object({
  name: z.string().trim().min(1).max(100),
  togetherSince: z.iso.date("Choose a valid date."),
  timezone: z
    .string()
    .trim()
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid timezone, for example Asia/Bangkok."),
});
export type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
};
export function pageNumber(value: string | string[] | undefined) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && n <= 10000 ? n : 1;
}
