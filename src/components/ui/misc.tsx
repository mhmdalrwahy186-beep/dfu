import type { HTMLAttributes, ReactNode } from "react";
import { STATUS_META, type DonationStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl border border-sand-300/80 bg-cream-50/85 shadow-soft backdrop-blur-sm", className)} {...props} />;
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", className)}
      {...props}
    />
  );
}

export function StatusBadge({ status, className }: { status: DonationStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge className={cn(meta.badge, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-sand-300/60", className)} aria-hidden="true" />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-sand-300/60 text-brown-600 [&_svg]:size-7">
        {icon ?? <HeartGlyph />}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-7 text-brown-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "error" | "success" | "warning";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-sand-400/60 bg-sand-300/40 text-brown-800",
    error: "border-[#e2b5aa] bg-[#f8e7e2] text-[#7d3529]",
    success: "border-[#c3dccb] bg-[#e8f2eb] text-[#2f5a3d]",
    warning: "border-[#ead3a6] bg-[#fbf1dd] text-[#7a5414]",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-2xl border px-4 py-3 text-sm leading-7", tones[tone], className)}>
      {title && <p className="font-bold">{title}</p>}
      {children}
    </div>
  );
}

export function HeartGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.3C.4 8.6 2.3 4.5 6.1 4.1 8.4 3.8 10.3 5 12 7c1.7-2 3.6-3.2 5.9-2.9 3.8.4 5.7 4.5 4.1 7.6C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

/** Thin decorative divider with a heart, echoing the logo. */
export function HeartDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-brown-700", className)} aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-l from-brown-700/50 to-transparent" />
      <span className="size-1.5 rounded-full bg-brown-700/60" />
      <HeartGlyph className="size-3.5" />
      <span className="size-1.5 rounded-full bg-brown-700/60" />
      <span className="h-px w-16 bg-gradient-to-r from-brown-700/50 to-transparent" />
    </div>
  );
}
