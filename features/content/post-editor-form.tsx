"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import type { z } from "zod";

import { SeoScoreBadge } from "@/components/admin/seo-score-badge";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { ContentPreviewPanel } from "@/features/content/content-preview-panel";
import {
  CheckboxField,
  CheckboxGroup,
  EDITOR_TABS,
  Field,
  inputClass,
  SLUG_FIELD_HINT,
} from "@/features/content/editor-form-shared";
import { SeoOptimizationAssistant } from "@/features/content/seo-optimization";
import { useSeoAssistant } from "@/hooks/use-seo-assistant";
import { CoverImageField } from "@/features/media/cover-image-field";
import { AlbumImagesField, type AlbumImageValue } from "@/features/media/album-images-field";
import { MediaPickerDialog } from "@/features/media/media-picker-dialog";
import type { PostKind } from "@/lib/seo-auto-fill";
import type { InternalLinkSuggestion } from "@/lib/seo-assistant";
import {
  isInternalLinkContextStale,
  type InternalLinkSavedContext,
} from "@/lib/seo-internal-link-context";
import { shouldWarnOnPublish } from "@/lib/seo-score";
import { cn } from "@/lib/utils";
import { postSchema } from "@/validators/content.validator";

type PostFormValues = z.input<typeof postSchema>;

interface Option {
  label: string;
  value: string;
  postKind?: PostKind;
}

interface PostEditorFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  categories: Option[];
  branches: Option[];
  tags: Option[];
  posts: Option[];
  defaultValues: PostFormValues;
  internalLinkSuggestions: InternalLinkSuggestion[];
  savedInternalLinkContext: InternalLinkSavedContext;
}

const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
] as const;

export function PostEditorForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  categories,
  branches,
  tags,
  posts,
  defaultValues,
  internalLinkSuggestions,
  savedInternalLinkContext,
}: PostEditorFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof EDITOR_TABS)[number]["id"]>("content");
  const [serverError, setServerError] = useState<string | null>(null);
  const [editorImagePickerOpen, setEditorImagePickerOpen] = useState(false);
  const [editorImagePickerMode, setEditorImagePickerMode] = useState<"single" | "multi">("single");
  const editorImageResolver = useRef<((value: string | null) => void) | null>(null);
  const editorImagesResolver = useRef<((value: string[] | null) => void) | null>(null);
  const resolver = zodResolver(postSchema) as unknown as Resolver<PostFormValues>;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>({ resolver, defaultValues, shouldUnregister: false });

  const watched = watch([
    "title",
    "slug",
    "content",
    "excerpt",
    "subtitle",
    "featuredImage",
    "coverImageAlt",
    "coverImageCaption",
    "categoryId",
    "tagIds",
    "newTags",
    "seo.seoTitle",
    "seo.seoDescription",
    "seo.focusKeyword",
    "seo.keywords",
    "seo.secondaryKeywords",
    "seo.ogImage",
    "seo.ogTitle",
    "seo.ogDescription",
  ]);
  const categoryId = typeof watched[8] === "string" ? watched[8] : "";
  const selectedCategory = categories.find((category) => category.value === categoryId);
  const postKind = selectedCategory?.postKind ?? defaultValues.kind;
  const tagIds = Array.isArray(watched[9]) ? watched[9].filter((id): id is string => typeof id === "string") : [];
  const linkSuggestionsStale = useMemo(
    () =>
      isInternalLinkContextStale(savedInternalLinkContext, {
        categoryId,
        tagIds,
      }),
    [savedInternalLinkContext, categoryId, tagIds],
  );
  const rawSeo = {
    seoTitle: typeof watched[11] === "string" ? watched[11] : "",
    seoDescription: typeof watched[12] === "string" ? watched[12] : "",
    focusKeyword: typeof watched[13] === "string" ? watched[13] : "",
    keywords: typeof watched[14] === "string" ? watched[14] : "",
    secondaryKeywords: typeof watched[15] === "string" ? watched[15] : "",
    ogImage: typeof watched[16] === "string" ? watched[16] : "",
    ogTitle: typeof watched[17] === "string" ? watched[17] : "",
    ogDescription: typeof watched[18] === "string" ? watched[18] : "",
  };
  const assistantFormState = {
    title: typeof watched[0] === "string" ? watched[0] : "",
    slug: typeof watched[1] === "string" ? watched[1] : "",
    content: typeof watched[2] === "string" ? watched[2] : "",
    excerpt: typeof watched[3] === "string" ? watched[3] : "",
    featuredImage: typeof watched[5] === "string" ? watched[5] : "",
    coverImageAlt: typeof watched[6] === "string" ? watched[6] : "",
    contentType: "post" as const,
    postKind:
      postKind === "NEWS" ||
      postKind === "PUBLIC_RELATIONS" ||
      postKind === "CENTER_UPDATE" ||
      postKind === "ARTICLE"
        ? postKind
        : undefined,
    categoryId,
    tagIds,
    newTags: typeof watched[10] === "string" ? watched[10] : "",
    categories,
    tags,
    seo: rawSeo,
  };
  const assistantState = useSeoAssistant({
    formState: assistantFormState,
    internalLinkSuggestions,
    linkSuggestionsStale,
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

  const onSubmit = async (values: PostFormValues) => {
    setServerError(null);

    if (values.status === "PUBLISHED" && shouldWarnOnPublish(assistantState.score.seoScore)) {
      const confirmed = window.confirm(
        `คะแนน SEO ต่ำ (${assistantState.score.seoScore}/100) ต้องการ publish ต่อไหม?`,
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

  const previewTitle = typeof watched[0] === "string" ? watched[0] : "";
  const previewContent = typeof watched[2] === "string" ? watched[2] : "";
  const previewExcerpt = typeof watched[3] === "string" ? watched[3] : "";
  const previewSubtitle = typeof watched[4] === "string" ? watched[4] : "";
  const previewFeaturedImage = typeof watched[5] === "string" ? watched[5] : "";
  const previewCoverImageAlt = typeof watched[6] === "string" ? watched[6] : "";
  const previewCoverImageCaption = typeof watched[7] === "string" ? watched[7] : "";

  return (
    <div className="flex gap-6">
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="flex flex-wrap gap-2 border-b border-border">
        {EDITOR_TABS.map((tab) => {
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
              {tab.id === "seo" ? <SeoScoreBadge score={assistantState.score.seoScore} className="ml-0.5" /> : null}
            </button>
          );
        })}
      </div>

      <section className={cn("grid gap-4", activeTab !== "content" && "hidden")}>
          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <div className="grid gap-4">
              <Field label="Title" error={errors.title?.message}>
                <input className={inputClass} {...register("title")} />
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
              <Field label="Published at">
                <input className={inputClass} type="datetime-local" {...register("publishedAt")} />
              </Field>
              <Field label="Cover alt text" error={errors.coverImageAlt?.message}>
                <input className={inputClass} {...register("coverImageAlt")} />
              </Field>
              <Field label="Cover caption" error={errors.coverImageCaption?.message}>
                <input className={inputClass} {...register("coverImageCaption")} />
              </Field>
            </div>

            <div className="grid gap-4">
              <Field label="Slug" description={SLUG_FIELD_HINT} error={errors.slug?.message}>
                <input className={inputClass} placeholder="สร้างอัตโนมัติจาก Title ถ้าว่างไว้" {...register("slug")} />
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
              <Field label="Banner desktop" error={errors.bannerDesktop?.message}>
                <Controller
                  name="bannerDesktop"
                  control={control}
                  render={({ field }) => (
                    <CoverImageField value={typeof field.value === "string" ? field.value : ""} onChange={field.onChange} />
                  )}
                />
              </Field>
              <Field label="Banner mobile" error={errors.bannerMobile?.message}>
                <Controller
                  name="bannerMobile"
                  control={control}
                  render={({ field }) => (
                    <CoverImageField value={typeof field.value === "string" ? field.value : ""} onChange={field.onChange} />
                  )}
                />
              </Field>
            </div>
          </div>

          <Field label="Excerpt" error={errors.excerpt?.message}>
            <textarea className={inputClass} rows={4} {...register("excerpt")} />
          </Field>
          <Field label="Subtitle" error={errors.subtitle?.message}>
            <textarea className={inputClass} rows={2} placeholder="ใช้สำหรับ SEO" {...register("subtitle")} />
          </Field>
          <Field label="Content" error={errors.content?.message}>
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
          <Field label="อัลบั้มรูปภาพ" error={errors.images?.message}>
            <Controller
              name="images"
              control={control}
              render={({ field }) => (
                <AlbumImagesField
                  value={(Array.isArray(field.value) ? field.value : []) as AlbumImageValue[]}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
        </section>

      <section className={cn("grid gap-5 md:grid-cols-2", activeTab !== "taxonomy" && "hidden")}>
          <div className="md:col-span-2">
            <Field label="หมวดหมู่ข่าวสาร">
              <select className={inputClass} {...register("categoryId")}>
                <option value="">ยังไม่ระบุหมวดหมู่</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>
            {categories.length === 0 ? (
              <p className="mt-1 text-xs text-muted">
                ยังไม่มีหมวดหมู่ —{" "}
                <Link href="/admin/post-categories" className="text-accent hover:underline">
                  เพิ่มหมวดหมู่ข่าวสาร
                </Link>
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted">
                จัดการรายการได้ที่เมนู หมวดหมู่ข้อมูล → หมวดหมู่ข่าวสาร
              </p>
            )}
          </div>
          <CheckboxField label="Show on home page" {...register("showOnHome")} />
          <Field label="New tags" error={errors.newTags?.message}>
            <input className={inputClass} placeholder="Comma separated (e.g. community, mall)" {...register("newTags")} />
            <p className="text-xs font-normal text-muted">New tags are created and linked when you save the post.</p>
          </Field>
          <CheckboxGroup label="Branches" options={branches} register={register("branchIds")} />
          <CheckboxGroup label="Tags" options={tags} register={register("tagIds")} />
        </section>

      <section className={cn("grid gap-4 md:grid-cols-2", activeTab !== "seo" && "hidden")}>
          <SeoOptimizationAssistant state={assistantState} className="md:col-span-2" />
          <Field label="SEO title">
            <input className={inputClass} {...register("seo.seoTitle")} />
          </Field>
          <Field label="Canonical URL">
            <input className={inputClass} placeholder="Defaults to post URL" {...register("seo.canonicalUrl")} />
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
          <CheckboxGroup label="Related posts" options={posts} register={register("relatedPostIds")} />
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
                <input className={inputClass} placeholder="https://example.com/en/news/post" {...register(`alternates.${index}.url`)} />
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

    <ContentPreviewPanel
      type="post"
      title={previewTitle}
      subtitle={previewSubtitle}
      excerpt={previewExcerpt}
      content={previewContent}
      featuredImage={previewFeaturedImage}
      coverImageAlt={previewCoverImageAlt}
      coverImageCaption={previewCoverImageCaption}
      className="hidden shrink-0 lg:flex"
    />
    </div>
  );
}
