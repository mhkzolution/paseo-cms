"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { cn } from "@/lib/utils";
import type { SeoFormValues } from "@/validators/content.validator";

export type SeoFieldName = keyof SeoFormValues;
export type SeoRegister = UseFormRegister<SeoFormValues>;
export type SeoErrors = FieldErrors<SeoFormValues>;

export interface SeoSectionProps {
  register: SeoRegister;
  errors: SeoErrors;
}

const inputClassName =
  "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function SeoSectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface p-5 shadow-sm", className)}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function SeoTextField({
  name,
  label,
  description,
  placeholder,
  type = "text",
  register,
  error,
  className,
}: {
  name: SeoFieldName;
  label: string;
  description?: string;
  placeholder?: string;
  type?: "text" | "url";
  register: SeoRegister;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      <input id={name} type={type} placeholder={placeholder} className={inputClassName} {...register(name)} />
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function SeoTextareaField({
  name,
  label,
  description,
  placeholder,
  rows,
  monospace = false,
  register,
  error,
  className,
}: {
  name: SeoFieldName;
  label: string;
  description?: string;
  placeholder?: string;
  rows: number;
  monospace?: boolean;
  register: SeoRegister;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        className={cn(inputClassName, monospace && "font-mono")}
        {...register(name)}
      />
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
