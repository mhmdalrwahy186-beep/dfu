/**
 * Omani phone numbers: 8 digits after +968.
 *  - Mobile: starts with 7 or 9
 *  - Fixed line: starts with 2
 * Accepts Arabic-Indic digits, spaces, dashes, and +968 / 00968 / 968 prefixes.
 */
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toLatinDigits(input: string) {
  return input.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_DIGITS.indexOf(d);
    return String(i >= 0 ? i : PERSIAN_DIGITS.indexOf(d));
  });
}

/** Returns the 8 local digits, or null when the input is not an Omani number. */
export function localDigits(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = toLatinDigits(input).replace(/[\s\-().]/g, "");
  if (s.startsWith("+968")) s = s.slice(4);
  else if (s.startsWith("00968")) s = s.slice(5);
  else if (s.length === 11 && s.startsWith("968")) s = s.slice(3);
  return /^[279]\d{7}$/.test(s) ? s : null;
}

export function isOmaniPhone(input: string | null | undefined) {
  return localDigits(input) !== null;
}

export function isOmaniMobile(input: string | null | undefined) {
  const d = localDigits(input);
  return d !== null && /^[79]/.test(d);
}

/** E.164 format: +968XXXXXXXX */
export function normalizeOmaniPhone(input: string): string | null {
  const d = localDigits(input);
  return d ? `+968${d}` : null;
}

/** Display format: +968 9123 4567 */
export function formatOmaniPhone(input: string | null | undefined) {
  const d = localDigits(input);
  if (!d) return input ?? "";
  return `+968 ${d.slice(0, 4)} ${d.slice(4)}`;
}

/** Masked for donor-facing screens: +968 91•• ••67 */
export function maskPhone(input: string | null | undefined) {
  const d = localDigits(input);
  if (!d) return "";
  return `+968 ${d.slice(0, 2)}•• ••${d.slice(6)}`;
}
