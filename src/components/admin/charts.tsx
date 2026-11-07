"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { STATUS_META, DONATION_STATUSES, type DonationStatus } from "@/lib/constants";

const INK = "#46301f";
const MUTED = "#8a6249";
const GRID = "#e8d8c7";
const BAR = "#74523d";

const monthLabel = (m: string) =>
  new Intl.DateTimeFormat("ar-OM-u-nu-latn", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-sand-300 bg-cream-50 px-3 py-2 text-sm shadow-soft">
      <p className="text-brown-600">{label}</p>
      <p className="font-bold text-brown-900">
        <span className="ltr-nums">{payload[0].value}</span> {unit}
      </p>
    </div>
  );
}

/** Donations per month (last 12 months). Single series → no legend; the card title names it. */
export function MonthlyChart({ data }: { data: { month: string; count: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <figure>
      <div className="h-64 w-full" dir="ltr">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 0, left: -16 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
            <XAxis dataKey="label" reversed tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis orientation="right" allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip cursor={{ fill: "rgb(98 69 51 / 0.06)" }} content={<ChartTooltip unit="طلب" />} />
            <Bar dataKey="count" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={28} activeBar={{ fill: INK }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-sm text-brown-600">
        <summary className="cursor-pointer">عرض البيانات كجدول</summary>
        <table className="mt-2 w-full text-start">
          <thead><tr><th className="py-1 text-start">الشهر</th><th className="py-1 text-start">عدد الطلبات</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t border-sand-300/70"><td className="ltr-nums py-1">{d.month}</td><td className="ltr-nums py-1">{d.count}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Requests by status: horizontal bars, every bar named on the axis and value-labelled (identity never by colour). */
export function StatusChart({ byStatus }: { byStatus: Partial<Record<DonationStatus, number>> }) {
  const rows = DONATION_STATUSES.map((s) => ({ status: s, label: STATUS_META[s].label, count: byStatus[s] ?? 0 }));
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 28 }} barCategoryGap="22%">
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" reversed allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" orientation="right" width={150} tick={{ fill: INK, fontSize: 12.5 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgb(98 69 51 / 0.06)" }} content={<ChartTooltip unit="طلب" />} />
          <Bar dataKey="count" fill={BAR} radius={[4, 0, 0, 4]} maxBarSize={18} activeBar={{ fill: INK }}>
            <LabelList dataKey="count" position="left" fill={INK} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
