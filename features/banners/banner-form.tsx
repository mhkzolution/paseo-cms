"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { BANNER_PLACEMENT_LABELS, type BannerScope } from "@/lib/banners";
import { bannerSchema, type BannerInput } from "@/validators/content.validator";

interface BannerFormProps {
  mode: "create" | "edit";
  scope: BannerScope;
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  defaultValues: BannerInput;
  branchLabels?: {
    branch1: string;
    branch2: string;
    branch3: string;
  };
}

const SITE_PLACEMENT_FIELDS = [
  "showOnHome",
  "showOnBranch1",
  "showOnBranch2",
  "showOnBranch3",
] as const;

export function BannerForm({
  mode,
  scope,
  endpoint,
  returnHref,
  submitLabel,
  defaultValues,
  branchLabels,
}: BannerFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
    defaultValues,
  });

  const onSubmit = async (values: BannerInput) => {
    setServerError(null);

    const payload: BannerInput =
      scope === "about"
        ? {
            ...values,
            showOnHome: false,
            showOnBranch1: false,
            showOnBranch2: false,
            showOnBranch3: false,
            showOnAbout: true,
          }
        : {
            ...values,
            showOnAbout: false,
          };

    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(returnHref);
    router.refresh();
  };

  const getSitePlacementLabel = (field: (typeof SITE_PLACEMENT_FIELDS)[number]) => {
    if (field === "showOnBranch1") return branchLabels?.branch1 ?? BANNER_PLACEMENT_LABELS.branch1;
    if (field === "showOnBranch2") return branchLabels?.branch2 ?? BANNER_PLACEMENT_LABELS.branch2;
    if (field === "showOnBranch3") return branchLabels?.branch3 ?? BANNER_PLACEMENT_LABELS.branch3;
    return BANNER_PLACEMENT_LABELS.home;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="title"
          type="text"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("title")}
        />
        {errors.title?.message ? <p className="mt-1 text-sm text-destructive">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="subtitle" className="text-sm font-medium text-foreground">
          Subtitle
        </label>
        <input
          id="subtitle"
          type="text"
          placeholder="e.g. Lat Krabang"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("subtitle")}
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("description")}
        />
      </div>

      <div className="md:col-span-2">
        <p className="text-sm font-medium text-foreground">Banner image</p>
        <div className="mt-1.5">
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <CoverImageField value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        {errors.image?.message ? <p className="mt-1 text-sm text-destructive">{errors.image.message}</p> : null}
      </div>

      {scope === "site" ? (
        <>
          <div>
            <label htmlFor="linkUrl" className="text-sm font-medium text-foreground">
              Link URL
            </label>
            <input
              id="linkUrl"
              type="text"
              placeholder="/promotions"
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register("linkUrl")}
            />
          </div>

          <div>
            <label htmlFor="linkLabel" className="text-sm font-medium text-foreground">
              Link label
            </label>
            <input
              id="linkLabel"
              type="text"
              placeholder="View promotion"
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register("linkLabel")}
            />
          </div>
        </>
      ) : (
        <>
          <input type="hidden" {...register("linkUrl")} />
          <input type="hidden" {...register("linkLabel")} />
          <input type="hidden" {...register("showOnAbout")} />
        </>
      )}

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

      {scope === "site" ? (
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium text-foreground">แสดงในหน้า</legend>
          <p className="mt-1 text-xs text-muted">
            เลือกหน้าที่ต้องการให้ banner นี้แสดง (สาขา 1–3 เรียงตามลำดับสาขาในระบบ)
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SITE_PLACEMENT_FIELDS.map((field) => (
              <label
                key={field}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-paseo focus-visible:ring-2 focus-visible:ring-accent"
                  {...register(field)}
                />
                {getSitePlacementLabel(field)}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <>
          <input type="hidden" {...register("showOnHome")} />
          <input type="hidden" {...register("showOnBranch1")} />
          <input type="hidden" {...register("showOnBranch2")} />
          <input type="hidden" {...register("showOnBranch3")} />
          <p className="text-sm text-muted md:col-span-2">
            Banner นี้จะแสดงในหน้า About Us (/about) เท่านั้น
          </p>
        </>
      )}

      {serverError ? <p className="text-sm text-destructive md:col-span-2">{serverError}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
