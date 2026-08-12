"use client";

import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { IntegrationsAnalyticsSection } from "@/features/settings/integrations-analytics-section";
import { IntegrationsLineSection } from "@/features/settings/integrations-line-section";
import { IntegrationsMetaSection } from "@/features/settings/integrations-meta-section";
import { IntegrationsTagManagerSection } from "@/features/settings/integrations-tag-manager-section";
import { integrationSchema } from "@/validators/content.validator";
import type { IntegrationFormValues } from "@/validators/content.validator";

interface IntegrationsFormProps {
  defaultValues: IntegrationFormValues;
}

export function IntegrationsForm({ defaultValues }: IntegrationsFormProps) {
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

      setIsSuccess(true);
      setServerMessage("Integrations settings saved.");
    } catch {
      setServerMessage("Unable to save integrations settings.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-4xl gap-6">
      <IntegrationsAnalyticsSection register={register} errors={errors} />
      <IntegrationsTagManagerSection register={register} errors={errors} />
      <IntegrationsMetaSection register={register} errors={errors} />
      <IntegrationsLineSection register={register} errors={errors} />

      {serverMessage ? (
        <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>
          {serverMessage}
        </p>
      ) : null}

      <div>
        <Button type="submit" isLoading={isSubmitting}>
          Save Integrations
        </Button>
      </div>
    </form>
  );
}
