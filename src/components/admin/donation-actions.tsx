"use client";

import { useState, useTransition, type ReactNode } from "react";
import { CalendarPlus, CalendarX, Save, ShieldAlert, StickyNote, UserCheck } from "lucide-react";
import {
  addNote,
  anonymizeDonation,
  assignVolunteer,
  cancelCollection,
  changeStatus,
  scheduleCollection,
  updateCollectionNotes,
  type ActionResult,
} from "@/app/admin/(panel)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert, Card } from "@/components/ui/misc";
import { COORDINATOR_TRANSITIONS, DONATION_STATUSES, ROLE_LABELS, STATUS_META, type DonationStatus, type Role } from "@/lib/constants";

function useAction() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (fn: () => Promise<ActionResult>, onOk?: () => void) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) onOk?.();
    });
  const feedback = result && (
    <Alert tone={result.ok ? "success" : "error"} className="mt-3">
      {result.ok ? result.message : result.error}
    </Alert>
  );
  return { pending, run, feedback };
}

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold [&_svg]:size-5 [&_svg]:text-rose-500">
        {icon}
        {title}
      </h2>
      {children}
    </Card>
  );
}

export function StatusPanel({
  donationId,
  status,
  role,
  receivedBags,
}: {
  donationId: string;
  status: DonationStatus;
  role: Role;
  receivedBags: number | null;
}) {
  const options = role === "coordinator" ? (COORDINATOR_TRANSITIONS[status] ?? []) : DONATION_STATUSES.filter((s) => s !== status);
  const [next, setNext] = useState<DonationStatus | "">(options[0] ?? "");
  const [note, setNote] = useState("");
  const [bags, setBags] = useState("");
  const [pieces, setPieces] = useState("");
  const { pending, run, feedback } = useAction();
  const needsBags = (next === "received" || next === "completed") && receivedBags === null;

  if (options.length === 0) {
    return (
      <Panel icon={<Save />} title="تحديث الحالة">
        <p className="text-sm text-brown-600">لا توجد تحديثات متاحة لك على هذا الطلب في حالته الحالية.</p>
      </Panel>
    );
  }

  return (
    <Panel icon={<Save />} title="تحديث الحالة">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!next) return;
          run(
            () =>
              changeStatus({
                donationId,
                status: next,
                note: note || undefined,
                receivedBags: bags ? Number(bags) : undefined,
                receivedPieces: pieces ? Number(pieces) : undefined,
              }),
            () => {
              setNote("");
            },
          );
        }}
      >
        <Field label="الحالة الجديدة" htmlFor="next-status" required>
          <Select id="next-status" value={next} onChange={(e) => setNext(e.target.value as DonationStatus)}>
            {options.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </Field>
        {(next === "received" || next === "completed") && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="عدد الأكياس المستلمة" htmlFor="bags" required={needsBags}>
              <Input id="bags" type="number" inputMode="numeric" min={0} value={bags} onChange={(e) => setBags(e.target.value)} required={needsBags} />
            </Field>
            <Field label="عدد القطع (تقريبي)" htmlFor="pieces">
              <Input id="pieces" type="number" inputMode="numeric" min={0} value={pieces} onChange={(e) => setPieces(e.target.value)} />
            </Field>
          </div>
        )}
        <Field label="ملاحظة على التحديث (داخلية)" htmlFor="status-note">
          <Textarea id="status-note" className="min-h-20" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </Field>
        <Button type="submit" className="w-full" loading={pending}>
          تحديث الحالة
        </Button>
        {feedback}
      </form>
    </Panel>
  );
}

export type StaffOption = { id: string; full_name: string; role: Role };

export function AssignPanel({ donationId, assignedTo, staff }: { donationId: string; assignedTo: string | null; staff: StaffOption[] }) {
  const [value, setValue] = useState(assignedTo ?? "");
  const { pending, run, feedback } = useAction();
  return (
    <Panel icon={<UserCheck />} title="المتطوع المسؤول">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => assignVolunteer(donationId, value || null));
        }}
      >
        <Select aria-label="اختر المتطوع" value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">— بدون إسناد —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name} ({ROLE_LABELS[s.role]})
            </option>
          ))}
        </Select>
        <Button type="submit" variant="soft" className="w-full" loading={pending} disabled={value === (assignedTo ?? "")}>
          حفظ الإسناد
        </Button>
        {feedback}
      </form>
    </Panel>
  );
}

export function SchedulePanel({
  donationId,
  disabled,
  current,
  staff,
  defaultVolunteer,
}: {
  donationId: string;
  disabled: boolean;
  current: { id: string; date: string; time: string; duration: number; notes: string | null } | null;
  staff: StaffOption[];
  defaultVolunteer: string | null;
}) {
  const [date, setDate] = useState(current?.date ?? "");
  const [time, setTime] = useState(current?.time ?? "16:00");
  const [duration, setDuration] = useState(String(current?.duration ?? 60));
  const [volunteer, setVolunteer] = useState(defaultVolunteer ?? "");
  const [notes, setNotes] = useState(current?.notes ?? "");
  const [reason, setReason] = useState("");
  const { pending, run, feedback } = useAction();
  const cancel = useAction();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat" }).format(new Date());

  return (
    <Panel icon={<CalendarPlus />} title={current ? "تعديل موعد الاستلام" : "تحديد موعد الاستلام"}>
      {disabled ? (
        <p className="text-sm text-brown-600">لا يمكن جدولة استلام لطلب مستلم أو مكتمل أو ملغي.</p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => scheduleCollection({ donationId, date, time, duration: Number(duration), volunteerId: volunteer || undefined, notes }));
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="التاريخ" htmlFor="sch-date" required>
              <Input id="sch-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="الوقت" htmlFor="sch-time" required>
              <Input id="sch-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المدة المتوقعة" htmlFor="sch-dur" required>
              <Select id="sch-dur" value={duration} onChange={(e) => setDuration(e.target.value)}>
                {[30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} دقيقة
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="المتطوع" htmlFor="sch-vol">
              <Select id="sch-vol" value={volunteer} onChange={(e) => setVolunteer(e.target.value)}>
                <option value="">— لاحقًا —</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="ملاحظات الاستلام" htmlFor="sch-notes">
            <Textarea id="sch-notes" className="min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          </Field>
          <p className="text-xs text-brown-600">الأوقات بتوقيت مسقط. يمنع النظام تعارض مواعيد المتطوع نفسه.</p>
          <Button type="submit" className="w-full" loading={pending}>
            {current ? "حفظ التعديل" : "تأكيد الموعد"}
          </Button>
          {feedback}
        </form>
      )}

      {current && !disabled && (
        <div className="mt-5 border-t border-sand-300/70 pt-4">
          <Field label="سبب الإلغاء" htmlFor="cancel-reason">
            <Input id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
          </Field>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 w-full text-[#8a3d30]"
            loading={cancel.pending}
            onClick={() => {
              if (confirm("هل تريد إلغاء موعد الاستلام؟")) cancel.run(() => cancelCollection(current.id, donationId, reason));
            }}
          >
            <CalendarX /> إلغاء الموعد
          </Button>
          {cancel.feedback}
        </div>
      )}
    </Panel>
  );
}

export function CollectionNotesPanel({ appointmentId, donationId, notes }: { appointmentId: string; donationId: string; notes: string | null }) {
  const [value, setValue] = useState(notes ?? "");
  const { pending, run, feedback } = useAction();
  return (
    <Panel icon={<StickyNote />} title="ملاحظات الاستلام">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateCollectionNotes(appointmentId, donationId, value));
        }}
        className="space-y-3"
      >
        <Textarea aria-label="ملاحظات الاستلام" value={value} onChange={(e) => setValue(e.target.value)} maxLength={1000} />
        <Button type="submit" variant="soft" className="w-full" loading={pending}>
          حفظ الملاحظات
        </Button>
        {feedback}
      </form>
    </Panel>
  );
}

export function NoteForm({ donationId }: { donationId: string }) {
  const [body, setBody] = useState("");
  const { pending, run, feedback } = useAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addNote(donationId, body), () => setBody(""));
      }}
      className="space-y-3"
    >
      <Textarea aria-label="ملاحظة داخلية جديدة" placeholder="ملاحظة داخلية لا يراها المتبرع ولا المتطوعون" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} className="min-h-20" />
      <Button type="submit" variant="soft" size="sm" loading={pending} disabled={!body.trim()}>
        إضافة ملاحظة
      </Button>
      {feedback}
    </form>
  );
}

export function AnonymizePanel({ donationId }: { donationId: string }) {
  const { pending, run, feedback } = useAction();
  return (
    <Panel icon={<ShieldAlert />} title="حذف البيانات الشخصية">
      <p className="mb-3 text-sm leading-6 text-brown-600">
        يحذف الاسم والهاتف والعنوان والموقع والصور والملاحظات نهائيًا، ويُبقي الأرقام الإحصائية فقط. لا يمكن التراجع.
      </p>
      <Button
        type="button"
        variant="danger"
        size="sm"
        className="w-full"
        loading={pending}
        onClick={() => {
          if (confirm("سيتم حذف البيانات الشخصية لهذا الطلب نهائيًا. هل أنت متأكد؟")) run(() => anonymizeDonation(donationId));
        }}
      >
        حذف البيانات الشخصية
      </Button>
      {feedback}
    </Panel>
  );
}
