"use client";

import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { SeoAdvancedSection } from "@/features/settings/seo-advanced-section";
import { SeoGeneralSection } from "@/features/settings/seo-general-section";
import { SeoOrganizationSection } from "@/features/settings/seo-organization-section";
import { SeoVerificationSection } from "@/features/settings/seo-verification-section";
import { seoSchema } from "@/validators/content.validator";
import type { SeoFormValues } from "@/validators/content.validator";

interface SeoFormProps {
  defaultValues: SeoFormValues;
}

export function SeoForm({ defaultValues }: SeoFormProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const resolver = zodResolver(seoSchema) as Resolver<SeoFormValues>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SeoFormValues>({ resolver, defaultValues });

  const allowIndexing = watch("robots") !== "noindex,nofollow";

  const onSubmit = async (values: SeoFormValues) => {
    setServerMessage(null);
    setIsSuccess(false);

    const response = await fetch("/api/seo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerMessage(body?.error ?? "Unable to save SEO settings.");
      return;
    }

    setIsSuccess(true);
    setServerMessage("SEO settings saved.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-4xl gap-6">
      <SeoGeneralSection
        register={register}
        errors={errors}
        allowIndexing={allowIndexing}
        onAllowIndexingChange={(checked) =>
          setValue("robots", checked ? "index,follow" : "noindex,nofollow", { shouldDirty: true })
        }
      />

      <SeoVerificationSection register={register} errors={errors} />

      <SeoOrganizationSection register={register} errors={errors} />

      <SeoAdvancedSection register={register} errors={errors} />

      {serverMessage ? (
        <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>{serverMessage}</p>
      ) : null}

      <div>
        <Button type="submit" isLoading={isSubmitting}>
          Save SEO
        </Button>
      </div>
    </form>
  );
}
