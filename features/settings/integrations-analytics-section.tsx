"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { IntegrationFormValues } from "@/validators/content.validator";

interface IntegrationsAnalyticsSectionProps {
  register: UseFormRegister<IntegrationFormValues>;
  errors: FieldErrors<IntegrationFormValues>;
}

export function IntegrationsAnalyticsSection({
  register,
  errors,
}: IntegrationsAnalyticsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Analytics</h2>
        <p className="mt-1 text-sm text-muted">
          Configure Google Analytics 4 tracking for your website.
        </p>
      </div>
      <div className="max-w-xl">
        <label htmlFor="gaMeasurementId" className="text-sm font-medium text-foreground">
          Measurement ID
        </label>
        <p className="mt-0.5 text-xs text-muted">GA4 Measurement ID</p>
        <input
          id="gaMeasurementId"
          type="text"
          placeholder="G-XXXXXXXXXX"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("gaMeasurementId")}
        />
        {errors.gaMeasurementId?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.gaMeasurementId.message}</p>
        ) : null}
      </div>
    </section>
  );
}
