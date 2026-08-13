"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { IntegrationFormValues } from "@/validators/content.validator";

interface IntegrationsTagManagerSectionProps {
  register: UseFormRegister<IntegrationFormValues>;
  errors: FieldErrors<IntegrationFormValues>;
}

export function IntegrationsTagManagerSection({
  register,
  errors,
}: IntegrationsTagManagerSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Tag Manager</h2>
        <p className="mt-1 text-sm text-muted">
          Configure Google Tag Manager container injection.
        </p>
      </div>
      <div className="max-w-xl">
        <label htmlFor="gtmContainerId" className="text-sm font-medium text-foreground">
          Container ID
        </label>
        <p className="mt-0.5 text-xs text-muted">GTM Container ID</p>
        <input
          id="gtmContainerId"
          type="text"
          placeholder="GTM-XXXXXXX"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("gtmContainerId")}
        />
        {errors.gtmContainerId?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.gtmContainerId.message}</p>
        ) : null}
      </div>
    </section>
  );
}
