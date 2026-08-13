"use client";

import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  resolveIntegrationDiagnostics,
  type IntegrationDiagnostics,
} from "@/components/integrations/resolve-integration-diagnostics";
import { Button } from "@/components/ui/button";
import { IntegrationsAnalyticsSection } from "@/features/settings/integrations-analytics-section";
import { IntegrationsDiagnosticsPanel } from "@/features/settings/integrations-diagnostics-panel";
import { IntegrationsLineSection } from "@/features/settings/integrations-line-section";
import { IntegrationsMetaSection } from "@/features/settings/integrations-meta-section";
import { IntegrationsTagManagerSection } from "@/features/settings/integrations-tag-manager-section";
import type { IntegrationSettings } from "@/lib/integration-settings";
import { integrationSchema } from "@/validators/content.validator";
import type { IntegrationFormValues } from "@/validators/content.validator";

interface IntegrationsFormProps {
  defaultValues: IntegrationFormValues;
  initialDiagnostics: IntegrationDiagnostics;
}

export function IntegrationsForm({ defaultValues, initialDiagnostics }: IntegrationsFormProps) {
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);
  const [settings, setSettings] = useState<IntegrationSettings>(defaultValues);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const resolver = zodResolver(integrationSchema) as Resolver<IntegrationFormValues>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IntegrationFormValues>({ resolver, defaultValues });

  const onSubmit = async (values: IntegrationFormValues) => {
    setServerMessage(null);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/settings/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setServerMessage(body?.error ?? "Unable to save integrations settings.");
        return;
      }

      const saved = (await response.json()) as IntegrationSettings;
      setSettings(saved);
      setDiagnostics(resolveIntegrationDiagnostics(saved));
      setIsSuccess(true);
      setServerMessage("Integrations settings saved.");
    } catch {
      setServerMessage("Unable to save integrations settings.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full max-w-none gap-8">
      <section aria-labelledby="monitoring-heading" className="grid gap-4">
        <header>
          <h2 id="monitoring-heading" className="text-base font-semibold text-foreground">
            Monitoring
          </h2>
          <p className="mt-1 text-sm text-muted">
            Runtime status and consent simulation
          </p>
        </header>

        <IntegrationsDiagnosticsPanel diagnostics={diagnostics} settings={settings} />
      </section>

      <section
        aria-labelledby="integration-configuration-heading"
        className="grid gap-4 border-t border-border pt-8"
      >
        <header>
          <h2
            id="integration-configuration-heading"
            className="text-base font-semibold text-foreground"
          >
            Configuration
          </h2>
          <p className="mt-1 text-sm text-muted">
            Provider credentials and identifiers
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <IntegrationsAnalyticsSection register={register} errors={errors} />
          <IntegrationsTagManagerSection register={register} errors={errors} />
          <IntegrationsMetaSection register={register} errors={errors} />
          <IntegrationsLineSection register={register} errors={errors} />
        </div>

        {serverMessage ? (
          <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>
            {serverMessage}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting}>
            Save Integrations
          </Button>
        </div>
      </section>
    </form>
  );
}
