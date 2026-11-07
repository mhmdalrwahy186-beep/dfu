"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { createQuote, deleteQuote, updateQuote, type ActionResult } from "@/app/admin/(panel)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Alert, Card, EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

type Quote = { id: string; text: string; is_active: boolean };

function QuoteRow({ q, onResult }: { q: Quote; onResult: (r: ActionResult) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(q.text);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      onResult(r);
      if (r.ok) after?.();
    });

  return (
    <li className={cn("flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center", !q.is_active && "opacity-60")}>
      {editing ? (
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateQuote(q.id, { text }), () => setEditing(false));
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} aria-label="نص العبارة" autoFocus />
          <Button type="submit" size="icon" loading={pending} aria-label="حفظ">{!pending && <Check />}</Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => { setEditing(false); setText(q.text); }} aria-label="إلغاء"><X /></Button>
        </form>
      ) : (
        <p className="flex-1 leading-7">«{q.text}»</p>
      )}
      {!editing && (
        <div className="flex items-center gap-1.5">
          <label className="me-2 inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-brown-800"
              checked={q.is_active}
              disabled={pending}
              onChange={(e) => run(() => updateQuote(q.id, { is_active: e.target.checked }))}
            />
            مفعّلة
          </label>
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="تعديل"><Pencil /></Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-[#a24b3c]"
            onClick={() => confirm("حذف هذه العبارة نهائيًا؟") && run(() => deleteQuote(q.id))}
            aria-label="حذف"
          >
            <Trash2 />
          </Button>
        </div>
      )}
    </li>
  );
}

export function QuotesManager({ quotes }: { quotes: Quote[] }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await createQuote(text);
              setResult(r);
              if (r.ok) setText("");
            });
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="أضف عبارة تحفيزية جديدة…" maxLength={300} aria-label="عبارة جديدة" />
          <Button type="submit" loading={pending} disabled={text.trim().length < 3}>{!pending && <Plus />} إضافة</Button>
        </form>
        {result && <Alert tone={result.ok ? "success" : "error"} className="mt-3">{result.ok ? result.message : result.error}</Alert>}
      </Card>
      <Card>
        {quotes.length === 0 ? (
          <EmptyState title="لا توجد عبارات" description="أضف أول عبارة تحفيزية لتظهر في الموقع." />
        ) : (
          <ul className="divide-y divide-sand-300/60">
            {quotes.map((q) => <QuoteRow key={`${q.id}-${q.text}-${q.is_active}`} q={q} onResult={setResult} />)}
          </ul>
        )}
      </Card>
    </div>
  );
}
