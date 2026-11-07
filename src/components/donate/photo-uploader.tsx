"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_TOTAL_UPLOAD_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type PhotoItem = { id: string; file: File; url: string };

const MAX_DIMENSION = 1600;
const COMPRESS_ABOVE_BYTES = 700 * 1024;

/** Downscale + re-encode large photos in the browser (saves the donor's mobile data). */
async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_ABOVE_BYTES && file.type !== "image/png") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= COMPRESS_ABOVE_BYTES) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PhotoUploader({ value, onChange, disabled }: { value: PhotoItem[]; onChange: (items: PhotoItem[]) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const room = MAX_PHOTOS - value.length;
    const files = Array.from(list);
    if (files.length > room) setError(`يمكنك رفع ${MAX_PHOTOS} صور كحد أقصى.`);
    setBusy(true);
    const added: PhotoItem[] = [];
    let total = value.reduce((sum, p) => sum + p.file.size, 0);
    for (const f of files.slice(0, Math.max(0, room))) {
      if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(f.type)) {
        setError("نوع الملف غير مدعوم. استخدم صور JPG أو PNG أو WEBP.");
        continue;
      }
      const compressed = await compressImage(f);
      if (compressed.size > MAX_PHOTO_BYTES) {
        setError("حجم إحدى الصور يتجاوز 5 ميجابايت.");
        continue;
      }
      if (total + compressed.size > MAX_TOTAL_UPLOAD_BYTES) {
        setError("الحجم الإجمالي للصور كبير. احذف صورة أو اختر صورًا أصغر (الحد 4 ميجابايت للمجموع).");
        continue;
      }
      total += compressed.size;
      added.push({ id: crypto.randomUUID(), file: compressed, url: URL.createObjectURL(compressed) });
    }
    setBusy(false);
    if (added.length) onChange([...value, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    const item = value.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.url);
    onChange(value.filter((p) => p.id !== id));
  }

  return (
    <div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5" aria-label="الصور المختارة">
        {value.map((p, i) => (
          <li key={p.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-sand-300 bg-cream-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={p.url} alt={`صورة ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p.id)}
              disabled={disabled}
              className="absolute end-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-brown-900/75 text-cream-50 backdrop-blur transition hover:bg-brown-900"
              aria-label={`حذف الصورة ${i + 1}`}
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
        {value.length < MAX_PHOTOS && (
          <li className="aspect-square">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-caramel-400/80 bg-cream-50/70 text-sm text-brown-600 transition hover:border-rose-400 hover:bg-rose-200/30 hover:text-rose-600",
                busy && "animate-pulse",
              )}
            >
              <ImagePlus className="size-6" />
              {busy ? "جارٍ التجهيز…" : "إضافة صورة"}
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(",")}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-2 text-[13px] text-brown-600">
        حتى {MAX_PHOTOS} صور (JPG أو PNG أو WEBP)، بحد أقصى 4 ميجابايت للمجموع. تُضغط الصور الكبيرة تلقائيًا، ولا يراها إلا فريق دفء.
      </p>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-[#a24b3c]">
          {error}
        </p>
      )}
    </div>
  );
}
