"use client";

import { useEffect, useMemo, useState } from "react";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { getLocalizationPreviewSamples } from "@/lib/localization-preview";
import {
  CALENDAR_SYSTEM_OPTIONS,
  CURRENCY_OPTIONS,
  CURRENCY_POSITION_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  LOCALIZATION_PREVIEW_SAMPLE_DATE,
  NUMBER_LOCALE_OPTIONS,
  REGIONAL_LOCALE_OPTIONS,
  TIME_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
  WEEK_STARTS_ON_OPTIONS,
  type LocalizationSettings,
} from "@/lib/localization-settings";
import { cn } from "@/lib/utils";
import { localizationSchema } from "@/validators/content.validator";
import type { LocalizationFormValues } from "@/validators/content.validator";

interface LocalizationFormProps {
  defaultValues: LocalizationSettings;
}

function SettingsCard({
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

function SelectField({
  id,
  label,
  description,
  options,
  error,
  register,
}: {
  id: keyof LocalizationFormValues;
  label: string;
  description?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string;
  register: ReturnType<typeof useForm<LocalizationFormValues>>["register"];
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      <select
        id={id}
        className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
        {...register(id)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-3 last:border-b-0 last:pb-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function LocalizationForm({ defaultValues }: LocalizationFormProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const resolver = zodResolver(localizationSchema) as Resolver<LocalizationFormValues>;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LocalizationFormValues>({
    resolver,
    defaultValues,
  });

  const watchedValues = watch();
  const defaultLanguage = watchedValues.defaultLanguage ?? defaultValues.defaultLanguage;

  useEffect(() => {
    const supported = watchedValues.supportedLanguages ?? [];
    if (!supported.includes(defaultLanguage)) {
      setValue("supportedLanguages", [defaultLanguage, ...supported], { shouldDirty: true });
    }
  }, [defaultLanguage, setValue, watchedValues.supportedLanguages]);

  const previewSettings = useMemo(
    () => ({
      defaultLanguage: watchedValues.defaultLanguage ?? defaultValues.defaultLanguage,
      supportedLanguages: watchedValues.supportedLanguages ?? defaultValues.supportedLanguages,
      dateLocale: watchedValues.dateLocale ?? defaultValues.dateLocale,
      timeLocale: watchedValues.timeLocale ?? defaultValues.timeLocale,
      numberLocale: watchedValues.numberLocale ?? defaultValues.numberLocale,
      calendarSystem: watchedValues.calendarSystem ?? defaultValues.calendarSystem,
      weekStartsOn: watchedValues.weekStartsOn ?? defaultValues.weekStartsOn,
      timezone: watchedValues.timezone ?? defaultValues.timezone,
      dateFormat: watchedValues.dateFormat ?? defaultValues.dateFormat,
      timeFormat: watchedValues.timeFormat ?? defaultValues.timeFormat,
      currency: watchedValues.currency ?? defaultValues.currency,
      currencyPosition: watchedValues.currencyPosition ?? defaultValues.currencyPosition,
    }),
    [defaultValues, watchedValues],
  );

  const preview = useMemo(
    () => getLocalizationPreviewSamples(previewSettings, LOCALIZATION_PREVIEW_SAMPLE_DATE),
    [previewSettings],
  );

  const onSubmit = async (values: LocalizationFormValues) => {
    setServerMessage(null);
    setIsSuccess(false);

    const response = await fetch("/api/settings/localization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerMessage(body?.error ?? "Unable to save localization settings.");
      return;
    }

    setIsSuccess(true);
    setServerMessage("Localization settings saved.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-6">
        <SettingsCard
          title="Language Settings"
          description="กำหนดภาษาหลักและภาษาที่รองรับบนเว็บไซต์สาธารณะ"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="defaultLanguage"
              label="Default Language"
              description="ใช้กับ Admin UI, เว็บไซต์, อีเมล และ SEO"
              options={LANGUAGE_OPTIONS}
              error={errors.defaultLanguage?.message}
              register={register}
            />

            <div className="md:col-span-2">
              <p className="text-sm font-medium text-foreground">Supported Languages</p>
              <p className="mt-0.5 text-xs text-muted">ภาษาที่เปิดให้ผู้ใช้เลือกบนเว็บไซต์</p>
              <Controller
                name="supportedLanguages"
                control={control}
                render={({ field }) => {
                  const selected = field.value ?? [];

                  return (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {LANGUAGE_OPTIONS.map((option) => {
                        const isChecked = selected.includes(option.value);
                        const isDefault = option.value === defaultLanguage;
                        const disableUncheck = isDefault && isChecked;

                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                              isChecked ? "border-paseo bg-paseo/5" : "border-border",
                              disableUncheck ? "opacity-90" : "cursor-pointer",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border text-paseo focus:ring-paseo"
                              checked={isChecked}
                              disabled={disableUncheck}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  field.onChange([...selected, option.value]);
                                  return;
                                }

                                field.onChange(selected.filter((value) => value !== option.value));
                              }}
                            />
                            <span>{option.label}</span>
                            {isDefault ? <span className="ml-auto text-xs text-muted">Default</span> : null}
                          </label>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {errors.supportedLanguages?.message ? (
                <p className="mt-1 text-sm text-destructive">{errors.supportedLanguages.message}</p>
              ) : null}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Regional Settings" description="Locale สำหรับวันที่ เวลา และตัวเลข">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="dateLocale"
              label="Date Locale"
              options={REGIONAL_LOCALE_OPTIONS}
              error={errors.dateLocale?.message}
              register={register}
            />
            <SelectField
              id="timeLocale"
              label="Time Locale"
              options={REGIONAL_LOCALE_OPTIONS}
              error={errors.timeLocale?.message}
              register={register}
            />
            <SelectField
              id="numberLocale"
              label="Number Locale"
              options={NUMBER_LOCALE_OPTIONS}
              error={errors.numberLocale?.message}
              register={register}
            />
          </div>
        </SettingsCard>

        <SettingsCard title="Calendar Settings" description="ปฏิทินและวันเริ่มต้นของสัปดาห์">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="calendarSystem"
              label="Calendar System"
              options={CALENDAR_SYSTEM_OPTIONS}
              error={errors.calendarSystem?.message}
              register={register}
            />
            <SelectField
              id="weekStartsOn"
              label="First Day Of Week"
              options={WEEK_STARTS_ON_OPTIONS}
              error={errors.weekStartsOn?.message}
              register={register}
            />
          </div>
        </SettingsCard>

        <SettingsCard title="Time Settings" description="Timezone และรูปแบบวันที่/เวลา">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="timezone"
              label="Timezone"
              options={TIMEZONE_OPTIONS}
              error={errors.timezone?.message}
              register={register}
            />
            <SelectField
              id="dateFormat"
              label="Date Format"
              options={DATE_FORMAT_OPTIONS}
              error={errors.dateFormat?.message}
              register={register}
            />
            <SelectField
              id="timeFormat"
              label="Time Format"
              options={TIME_FORMAT_OPTIONS}
              error={errors.timeFormat?.message}
              register={register}
            />
          </div>
        </SettingsCard>

        <SettingsCard title="Currency Settings" description="สกุลเงินและตำแหน่งการแสดงผล">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="currency"
              label="Currency"
              options={CURRENCY_OPTIONS}
              error={errors.currency?.message}
              register={register}
            />
            <SelectField
              id="currencyPosition"
              label="Currency Display"
              options={CURRENCY_POSITION_OPTIONS}
              error={errors.currencyPosition?.message}
              register={register}
            />
          </div>
        </SettingsCard>

        {serverMessage ? (
          <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>{serverMessage}</p>
        ) : null}

        <div>
          <Button type="submit" isLoading={isSubmitting}>
            Save localization settings
          </Button>
        </div>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <SettingsCard title="Live Preview" description="ตัวอย่างการแสดงผลอัปเดตทันทีเมื่อเปลี่ยนค่า">
          <dl>
            <PreviewRow label="Language" value={preview.languageLabel} />
            <PreviewRow label="Date" value={preview.dateSample} />
            <PreviewRow label="Time" value={preview.timeSample} />
            <PreviewRow label="Number" value={preview.numberSample} />
            <PreviewRow label="Currency" value={preview.currencySample} />
            <PreviewRow label="Timezone" value={preview.timezoneLabel} />
          </dl>
        </SettingsCard>
      </aside>
    </form>
  );
}
