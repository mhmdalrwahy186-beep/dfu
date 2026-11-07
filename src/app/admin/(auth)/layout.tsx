import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="paper grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo size={150} priority href={null} />
        </div>
        <div className="rounded-3xl border border-sand-300/80 bg-cream-50/90 p-6 shadow-lift sm:p-8">{children}</div>
      </div>
    </main>
  );
}
