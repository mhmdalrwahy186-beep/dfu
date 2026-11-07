import { describe, expect, it } from "vitest";
import { donationSchema, toDonationPayload } from "@/lib/validation/donation";

const valid = {
  donor_name: "سالم البلوشي",
  phone: "9123 4567",
  whatsapp: "",
  governorate: "مسقط",
  wilayat: "السيب",
  address: "المعبيلة الجنوبية، سكة 12، منزل 45",
  address_details: "",
  categories: ["men", "children"],
  quantity_option: "two_bags",
  quantity_other: "",
  estimated_pieces: "30",
  condition: "good",
  preferred_period: "evening",
  preferred_date: "",
  notes: "",
  consent: true,
  idempotency_key: "3f1c1a3e-6a5b-4c1d-9f2e-1a2b3c4d5e6f",
  website: "",
  elapsed_ms: 12000,
};

const errorsOf = (input: unknown) => {
  const r = donationSchema.safeParse(input);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe("donation form validation", () => {
  it("accepts a complete valid donation", () => {
    const r = donationSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      const p = toDonationPayload(r.data);
      expect(p.phone).toBe("+96891234567");
      expect(p.estimated_pieces).toBe(30);
      expect(p.whatsapp).toBeNull();
      expect(p.latitude).toBeNull();
    }
  });

  it("requires the core fields with Arabic messages", () => {
    const e = errorsOf({ ...valid, donor_name: "", phone: "", governorate: "", wilayat: "", address: "", categories: [] });
    expect(e.donor_name).toMatch(/الاسم/);
    expect(e.phone).toBeTruthy();
    expect(e.governorate).toMatch(/المحافظة/);
    expect(e.address).toBeTruthy();
    expect(e.categories).toMatch(/فئة/);
  });

  it("rejects a wilayat from another governorate", () => {
    expect(errorsOf({ ...valid, governorate: "ظفار" }).wilayat).toMatch(/لا تتبع/);
  });

  it("requires consent", () => {
    expect(errorsOf({ ...valid, consent: false }).consent).toMatch(/الموافقة/);
  });

  it("requires detail when quantity is 'other'", () => {
    expect(errorsOf({ ...valid, quantity_option: "other" }).quantity_other).toBeTruthy();
    expect(donationSchema.safeParse({ ...valid, quantity_option: "other", quantity_other: "صندوقان" }).success).toBe(true);
  });

  it("validates WhatsApp as a mobile number", () => {
    expect(errorsOf({ ...valid, whatsapp: "24123456" }).whatsapp).toBeTruthy();
    expect(donationSchema.safeParse({ ...valid, whatsapp: "71234567" }).success).toBe(true);
  });

  it("rejects coordinates outside Oman or a half-set pin", () => {
    expect(errorsOf({ ...valid, latitude: 24.71, longitude: 46.67 }).latitude).toBeTruthy();
    expect(errorsOf({ ...valid, latitude: 23.5 }).latitude).toBeTruthy();
    expect(donationSchema.safeParse({ ...valid, latitude: 23.588, longitude: 58.383 }).success).toBe(true);
  });

  it("rejects past preferred dates", () => {
    expect(errorsOf({ ...valid, preferred_date: "2020-01-01" }).preferred_date).toBeTruthy();
  });

  it("rejects unknown enum values and a missing idempotency key", () => {
    expect(errorsOf({ ...valid, categories: ["shoes"] }).categories).toBeTruthy();
    expect(errorsOf({ ...valid, condition: "new" }).condition).toBeTruthy();
    expect(errorsOf({ ...valid, idempotency_key: "x" }).idempotency_key).toBeTruthy();
  });

  it("flags the honeypot", () => {
    expect(donationSchema.safeParse({ ...valid, website: "spam.example" }).success).toBe(false);
  });
});
