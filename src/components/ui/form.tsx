import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-sand-400/70 bg-cream-50 px-4 text-[15px] text-brown-900 shadow-[inset_0_1px_2px_rgb(98_69_51/0.04)] transition placeholder:text-brown-500/60 hover:border-caramel-500 focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-300/40 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-[#b4533f] aria-[invalid=true]:ring-[#b4533f]/15";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldBase, "h-12", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(fieldBase, "min-h-28 py-3 leading-7", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(fieldBase, "h-12 appearance-none ps-4 pe-10", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-brown-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
      </svg>
    </div>
  );
});

export function Label({ htmlFor, children, required, className }: { htmlFor?: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-2 block text-sm font-semibold text-brown-800", className)}>
      {children}
      {required ? (
        <span className="ms-1 text-rose-600" aria-hidden="true">
          *
        </span>
      ) : (
        <span className="ms-1.5 text-xs font-normal text-brown-500">(اختياري)</span>
      )}
    </label>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm text-[#a24b3c]">
      <svg viewBox="0 0 20 20" className="size-4 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-.75 4.5a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4ZM10 14.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
      </svg>
      {message}
    </p>
  );
}

export function Hint({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="mt-1.5 text-[13px] leading-6 text-brown-600">
      {children}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error && <Hint id={`${htmlFor}-hint`}>{hint}</Hint>}
      <FieldError id={`${htmlFor}-error`} message={error} />
    </div>
  );
}
