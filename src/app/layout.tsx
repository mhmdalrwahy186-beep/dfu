import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "./globals.css";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "دفء | منصة التبرع بالملابس",
    template: "%s | دفء",
  },
  description:
    "منصة فريق دفء التطوعي للتبرع بالملابس في سلطنة عُمان. سجّل تبرعك بسهولة، وسيتواصل معك الفريق لتنسيق الاستلام. دفءٌ منك… وأثرٌ يبقى.",
  applicationName: "دفء",
  keywords: ["تبرع بالملابس", "فريق دفء التطوعي", "عمان", "تطوع", "عطاء", "ملابس مستعملة"],
  openGraph: {
    type: "website",
    locale: "ar_OM",
    siteName: "دفء | منصة التبرع بالملابس",
    title: "دفء | منصة التبرع بالملابس",
    description: "ملابس لم تعد بحاجة إليها، قد تكون مصدر دفء وسعادة لغيرك.",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#F7EDE3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
