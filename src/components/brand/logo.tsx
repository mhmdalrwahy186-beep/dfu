import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The official logo of فريق دفء التطوعي, displayed as supplied (never redrawn or recoloured).
 * `mix-blend-multiply` only affects how its cream background composites with the page,
 * so it sits seamlessly on cream or white surfaces.
 */
export function Logo({
  size = 64,
  className,
  priority,
  href = "/",
}: {
  size?: number;
  className?: string;
  priority?: boolean;
  href?: string | null;
}) {
  const img = (
    <Image
      src="/brand/daff-logo.jpg"
      alt="شعار فريق دفء التطوعي"
      width={size}
      height={Math.round(size * (1232 / 1290))}
      priority={priority}
      className={cn("mix-blend-multiply", className)}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} aria-label="دفء — الصفحة الرئيسية" className="inline-flex shrink-0 rounded-2xl">
      {img}
    </Link>
  );
}
