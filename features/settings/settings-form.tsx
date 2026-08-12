"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { SITE_BRANDING_UPDATED_EVENT } from "@/lib/site-branding";
import { settingsSchema } from "@/validators/content.validator";
import type { SettingsFormValues } from "@/validators/content.validator";

const TEXT_FIELDS = [
  { name: "siteName", label: "Site name", type: "text" },
  { name: "siteTagline", label: "Site tagline", type: "text", description: "แสดงใต้ชื่อเว็บไซต์ในแถบเมนูแอดมิน" },
  { name: "siteUrl", label: "Site URL", type: "url" },
  { name: "contactEmail", label: "Contact email", type: "email" },
  { name: "contactPhone", label: "Contact phone", type: "text" },
  { name: "facebookUrl", label: "Facebook URL", type: "url" },
  { name: "instagramUrl", label: "Instagram URL", type: "url" },
  { name: "tiktokUrl", label: "TikTok URL", type: "url" },
  { name: "lineUrl", label: "LINE URL", type: "url" },
] as const satisfies ReadonlyArray<{
  name: keyof SettingsFormValues;
  label: string;
  type: string;
  description?: string;
}>;

const IMAGE_FIELDS = [
  { name: "siteLogo", label: "Site logo", description: "แสดงที่ header ของเว็บไซต์" },
  { name: "favicon", label: "Favicon", description: "ไอคอนแท็บเบราว์เซอร์" },
] as const satisfies ReadonlyArray<{ name: keyof SettingsFormValues; label: string; description: string }>;

interface SettingsFormProps {
  defaultValues: SettingsFormValues;
}

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const resolver = zodResolver(settingsSchema) as Resolver<SettingsFormValues>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({ resolver, defaultValues });

  const onSubmit = async (values: SettingsFormValues) => {
    setServerMessage(null);
    setIsSuccess(false);

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...defaultValues, ...values }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerMessage(body?.error ?? "Unable to save settings.");
      return;
    }

    setIsSuccess(true);
    setServerMessage("Settings saved.");
    window.dispatchEvent(
      new CustomEvent(SITE_BRANDING_UPDATED_EVENT, {
        detail: {
          siteName: values.siteName,
          siteLogo: values.siteLogo ?? "",
          siteTagline: values.siteTagline ?? "",
        },
      }),
    );
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-4xl gap-10">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">Site identity</h2>
            <p className="mt-1 text-sm text-muted">โลโก้เว็บไซต์, favicon และข้อมูลพื้นฐาน</p>
          </div>

          {IMAGE_FIELDS.map((field) => (
            <div key={field.name} className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">{field.label}</label>
              <p className="mt-0.5 text-xs text-muted">{field.description}</p>
              <div className="mt-1.5">
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: formField }) => (
                    <CoverImageField
                      value={typeof formField.value === "string" ? formField.value : ""}
                      onChange={formField.onChange}
                    />
                  )}
                />
              </div>
            </div>
          ))}

          {TEXT_FIELDS.slice(0, 3).map((field) => {
            const error = errors[field.name]?.message;
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
                {"description" in field && field.description ? (
                  <p className="mt-0.5 text-xs text-muted">{field.description}</p>
                ) : null}
                <div className="mt-1.5">
                  <input
                    id={field.name}
                    type={field.type}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    {...register(field.name)}
                  />
                </div>
                {typeof error === "string" ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">Contact & social</h2>
            <p className="mt-1 text-sm text-muted">ที่อยู่, เวลาทำการ และช่องทางติดต่อ</p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="text-sm font-medium text-foreground">
              ที่อยู่
            </label>
            <textarea
              id="address"
              rows={4}
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register("address")}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="businessHours" className="text-sm font-medium text-foreground">
              เวลาทำการ
            </label>
            <textarea
              id="businessHours"
              rows={3}
              placeholder="เช่น จันทร์–อาทิตย์ 10:00–22:00 น."
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register("businessHours")}
            />
          </div>

          {TEXT_FIELDS.slice(2).map((field) => {
            const error = errors[field.name]?.message;
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <div className="mt-1.5">
                  <input
                    id={field.name}
                    type={field.type}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    {...register(field.name)}
                  />
                </div>
                {typeof error === "string" ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
              </div>
            );
          })}
        </section>

        {serverMessage ? (
          <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>{serverMessage}</p>
        ) : null}

        <div>
          <Button type="submit" isLoading={isSubmitting}>
            Save settings
          </Button>
        </div>
    </form>
  );
}
