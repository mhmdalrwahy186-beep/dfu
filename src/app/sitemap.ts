import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/donate", "/about", "/how-it-works", "/contact", "/privacy"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : p === "/donate" ? 0.9 : 0.6,
  }));
}
