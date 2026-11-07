import { CATEGORY_LABELS, CONDITION_LABELS, PERIOD_LABELS, QUANTITY_LABELS, STATUS_META, type Category, type Condition, type DonationStatus, type Period, type QuantityOption } from "@/lib/constants";

export type ExportRow = {
  reference: string; created_at: string; status: DonationStatus; donor_name: string | null; phone: string | null; whatsapp: string | null;
  governorate: string; wilayat: string; address: string | null; quantity_option: QuantityOption; quantity_other: string | null;
  estimated_pieces: number | null; condition: Condition; preferred_period: Period; preferred_date: string | null;
  received_bags: number | null; received_pieces: number | null; latitude: number | null; longitude: number | null;
  assignee: { full_name: string } | null; donation_items: { category: Category }[];
};

export const EXPORT_COLUMNS: { header: string; width: number; value: (r: ExportRow) => string | number | null }[] = [
  { header: "رقم الطلب", width: 15, value: (r) => r.reference },
  { header: "تاريخ التسجيل", width: 20, value: (r) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Muscat", dateStyle: "short", timeStyle: "short" }).format(new Date(r.created_at)) },
  { header: "الحالة", width: 20, value: (r) => STATUS_META[r.status].label },
  { header: "اسم المتبرع", width: 24, value: (r) => r.donor_name },
  { header: "الهاتف", width: 15, value: (r) => r.phone },
  { header: "واتساب", width: 15, value: (r) => r.whatsapp },
  { header: "المحافظة", width: 14, value: (r) => r.governorate },
  { header: "الولاية", width: 16, value: (r) => r.wilayat },
  { header: "وصف الموقع", width: 36, value: (r) => r.address },
  { header: "الإحداثيات", width: 22, value: (r) => (r.latitude !== null ? `${r.latitude},${r.longitude}` : null) },
  { header: "الفئات", width: 28, value: (r) => r.donation_items.map((i) => CATEGORY_LABELS[i.category]).join("، ") },
  { header: "الكمية", width: 16, value: (r) => (r.quantity_option === "other" ? r.quantity_other : QUANTITY_LABELS[r.quantity_option]) },
  { header: "القطع التقديرية", width: 12, value: (r) => r.estimated_pieces },
  { header: "حالة الملابس", width: 14, value: (r) => CONDITION_LABELS[r.condition] },
  { header: "الفترة المفضلة", width: 16, value: (r) => PERIOD_LABELS[r.preferred_period] },
  { header: "التاريخ المفضل", width: 14, value: (r) => r.preferred_date },
  { header: "الأكياس المستلمة", width: 12, value: (r) => r.received_bags },
  { header: "القطع المستلمة", width: 12, value: (r) => r.received_pieces },
  { header: "المتطوع", width: 20, value: (r) => r.assignee?.full_name ?? null },
];

/** CSV with BOM so Excel opens Arabic correctly; neutralises spreadsheet formula injection. */
export function toCsv(rows: ExportRow[]) {
  const esc = (v: string | number | null) => {
    if (v === null || v === undefined) return "";
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [EXPORT_COLUMNS.map((c) => esc(c.header)).join(",")];
  for (const r of rows) lines.push(EXPORT_COLUMNS.map((c) => esc(c.value(r))).join(","));
  return "﻿" + lines.join("\r\n");
}

export function safeCell(v: string | number | null) {
  if (typeof v === "string" && /^[=+\-@]/.test(v)) return `'${v}`;
  return v;
}
