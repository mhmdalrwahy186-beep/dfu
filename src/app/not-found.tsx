import { Home } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="paper grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Logo size={150} className="mx-auto" />
        <p className="ltr-nums mt-6 font-display text-6xl font-extrabold text-rose-500">404</p>
        <h1 className="mt-2 text-2xl font-bold">الصفحة غير موجودة</h1>
        <p className="mt-2 text-brown-600">ربما نُقلت الصفحة أو أن الرابط غير صحيح.</p>
        <ButtonLink href="/" className="mt-8">
          <Home /> العودة للرئيسية
        </ButtonLink>
      </div>
    </main>
  );
}
