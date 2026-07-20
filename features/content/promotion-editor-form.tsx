"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver, UseFormRegisterReturn } from "react-hook-form";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, FileText, Globe2, Link2, Search, Tags } from "lucide-react";
import type { z } from "zod";

import { SeoScoreBadge } from "@/components/admin/seo-score-badge";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { SeoScorePanel, useDebouncedSeoScore } from "@/features/content/seo-score-panel";
import { CoverImageField } from "@/features/media/cover-image-field";
import { MediaPickerDialog } from "@/features/media/media-picker-dialog";
import { PROMOTION_CATEGORY_OPTIONS } from "@/lib/promotion-categories";
import { shouldWarnOnPublish } from "@/lib/seo-score";
import { cn } from "@/lib/utils";
import { promotionSchema } from "@/validators/content.validator";

type PromotionFormValues = z.input<typeof promotionSchema>;

interface Option {
  label: string;
  value: string;
}

interface PromotionEditorFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  branches: Option[];
  tags: Option[];
  promotions: Option[];
  defaultValues: PromotionFormValues;
}

const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
] as const;

const TABS = [
  { id: "content", label: "Content", icon: FileText },
  { id: "taxonomy", label: "Taxonomy", icon: Tags },
  { id: "seo", label: "SEO", icon: Search },
  { id: "schema", label: "Schema", icon: Globe2 },
  { id: "links", label: "Links", icon: Link2 },
] as const;

export function PromotionEditorForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  branches,
  tags,
  promotions,
  defaultValues,
}: PromotionEditorFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("content");
  const [serverError, setServerError] = useState<string | null>(null);
  const [editorImagePickerOpen, setEditorImagePickerOpen] = useState(false);
  const [editorImagePickerMode, setEditorImagePickerMode] = useState<"single" | "multi">("single");
  const editorImageResolver = useRef<((value: string | null) => void) | null>(null);
  const editorImagesResolver = useRef<((value: string[] | null) => void) | null>(null);
  const resolver = zodResolver(promotionSchema) as unknown as Resolver<PromotionFormValues>;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PromotionFormValues>({ resolver, defaultValues, shouldUnregister: false });

  const watched = watch([
    "title",
    "slug",
    "content",
    "excerpt",
    "featuredImage",
    "coverImageAlt",
    "seo.seoTitle",
    "seo.seoDescription",
    "seo.focusKeyword",
    "seo.ogImage",
  ]);
  const seoScore = useDebouncedSeoScore({
    title: typeof watched[0] === "string" ? watched[0] : "",
    slug: typeof watched[1] === "string" ? watched[1] : "",
    content: typeof watched[2] === "string" ? watched[2] : "",
    excerpt: typeof watched[3] === "string" ? watched[3] : "",
    featuredImage: typeof watched[4] === "string" ? watched[4] : "",
    coverImageAlt: typeof watched[5] === "string" ? watched[5] : "",
    seo: {
      seoTitle: typeof watched[6] === "string" ? watched[6] : "",
      seoDescription: typeof watched[7] === "string" ? watched[7] : "",
      focusKeyword: typeof watched[8] === "string" ? watched[8] : "",
      ogImage: typeof watched[9] === "string" ? watched[9] : "",
    },
  });

  const alternates = useFieldArray({ control, name: "alternates" });
  const faqs = useFieldArray({ control, name: "faqs" });

  const pickEditorImage = () =>
    new Promise<string | null>((resolve) => {
      editorImageResolver.current = resolve;
      editorImagesResolver.current = null;
      setEditorImagePickerMode("single");
      setEditorImagePickerOpen(true);
    });

  const pickEditorImages = (_max: number) =>
    new Promise<string[] | null>((resolve) => {
      editorImagesResolver.current = resolve;
      editorImageResolver.current = null;
      setEditorImagePickerMode("multi");
      setEditorImagePickerOpen(true);
    });

  const closeEditorImagePicker = () => {
    editorImageResolver.current?.(null);
    editorImagesResolver.current?.(null);
    editorImageResolver.current = null;
    editorImagesResolver.current = null;
    setEditorImagePickerOpen(false);
  };

  const onSubmit = async (values: PromotionFormValues) => {
    setServerError(null);

    if (values.status === "PUBLISHED" && shouldWarnOnPublish(seoScore.seoScore)) {
      const confirmed = window.confirm(
        `คะแนน SEO ต่ำ (${seoScore.seoScore}/100) ต้องการ publish ต่อไหม?`,
      );
      if (!confirmed) return;
    }

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
              {tab.id === "seo" ? <SeoScoreBadge score={seoScore.seoScore} className="ml-0.5" /> : null}
            </button>
          );
        })}
      </div>

      <section className={cn("grid gap-4 md:grid-cols-2", activeTab !== "content" && "hidden")}>
        <Field label="Title" error={errors.title?.message}>
          <input className={inputClass} {...register("title")} />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <input className={inputClass} placeholder="Auto generated if blank" {...register("slug")} />
        </Field>
        <Field label="H1 override" error={errors.h1?.message}>
          <input className={inputClass} placeholder="Defaults to title" {...register("h1")} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select className={inputClass} {...register("status")}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date" error={errors.startDate?.message}>
          <input className={inputClass} type="datetime-local" {...register("startDate")} />
        </Field>
        <Field label="End date" error={errors.endDate?.message}>
          <input className={inputClass} type="datetime-local" {...register("endDate")} />
        </Field>
        <Field label="Published at">
          <input className={inputClass} type="datetime-local" {...register("publishedAt")} />
        </Field>
        <Field label="Reviewed at">
          <input className={inputClass} type="datetime-local" {...register("reviewedAt")} />
        </Field>
        <Field label="Expires at">
          <input className={inputClass} type="datetime-local" {...register("expiresAt")} />
        </Field>
        <Field label="Cover image" error={errors.featuredImage?.message}>
          <Controller
            name="featuredImage"
            control={control}
            render={({ field }) => (
              <CoverImageField value={typeof field.value === "string" ? field.value : ""} onChange={field.onChange} />
            )}
          />
        </Field>
        <Field label="Cover alt text" error={errors.coverImageAlt?.message}>
          <input className={inputClass} {...register("coverImageAlt")} />
        </Field>
        <Field label="Cover caption" error={errors.coverImageCaption?.message}>
          <input className={inputClass} {...register("coverImageCaption")} />
        </Field>
        <Field label="Excerpt" className="md:col-span-2" error={errors.excerpt?.message}>
          <textarea className={inputClass} rows={4} {...register("excerpt")} />
        </Field>
        <Field label="Subtitle" className="md:col-span-2" error={errors.subtitle?.message}>
          <textarea className={inputClass} rows={2} placeholder="ใช้สำหรับ SEO" {...register("subtitle")} />
        </Field>
        <Field label="Content" className="md:col-span-2" error={errors.content?.message}>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
                onPickImage={pickEditorImage}
                onPickImages={pickEditorImages}
                error={errors.content?.message}
              />
            )}
          />
        </Field>
      </section>

      <section className={cn("grid gap-5 md:grid-cols-2", activeTab !== "taxonomy" && "hidden")}>
        <Field label="Promotion category" error={errors.category?.message}>
          <select className={inputClass} {...register("category")}>
            {PROMOTION_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <CheckboxField label="Show on home page" {...register("showOnHome")} />
        <Field label="New tags" error={errors.newTags?.message}>
          <input className={inputClass} placeholder="Comma separated (e.g. community, mall)" {...register("newTags")} />
          <p className="text-xs font-normal text-muted">New tags are created and linked when you save the promotion.</p>
        </Field>
        <p className="text-xs text-muted md:col-span-2">
          Leave branches unchecked to show on every branch. Check specific branches to limit visibility.
        </p>
        <CheckboxGroup label="Branches" options={branches} register={register("branchIds")} />
        <CheckboxGroup label="Tags" options={tags} register={register("tagIds")} />
      </section>

      <section className={cn("grid gap-4 md:grid-cols-2", activeTab !== "seo" && "hidden")}>
        <SeoScorePanel result={seoScore} className="md:col-span-2" />
        <Field label="SEO title">
          <input className={inputClass} {...register("seo.seoTitle")} />
        </Field>
        <Field label="Canonical URL">
          <input className={inputClass} placeholder="Defaults to promotion URL" {...register("seo.canonicalUrl")} />
        </Field>
        <Field label="SEO description" className="md:col-span-2">
          <textarea className={inputClass} rows={3} {...register("seo.seoDescription")} />
        </Field>
        <Field label="Keywords">
          <input className={inputClass} placeholder="Comma separated" {...register("seo.keywords")} />
        </Field>
        <Field label="Focus keyword">
          <input className={inputClass} {...register("seo.focusKeyword")} />
        </Field>
        <Field label="Secondary keywords">
          <input className={inputClass} placeholder="Comma separated" {...register("seo.secondaryKeywords")} />
        </Field>
        <Field label="OG image">
          <input className={inputClass} {...register("seo.ogImage")} />
        </Field>
        <Field label="OG title">
          <input className={inputClass} {...register("seo.ogTitle")} />
        </Field>
        <Field label="OG description">
          <textarea className={inputClass} rows={3} {...register("seo.ogDescription")} />
        </Field>
        <Field label="Twitter card">
          <select className={inputClass} {...register("seo.twitterCard")}>
            <option value="SUMMARY_LARGE_IMAGE">Summary large image</option>
            <option value="SUMMARY">Summary</option>
          </select>
        </Field>
        <div className="grid gap-2 rounded-md border border-border p-4 md:col-span-2 md:grid-cols-4">
          <CheckboxField label="Noindex" {...register("seo.noindex")} />
          <CheckboxField label="Nofollow" {...register("seo.nofollow")} />
          <CheckboxField label="Noarchive" {...register("seo.noarchive")} />
          <CheckboxField label="Nosnippet" {...register("seo.nosnippet")} />
        </div>
        <Field label="Max snippet">
          <input className={inputClass} type="number" {...register("seo.maxSnippet")} />
        </Field>
        <Field label="Max image preview">
          <input className={inputClass} placeholder="large, standard, none" {...register("seo.maxImagePreview")} />
        </Field>
        <Field label="Max video preview">
          <input className={inputClass} type="number" {...register("seo.maxVideoPreview")} />
        </Field>
        <Field label="Sitemap priority">
          <input className={inputClass} type="number" step="0.1" min="0" max="1" {...register("seo.sitemapPriority")} />
        </Field>
        <div className="grid gap-2 rounded-md border border-border p-4 md:col-span-2 md:grid-cols-3">
          <CheckboxField label="Include in sitemap" {...register("seo.includeInSitemap")} />
          <CheckboxField label="Include in news sitemap" {...register("seo.includeInNewsSitemap")} />
          <CheckboxField label="Include in image sitemap" {...register("seo.includeInImageSitemap")} />
        </div>
      </section>

      <section className={cn("grid gap-4", activeTab !== "schema" && "hidden")}>
        <Field label="Schema type">
          <select className={inputClass} {...register("seo.schemaType")}>
            <option value="ARTICLE">Article</option>
            <option value="NEWS_ARTICLE">NewsArticle</option>
            <option value="BLOG_POSTING">BlogPosting</option>
            <option value="FAQ_PAGE">FAQPage</option>
            <option value="CUSTOM">Custom JSON-LD</option>
          </select>
        </Field>
        <Field label="Custom JSON-LD">
          <textarea className={inputClass} rows={8} {...register("seo.customJsonLd")} />
        </Field>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">FAQ schema</h2>
            <Button type="button" variant="secondary" onClick={() => faqs.append({ question: "", answer: "" })}>
              Add FAQ
            </Button>
          </div>
          {faqs.fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-md border border-border p-4 md:grid-cols-2">
              <input className={inputClass} placeholder="Question" {...register(`faqs.${index}.question`)} />
              <input className={inputClass} placeholder="Answer" {...register(`faqs.${index}.answer`)} />
              <Button type="button" variant="ghost" onClick={() => faqs.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className={cn("grid gap-5 md:grid-cols-2", activeTab !== "links" && "hidden")}>
        <CheckboxGroup label="Related promotions" options={promotions} register={register("relatedPromotionIds")} />
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Alternate languages</h2>
            <Button type="button" variant="secondary" onClick={() => alternates.append({ locale: "", url: "" })}>
              Add hreflang
            </Button>
          </div>
          {alternates.fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-md border border-border p-4">
              <input className={inputClass} placeholder="th, en, x-default" {...register(`alternates.${index}.locale`)} />
              <input
                className={inputClass}
                placeholder="https://example.com/en/promotions/summer-sale"
                {...register(`alternates.${index}.url`)}
              />
              <Button type="button" variant="ghost" onClick={() => alternates.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <MediaPickerDialog
        open={editorImagePickerOpen}
        onClose={closeEditorImagePicker}
        multiple={editorImagePickerMode === "multi"}
        minSelections={2}
        maxSelections={3}
        onSelect={(media) => {
          editorImageResolver.current?.(media.path);
          editorImageResolver.current = null;
          setEditorImagePickerOpen(false);
        }}
        onSelectMany={(items) => {
          editorImagesResolver.current?.(items.map((item) => item.path));
          editorImagesResolver.current = null;
          setEditorImagePickerOpen(false);
        }}
        accept={["IMAGE"]}
        title={
          editorImagePickerMode === "multi"
            ? "Insert gallery into content"
            : "Insert image into content"
        }
      />

      <div className="flex items-center gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          <Check className="h-4 w-4" aria-hidden="true" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent";

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm font-medium text-foreground", className)}>
      {label}
      {children}
      {error ? <span className="text-sm font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

function CheckboxField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" className="h-4 w-4 rounded border-border accent-paseo" {...props} />
      {label}
    </label>
  );
}

function CheckboxGroup({
  label,
  options,
  register,
}: {
  label: string;
  options: Option[];
  register: UseFormRegisterReturn;
}) {
  return (
    <fieldset className="grid gap-2 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-medium text-foreground">{label}</legend>
      {options.length ? (
        <div className="grid gap-2">
          {options.map((option) => (
            <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" value={option.value} className="h-4 w-4 rounded border-border accent-paseo" {...register} />
              {option.label}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No options yet.</p>
      )}
    </fieldset>
  );
}
