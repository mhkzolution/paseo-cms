"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  branchSchema,
  categorySchema,
  eventSchema,
  gallerySchema,
  postSchema,
  promotionSchema,
  storeSchema,
} from "@/validators/content.validator";

export type ResourceFormValue = string | number | null | undefined;
export type ResourceFormValues = Record<string, ResourceFormValue>;

export interface ResourceOption {
  label: string;
  value: string;
}

export interface ResourceField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "date" | "datetime-local";
  required?: boolean;
  placeholder?: string;
  options?: readonly ResourceOption[];
}

type ResourceSchemaKey =
  | "post"
  | "category"
  | "branch"
  | "store"
  | "promotion"
  | "event"
  | "gallery";

const SCHEMAS = {
  post: postSchema,
  category: categorySchema,
  branch: branchSchema,
  store: storeSchema,
  promotion: promotionSchema,
  event: eventSchema,
  gallery: gallerySchema,
} as const;

interface ResourceFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  schemaKey: ResourceSchemaKey;
  fields: readonly ResourceField[];
  defaultValues: ResourceFormValues;
}

export function ResourceForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  schemaKey,
  fields,
  defaultValues,
}: ResourceFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = SCHEMAS[schemaKey];
  const resolver = zodResolver(schema) as unknown as Resolver<ResourceFormValues>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResourceFormValues>({
    resolver,
    defaultValues,
  });

  const onSubmit = async (values: ResourceFormValues) => {
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
      {fields.map((field) => {
        const error = errors[field.name]?.message;
        const isTextarea = field.type === "textarea";
        const isFullWidth = isTextarea || field.name === "content" || field.name === "description";

        return (
          <div key={field.name} className={isFullWidth ? "md:col-span-2" : undefined}>
            <label htmlFor={field.name} className="text-sm font-medium text-foreground">
              {field.label}
            </label>
            <div className="mt-1.5">
              {field.type === "select" ? (
                <select
                  id={field.name}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  {...register(field.name)}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : isTextarea ? (
                <textarea
                  id={field.name}
                  rows={field.name === "content" ? 10 : 4}
                  placeholder={field.placeholder}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  {...register(field.name)}
                />
              ) : (
                <input
                  id={field.name}
                  type={field.type}
                  step={field.type === "number" ? "any" : undefined}
                  placeholder={field.placeholder}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  {...register(field.name)}
                />
              )}
            </div>
            {typeof error === "string" ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
          </div>
        );
      })}

      {serverError ? <p className="text-sm text-destructive md:col-span-2">{serverError}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
