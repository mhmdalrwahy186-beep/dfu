"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="paper grid min-h-[70dvh] place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">عذرًا، حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-brown-600">لم يتم فقدان أي بيانات. حاول مرة أخرى بعد لحظات.</p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw /> إعادة المحاولة
        </Button>
      </div>
    </main>
  );
}
