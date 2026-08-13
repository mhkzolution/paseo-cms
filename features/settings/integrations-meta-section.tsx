"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { IntegrationFormValues } from "@/validators/content.validator";

interface IntegrationsMetaSectionProps {
  register: UseFormRegister<IntegrationFormValues>;
  errors: FieldErrors<IntegrationFormValues>;
}

export function IntegrationsMetaSection({
  register,
  errors,
}: IntegrationsMetaSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Meta</h2>
        <p className="mt-1 text-sm text-muted">
          Configure Meta Pixel tracking for marketing analytics.
        </p>
      </div>
      <div className="max-w-xl">
        <label htmlFor="metaPixelId" className="text-sm font-medium text-foreground">
          Pixel ID
        </label>
        <p className="mt-0.5 text-xs text-muted">Meta Pixel ID</p>
        <input
          id="metaPixelId"
          type="text"
          placeholder="123456789012345"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("metaPixelId")}
        />
        {errors.metaPixelId?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.metaPixelId.message}</p>
        ) : null}
      </div>
    </section>
  );
}
