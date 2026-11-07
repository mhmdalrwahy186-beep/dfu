import { describe, expect, it } from "vitest";
import { OMAN_GOVERNORATES, isInsideOman, isValidLocation, wilayatsOf } from "@/lib/oman";
import { formatOmaniPhone, isOmaniMobile, isOmaniPhone, maskPhone, normalizeOmaniPhone } from "@/lib/phone";
import { telLink, whatsappLink, DONOR_WHATSAPP_MESSAGE } from "@/lib/whatsapp";

describe("Omani phone numbers", () => {
  it.each([
    ["91234567", "+96891234567"],
    ["9123 4567", "+96891234567"],
    ["+968 7123-4567", "+96871234567"],
    ["0096891234567", "+96891234567"],
    ["96891234567", "+96891234567"],
    ["٩١٢٣٤٥٦٧", "+96891234567"],
    ["24123456", "+96824123456"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeOmaniPhone(input)).toBe(expected);
  });

  it.each(["", "1234567", "812345678", "51234567", "+97150123456", "9123456", "912345678", "abc"])("rejects %s", (input) => {
    expect(isOmaniPhone(input)).toBe(false);
  });

  it("distinguishes mobile from landline", () => {
    expect(isOmaniMobile("91234567")).toBe(true);
    expect(isOmaniMobile("71234567")).toBe(true);
    expect(isOmaniMobile("24123456")).toBe(false);
  });

  it("formats and masks", () => {
    expect(formatOmaniPhone("+96891234567")).toBe("+968 9123 4567");
    expect(maskPhone("+96891234567")).toBe("+968 91•• ••67");
  });
});

describe("WhatsApp & call links", () => {
  it("opens a chat with the donor's normalized number and the pre-filled message", () => {
    const link = whatsappLink("9123 4567", DONOR_WHATSAPP_MESSAGE)!;
    expect(link.startsWith("https://wa.me/96891234567?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe(DONOR_WHATSAPP_MESSAGE);
    expect(DONOR_WHATSAPP_MESSAGE).toContain("معك فريق دفء التطوعي 🤎");
  });
  it("returns null for invalid numbers", () => {
    expect(whatsappLink("123")).toBeNull();
    expect(telLink(null)).toBeNull();
  });
  it("builds tel links", () => {
    expect(telLink("91234567")).toBe("tel:+96891234567");
  });
});

describe("Governorates and wilayats", () => {
  it("has 11 governorates and 63 wilayats", () => {
    expect(OMAN_GOVERNORATES).toHaveLength(11);
    expect(OMAN_GOVERNORATES.flatMap((g) => g.wilayats)).toHaveLength(63);
  });
  it("validates wilayat belongs to governorate", () => {
    expect(wilayatsOf("مسقط")).toContain("السيب");
    expect(isValidLocation("مسقط", "السيب")).toBe(true);
    expect(isValidLocation("ظفار", "السيب")).toBe(false);
  });
  it("bounds coordinates to Oman", () => {
    expect(isInsideOman(23.588, 58.383)).toBe(true);
    expect(isInsideOman(24.71, 46.67)).toBe(false); // Riyadh (coarse box check only)
  });
});
