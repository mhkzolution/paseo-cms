"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/seo";
import { tagSchema } from "@/validators/content.validator";

type TagFormValues = z.input<typeof tagSchema>;

interface TagEditorFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  defaultValues: TagFormValues;
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function TagEditorForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  defaultValues,
}: TagEditorFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues.slug));
  const resolver = zodResolver(tagSchema) as Resolver<TagFormValues>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TagFormValues>({ resolver, defaultValues });

  const nameValue = watch("name");

  const onSubmit = async (values: TagFormValues) => {
    setServerError(null);

    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        slug: values.slug?.trim() || generateSlug(values.name) || null,
      }),
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
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          ชื่อแท็ก
        </label>
        <input
          id="name"
          type="text"
          className={`mt-1.5 ${inputClass}`}
          {...register("name", {
            onChange: (event) => {
              if (!slugTouched) {
                setValue("slug", generateSlug(event.target.value), { shouldValidate: true });
              }
            },
          })}
        />
        {errors.name?.message ? <p className="mt-1 text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div>
        <label htmlFor="slug" className="text-sm font-medium text-foreground">
          Slug
        </label>
        <input
          id="slug"
          type="text"
          className={`mt-1.5 ${inputClass}`}
          {...register("slug", {
            onChange: () => setSlugTouched(true),
          })}
        />
        <p className="mt-1 text-xs text-muted">
          ใช้ใน URL เช่น /tags/{generateSlug(nameValue || "example") || "example"} — เว้นว่างแล้วระบบจะสร้างจากชื่อให้
        </p>
        {errors.slug?.message ? <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p> : null}
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          คำอธิบาย
        </label>
        <textarea
          id="description"
          rows={3}
          className={`mt-1.5 ${inputClass}`}
          placeholder="ไม่บังคับ"
          {...register("description")}
        />
        {errors.description?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
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
