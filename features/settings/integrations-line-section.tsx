"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { IntegrationFormValues } from "@/validators/content.validator";

interface IntegrationsLineSectionProps {
  register: UseFormRegister<IntegrationFormValues>;
  errors: FieldErrors<IntegrationFormValues>;
}

export function IntegrationsLineSection({
  register,
  errors,
}: IntegrationsLineSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">LINE</h2>
        <p className="mt-1 text-sm text-muted">
          Configure your LINE Official Account identifier.
        </p>
      </div>
      <div className="max-w-xl">
        <label htmlFor="lineOaId" className="text-sm font-medium text-foreground">
          LINE OA ID
        </label>
        <p className="mt-0.5 text-xs text-muted">
          Enter your LINE Official Account ID including the @ prefix. Example: @thepaseo
        </p>
        <input
          id="lineOaId"
          type="text"
          placeholder="@thepaseo"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("lineOaId")}
        />
        {errors.lineOaId?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.lineOaId.message}</p>
        ) : null}
      </div>
    </section>
  );
}
