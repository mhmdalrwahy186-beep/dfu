import { describe, expect, it } from "vitest";
import { parseFilters } from "@/lib/donation-query";
import { toCsv, type ExportRow } from "@/lib/export";
import { sniffImageType, validateImage } from "@/lib/images";
import { DEFAULT_QUOTES } from "@/lib/quotes";
import { pickNextIndex } from "@/lib/shuffle";
import { generateOtp, hashOtp, safeEqualHex, signToken, verifyToken } from "@/lib/tokens";

const SECRET = "test-secret-test-secret-test-secret-123";

describe("signed tokens", () => {
  it("round-trips a valid token", () => {
    const t = signToken({ ref: "DF-26-00001" }, 60, SECRET);
    expect(verifyToken<{ ref: string }>(t, SECRET)?.ref).toBe("DF-26-00001");
  });
  it("rejects tampering, wrong secret and expiry", () => {
    const t = signToken({ ref: "DF-26-00001" }, 60, SECRET);
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ref: "DF-26-99999", exp: 9999999999 })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(verifyToken(`${body}.${sig}`, SECRET + "x")).toBeNull();
    expect(verifyToken(signToken({ a: 1 }, -10, SECRET), SECRET)).toBeNull();
    expect(verifyToken("garbage", SECRET)).toBeNull();
    expect(verifyToken(undefined, SECRET)).toBeNull();
  });
});

describe("one-time codes", () => {
  it("are 6 digits and hashed per donation", () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
    const a = hashOtp(code, "donation-a", SECRET);
    expect(safeEqualHex(a, hashOtp(code, "donation-a", SECRET))).toBe(true);
    expect(safeEqualHex(a, hashOtp(code, "donation-b", SECRET))).toBe(false);
  });
});

describe("image validation (magic bytes)", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const html = new TextEncoder().encode("<html><script>alert(1)</script>");
  it("detects real types", () => {
    expect(sniffImageType(jpeg)).toBe("image/jpeg");
    expect(sniffImageType(png)).toBe("image/png");
    expect(sniffImageType(webp)).toBe("image/webp");
  });
  it("rejects disguised files, empty and oversized files", () => {
    expect(validateImage(html).ok).toBe(false);
    expect(validateImage(new Uint8Array()).ok).toBe(false);
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(jpeg);
    expect(validateImage(big).ok).toBe(false);
  });
});

describe("list filters", () => {
  it("whitelists values and strips PostgREST syntax from search", () => {
    const f = parseFilters({ q: "DF-26,(status.eq.new)", status: "hacked", governorate: "Narnia", sort: "phone; drop", dir: "up", page: "-4", from: "2026-13-99x" });
    expect(f.q).not.toMatch(/[,()]/);
    expect(f.status).toBe("");
    expect(f.governorate).toBe("");
    expect(f.sort).toBe("created_at");
    expect(f.dir).toBe("desc");
    expect(f.page).toBe(1);
    expect(f.from).toBe("");
  });
  it("keeps valid filters", () => {
    const f = parseFilters({ status: "open", governorate: "مسقط", from: "2026-01-01", sort: "reference", dir: "asc", page: "3" });
    expect(f).toMatchObject({ status: "open", governorate: "مسقط", from: "2026-01-01", sort: "reference", dir: "asc", page: 3 });
  });
});

describe("CSV export", () => {
  it("adds a BOM and neutralises formula injection", () => {
    const row = {
      reference: "DF-26-00001", created_at: "2026-11-01T10:00:00Z", status: "new", donor_name: "=HYPERLINK(\"x\")", phone: "+96891234567",
      whatsapp: null, governorate: "مسقط", wilayat: "السيب", address: "a, b", quantity_option: "one_bag", quantity_other: null,
      estimated_pieces: null, condition: "good", preferred_period: "any", preferred_date: null, received_bags: null, received_pieces: null,
      latitude: null, longitude: null, assignee: null, donation_items: [{ category: "men" }],
    } as ExportRow;
    const csv = toCsv([row]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain("'+96891234567");
    expect(csv).toContain('"a, b"');
  });
});

describe("motivational quotes", () => {
  it("has at least 40 unique quotes", () => {
    expect(DEFAULT_QUOTES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(DEFAULT_QUOTES).size).toBe(DEFAULT_QUOTES.length);
  });
  it("never repeats the current or recent quotes", () => {
    for (let i = 0; i < 500; i++) {
      const current = i % 45;
      const recent = [(i + 1) % 45, (i + 2) % 45];
      const next = pickNextIndex(45, current, recent);
      expect(next).not.toBe(current);
      expect(recent).not.toContain(next);
    }
    expect(pickNextIndex(2, 0, [1])).toBe(1);
    expect(pickNextIndex(1, 0)).toBe(0);
  });
});
