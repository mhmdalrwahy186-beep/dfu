import type { Metadata } from "next";
import { SimpleMarkdown } from "@/components/site/simple-markdown";
import { SectionHeading } from "@/components/site/sections";
import { getSettings } from "@/lib/public-data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "سياسة الخصوصية", description: "كيف يحمي فريق دفء التطوعي بيانات المتبرعين." };
export const revalidate = 300;

export default async function PrivacyPage() {
  const { privacy } = await getSettings();
  return (
    <div className="container-page max-w-3xl pt-6 sm:pt-10">
      <SectionHeading title="سياسة الخصوصية" description={`آخر تحديث: ${formatDate(privacy.updated_at)}`} />
      <article className="prose-daff rounded-3xl border border-sand-300/80 bg-cream-50/90 p-6 shadow-soft sm:p-10">
        <SimpleMarkdown source={privacy.content} />
      </article>
    </div>
  );
}
