import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/constants";

export type AcceptedImageType = (typeof ACCEPTED_PHOTO_TYPES)[number];

/** Detects the real image type from the file's first bytes (never trust the browser-supplied type). */
export function sniffImageType(bytes: Uint8Array): AcceptedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export const EXTENSION: Record<AcceptedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateImage(bytes: Uint8Array): { ok: true; type: AcceptedImageType } | { ok: false; error: string } {
  if (bytes.byteLength === 0) return { ok: false, error: "الملف فارغ." };
  if (bytes.byteLength > MAX_PHOTO_BYTES) return { ok: false, error: "حجم الصورة يتجاوز 5 ميجابايت." };
  const type = sniffImageType(bytes);
  if (!type) return { ok: false, error: "نوع الملف غير مدعوم. استخدم صور JPG أو PNG أو WEBP." };
  return { ok: true, type };
}
