"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { categorySchema } from "@/validators/content.validator";

type CategoryFormValues = z.input<typeof categorySchema>;

interface CategoryEditorFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  defaultValues: CategoryFormValues;
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function CategoryEditorForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  defaultValues,
}: CategoryEditorFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const resolver = zodResolver(categorySchema) as Resolver<CategoryFormValues>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({ resolver, defaultValues });

  const onSubmit = async (values: CategoryFormValues) => {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          ชื่อ
        </label>
        <input id="name" type="text" className={`mt-1.5 ${inputClass}`} {...register("name")} />
        {errors.name?.message ? <p className="mt-1 text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div>
        <label htmlFor="sortOrder" className="text-sm font-medium text-foreground">
          ลำดับ (Order)
        </label>
        <input id="sortOrder" type="number" min={0} className={`mt-1.5 ${inputClass}`} {...register("sortOrder")} />
        {errors.sortOrder?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.sortOrder.message}</p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label htmlFor="slug" className="text-sm font-medium text-foreground">
          Slug
        </label>
        <input id="slug" type="text" className={`mt-1.5 ${inputClass}`} {...register("slug")} />
        {errors.slug?.message ? <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground">รูปภาพ</label>
        <div className="mt-1.5">
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <CoverImageField
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        {errors.image?.message ? <p className="mt-1 text-sm text-destructive">{errors.image.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label htmlFor="color" className="text-sm font-medium text-foreground">
          สีหมวดหมู่
        </label>
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="color"
                type="color"
                value={typeof field.value === "string" && field.value ? field.value : "#688E22"}
                onChange={(event) => field.onChange(event.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-border bg-surface p-1"
              />
              <input
                type="text"
                placeholder="#688E22"
                className={inputClass}
                value={typeof field.value === "string" ? field.value : ""}
                onChange={(event) => field.onChange(event.target.value)}
              />
            </div>
          )}
        />
        {errors.color?.message ? <p className="mt-1 text-sm text-destructive">{errors.color.message}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-destructive md:col-span-2">{serverError}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
