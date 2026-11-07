import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { ADMIN_ROLES, authorize } from "@/lib/auth";
import { applyFilters, parseFilters } from "@/lib/donation-query";
import { EXPORT_COLUMNS, safeCell, toCsv, type ExportRow } from "@/lib/export";
import { rateLimit } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 10000;

/** Exports donor records (personal data) — Admin and Super Admin only, filtered, audited. */
export async function GET(request: Request) {
  const staff = await authorize(ADMIN_ROLES);
  if (!staff) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  if (!(await rateLimit(`export:${staff.id}`, 20, 3600))) {
    return NextResponse.json({ error: "تم تجاوز عدد مرات التصدير المسموح بها. حاول لاحقًا." }, { status: 429 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const filters = parseFilters(Object.fromEntries(url.searchParams));

  const supabase = await createClient(); // RLS applies
  const { data, error } = await applyFilters(
    supabase
      .from("donations")
      .select(
        "reference, created_at, status, donor_name, phone, whatsapp, governorate, wilayat, address, quantity_option, quantity_other, estimated_pieces, condition, preferred_period, preferred_date, received_bags, received_pieces, latitude, longitude, assignee:profiles!donations_assigned_to_fkey(full_name), donation_items(category)",
      ),
    filters,
  )
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error) return NextResponse.json({ error: "تعذّر تجهيز الملف." }, { status: 500 });
  const rows = (data ?? []) as unknown as ExportRow[];

  await createAdminClient().from("audit_logs").insert({
    actor_id: staff.id,
    action: "donations.exported",
    entity: "export",
    details: { format, rows: rows.length, filters },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const headers = {
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  };

  if (format === "csv") {
    return new NextResponse(toCsv(rows), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="daff-donations-${stamp}.csv"` },
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "فريق دفء التطوعي";
  wb.created = new Date();
  const ws = wb.addWorksheet("طلبات التبرع", { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
  ws.columns = EXPORT_COLUMNS.map((c) => ({ header: c.header, width: c.width }));
  for (const r of rows) ws.addRow(EXPORT_COLUMNS.map((c) => safeCell(c.value(r))));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFCF8" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF624533" } };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 24;
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: EXPORT_COLUMNS.length } };

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      ...headers,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="daff-donations-${stamp}.xlsx"`,
    },
  });
}
