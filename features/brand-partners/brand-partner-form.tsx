"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { BRAND_PARTNER_PLACEMENT_LABELS } from "@/lib/brand-partners";
import { brandPartnerSchema, type BrandPartnerInput } from "@/validators/content.validator";

interface BrandPartnerFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  defaultValues: BrandPartnerInput;
  branchLabels?: {
    branch1: string;
    branch2: string;
    branch3: string;
  };
}

const PLACEMENT_FIELDS = [
  "showOnHome",
  "showOnBranch1",
  "showOnBranch2",
  "showOnBranch3",
] as const;

export function BrandPartnerForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  defaultValues,
  branchLabels,
}: BrandPartnerFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BrandPartnerInput>({
    resolver: zodResolver(brandPartnerSchema),
    defaultValues,
  });

  const onSubmit = async (values: BrandPartnerInput) => {
    setServerError(null);

    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(returnHref);
    router.refresh();
  };

  const getPlacementLabel = (field: (typeof PLACEMENT_FIELDS)[number]) => {
    if (field === "showOnBranch1") return branchLabels?.branch1 ?? BRAND_PARTNER_PLACEMENT_LABELS.branch1;
    if (field === "showOnBranch2") return branchLabels?.branch2 ?? BRAND_PARTNER_PLACEMENT_LABELS.branch2;
    if (field === "showOnBranch3") return branchLabels?.branch3 ?? BRAND_PARTNER_PLACEMENT_LABELS.branch3;
    return BRAND_PARTNER_PLACEMENT_LABELS.home;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Brand name
        </label>
        <input
          id="name"
          type="text"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("name")}
        />
        {errors.name?.message ? <p className="mt-1 text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <p className="text-sm font-medium text-foreground">Logo</p>
        <div className="mt-1.5">
          <Controller
            name="logo"
            control={control}
            render={({ field }) => (
              <CoverImageField value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        {errors.logo?.message ? <p className="mt-1 text-sm text-destructive">{errors.logo.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label htmlFor="linkUrl" className="text-sm font-medium text-foreground">
          Link URL
        </label>
        <input
          id="linkUrl"
          type="text"
          placeholder="https://example.com"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("linkUrl")}
        />
        <p className="mt-1 text-xs text-muted">ลิงก์เมื่อคลิกโลโก้ (ไม่บังคับ)</p>
      </div>

      <div>
        <label htmlFor="sortOrder" className="text-sm font-medium text-foreground">
          Sort order
        </label>
        <input
          id="sortOrder"
          type="number"
          min={0}
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("sortOrder", { valueAsNumber: true })}
        />
        {errors.sortOrder?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.sortOrder.message}</p>
        ) : null}
      </div>

      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-paseo focus-visible:ring-2 focus-visible:ring-accent"
            {...register("isActive")}
          />
          Active
        </label>
      </div>

      <fieldset className="md:col-span-2">
        <legend className="text-sm font-medium text-foreground">แสดงในหน้า</legend>
        <p className="mt-1 text-xs text-muted">เลือกหน้าที่ต้องการให้โลโก้นี้แสดงใน Brand Loyalty section</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PLACEMENT_FIELDS.map((field) => (
            <label
              key={field}
              className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-paseo focus-visible:ring-2 focus-visible:ring-accent"
                {...register(field)}
              />
              {getPlacementLabel(field)}
            </label>
          ))}
        </div>
      </fieldset>

      {serverError ? <p className="text-sm text-destructive md:col-span-2">{serverError}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
