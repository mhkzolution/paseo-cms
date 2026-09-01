"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { toBangkokDateTimeInputValue } from "@/lib/datetime";
import { thePaseoLifeSchema, type ThePaseoLifeFormValues } from "@/validators/content.validator";

interface ThePaseoLifeFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  defaultValues: ThePaseoLifeFormValues;
}

export function ThePaseoLifeForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  defaultValues,
}: ThePaseoLifeFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ThePaseoLifeFormValues>({
    resolver: zodResolver(thePaseoLifeSchema),
    defaultValues: {
      ...defaultValues,
      publishedAt: defaultValues.publishedAt
        ? toBangkokDateTimeInputValue(defaultValues.publishedAt as Date | string)
        : "",
    },
  });

  const title = watch("title") ?? "";
  const description = watch("description") ?? "";

  const onSubmit = async (values: ThePaseoLifeFormValues) => {
    setServerError(null);

    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PUT",
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Image</p>
        <p className="mt-1 text-xs text-muted">Recommended ratio 1:1</p>
        <div className="mt-1.5">
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <CoverImageField
                value={field.value ?? ""}
                onChange={field.onChange}
                previewClassName="h-28 w-28 aspect-square"
              />
            )}
          />
        </div>
        {errors.image?.message ? <p className="mt-1 text-sm text-destructive">{errors.image.message}</p> : null}
      </div>

      <div>
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="title"
          type="text"
          maxLength={150}
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("title")}
        />
        <p className="mt-1 text-xs text-muted">{title.length}/150</p>
        {errors.title?.message ? <p className="mt-1 text-sm text-destructive">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          maxLength={300}
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("description")}
        />
        <p className="mt-1 text-xs text-muted">{String(description).length}/300</p>
        {errors.description?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="linkUrl" className="text-sm font-medium text-foreground">
          Destination URL
        </label>
        <input
          id="linkUrl"
          type="text"
          placeholder="/news/summer-campaign or https://thepaseo.co.th/..."
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("linkUrl")}
        />
        {errors.linkUrl?.message ? <p className="mt-1 text-sm text-destructive">{errors.linkUrl.message}</p> : null}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Open behavior</legend>
        <Controller
          name="openInNewTab"
          control={control}
          render={({ field }) => (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm">
                <input
                  type="radio"
                  className="h-4 w-4"
                  checked={!field.value}
                  onChange={() => field.onChange(false)}
                />
                Open in current tab
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm">
                <input
                  type="radio"
                  className="h-4 w-4"
                  checked={Boolean(field.value)}
                  onChange={() => field.onChange(true)}
                />
                Open in new tab
              </label>
            </div>
          )}
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Status</legend>
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm">
                <input
                  type="radio"
                  className="h-4 w-4"
                  checked={field.value !== false}
                  onChange={() => field.onChange(true)}
                />
                Active
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm">
                <input
                  type="radio"
                  className="h-4 w-4"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                />
                Inactive
              </label>
            </div>
          )}
        />
      </fieldset>

      <div>
        <label htmlFor="publishedAt" className="text-sm font-medium text-foreground">
          Publish date
        </label>
        <input
          id="publishedAt"
          type="datetime-local"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("publishedAt")}
        />
        <p className="mt-1 text-xs text-muted">Leave empty to publish immediately when Active.</p>
      </div>

      <div>
        <label htmlFor="sortOrder" className="text-sm font-medium text-foreground">
          Sort order
        </label>
        <input
          id="sortOrder"
          type="number"
          min={0}
          className="mt-1.5 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("sortOrder", { valueAsNumber: true })}
        />
        {errors.sortOrder?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.sortOrder.message}</p>
        ) : null}
      </div>

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <div>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
