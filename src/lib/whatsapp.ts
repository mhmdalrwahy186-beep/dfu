import { localDigits } from "@/lib/phone";

export const DONOR_WHATSAPP_MESSAGE = `السلام عليكم ورحمة الله وبركاته،

معك فريق دفء التطوعي 🤎

نشكرك على مبادرتك الطيبة بالتبرع بالملابس.

نتواصل معك لتنسيق موعد وموقع استلام التبرع.

جزاك الله خيرًا على عطائك، ونسعد بمساهمتك في نشر الدفء.`;

/**
 * Opens a WhatsApp chat with a pre-filled message. The admin still presses "send"
 * in WhatsApp — nothing is sent automatically.
 */
export function whatsappLink(phone: string | null | undefined, message?: string) {
  const d = localDigits(phone);
  if (!d) return null;
  const base = `https://wa.me/968${d}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(phone: string | null | undefined) {
  const d = localDigits(phone);
  return d ? `tel:+968${d}` : null;
}
