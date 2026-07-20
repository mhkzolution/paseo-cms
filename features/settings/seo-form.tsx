"use client";

import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
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
    formState: { errors, isSubmitting },
  } = useForm<SeoFormValues>({ resolver, defaultValues });

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
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="metaTitle" className="text-sm font-medium text-foreground">
          Meta title
        </label>
        <input
          id="metaTitle"
          type="text"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("metaTitle")}
        />
        {errors.metaTitle?.message ? <p className="mt-1 text-sm text-destructive">{errors.metaTitle.message}</p> : null}
      </div>

      <div>
        <label htmlFor="canonicalUrl" className="text-sm font-medium text-foreground">
          Canonical URL
        </label>
        <input
          id="canonicalUrl"
          type="url"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("canonicalUrl")}
        />
        {errors.canonicalUrl?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.canonicalUrl.message}</p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label htmlFor="metaDescription" className="text-sm font-medium text-foreground">
          Meta description
        </label>
        <textarea
          id="metaDescription"
          rows={3}
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("metaDescription")}
        />
        {errors.metaDescription?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.metaDescription.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="ogImage" className="text-sm font-medium text-foreground">
          Open Graph image
        </label>
        <input
          id="ogImage"
          type="text"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("ogImage")}
        />
      </div>

      <div>
        <label htmlFor="twitterCard" className="text-sm font-medium text-foreground">
          Twitter card
        </label>
        <select
          id="twitterCard"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("twitterCard")}
        >
          <option value="summary_large_image">Summary large image</option>
          <option value="summary">Summary</option>
        </select>
      </div>

      <div>
        <label htmlFor="robots" className="text-sm font-medium text-foreground">
          Robots
        </label>
        <select
          id="robots"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("robots")}
        >
          <option value="index,follow">Index, follow</option>
          <option value="noindex,nofollow">No index, no follow</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="jsonLd" className="text-sm font-medium text-foreground">
          JSON-LD
        </label>
        <textarea
          id="jsonLd"
          rows={8}
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("jsonLd")}
        />
        {errors.jsonLd?.message ? <p className="mt-1 text-sm text-destructive">{errors.jsonLd.message}</p> : null}
      </div>

      {serverMessage ? (
        <p className={isSuccess ? "text-sm text-emerald-700 md:col-span-2" : "text-sm text-destructive md:col-span-2"}>
          {serverMessage}
        </p>
      ) : null}

      <div className="md:col-span-2">
        <Button type="submit" isLoading={isSubmitting}>
          Save SEO
        </Button>
      </div>
    </form>
  );
}
