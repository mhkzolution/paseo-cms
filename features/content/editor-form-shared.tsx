import type { UseFormRegisterReturn } from "react-hook-form";
import { FileText, Globe2, Link2, Search, Tags } from "lucide-react";

import { cn } from "@/lib/utils";

export const EDITOR_TABS = [
  { id: "content", label: "Content", icon: FileText },
  { id: "taxonomy", label: "Category", icon: Tags },
  { id: "seo", label: "SEO", icon: Search },
  { id: "schema", label: "Schema (SEO)", icon: Globe2 },
  { id: "links", label: "Links", icon: Link2 },
] as const;

export type EditorTabId = (typeof EDITOR_TABS)[number]["id"];

export const SLUG_FIELD_HINT =
  "URL ของหน้านี้บนเว็บไซต์ (เช่น /news/ชื่อบทความ) ถ้าว่างไว้ ระบบจะสร้างจาก Title ให้อัตโนมัติ";

export const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function Field({
  label,
  description,
  error,
  className,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm font-medium text-foreground", className)}>
      {label}
      {children}
      {description ? <p className="text-xs font-normal text-muted">{description}</p> : null}
      {error ? <span className="text-sm font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

export function CheckboxField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" className="h-4 w-4 rounded border-border accent-paseo" {...props} />
      {label}
    </label>
  );
}

export function CheckboxGroup({
  label,
  options,
  register,
}: {
  label: string;
  options: { label: string; value: string }[];
  register: UseFormRegisterReturn;
}) {
  return (
    <fieldset className="grid gap-2 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-medium text-foreground">{label}</legend>
      {options.length ? (
        <div className="grid gap-2">
          {options.map((option) => (
            <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" value={option.value} className="h-4 w-4 rounded border-border accent-paseo" {...register} />
              {option.label}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No options yet.</p>
      )}
    </fieldset>
  );
}
