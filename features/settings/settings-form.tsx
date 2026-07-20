"use client";

import { useRef, useState } from "react";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { MediaPickerDialog } from "@/features/media/media-picker-dialog";
import { settingsSchema } from "@/validators/content.validator";
import type { SettingsFormValues } from "@/validators/content.validator";

const TEXT_FIELDS = [
  { name: "siteName", label: "Site name", type: "text" },
  { name: "siteUrl", label: "Site URL", type: "url" },
  { name: "contactEmail", label: "Contact email", type: "email" },
  { name: "contactPhone", label: "Contact phone", type: "text" },
  { name: "facebookUrl", label: "Facebook URL", type: "url" },
  { name: "instagramUrl", label: "Instagram URL", type: "url" },
  { name: "tiktokUrl", label: "TikTok URL", type: "url" },
  { name: "lineUrl", label: "LINE URL", type: "url" },
] as const;

const RICH_TEXT_FIELDS = [
  { name: "aboutDetail1", label: "รายละเอียด 1" },
  { name: "aboutDetail2", label: "รายละเอียด 2" },
  { name: "aboutDetail3", label: "รายละเอียด 3" },
  { name: "aboutDetail4", label: "รายละเอียด 4" },
  { name: "aboutMission", label: "พันธกิจ (Our Mission)" },
  { name: "aboutVision", label: "วิสัยทัศน์ (Our Vision)" },
] as const satisfies ReadonlyArray<{ name: keyof SettingsFormValues; label: string }>;

const IMAGE_FIELDS = [
  { name: "siteLogo", label: "Site logo", description: "แสดงที่ header ของเว็บไซต์" },
  { name: "favicon", label: "Favicon", description: "ไอคอนแท็บเบราว์เซอร์" },
  { name: "aboutLogo", label: "About logo", description: "รูปโลโก้ในหน้า About us" },
] as const satisfies ReadonlyArray<{ name: keyof SettingsFormValues; label: string; description: string }>;

interface SettingsFormProps {
  defaultValues: SettingsFormValues;
}

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editorImagePickerOpen, setEditorImagePickerOpen] = useState(false);
  const [editorImagePickerMode, setEditorImagePickerMode] = useState<"single" | "multi">("single");
  const editorImageResolver = useRef<((value: string | null) => void) | null>(null);
  const editorImagesResolver = useRef<((value: string[] | null) => void) | null>(null);
  const resolver = zodResolver(settingsSchema) as Resolver<SettingsFormValues>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({ resolver, defaultValues });

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

  const onSubmit = async (values: SettingsFormValues) => {
    setServerMessage(null);
    setIsSuccess(false);

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerMessage(body?.error ?? "Unable to save settings.");
      return;
    }

    setIsSuccess(true);
    setServerMessage("Settings saved.");
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-4xl gap-10">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">Site identity</h2>
            <p className="mt-1 text-sm text-muted">โลโก้เว็บไซต์, favicon และข้อมูลพื้นฐาน</p>
          </div>

          {IMAGE_FIELDS.map((field) => (
            <div key={field.name} className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">{field.label}</label>
              <p className="mt-0.5 text-xs text-muted">{field.description}</p>
              <div className="mt-1.5">
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: formField }) => (
                    <CoverImageField
                      value={typeof formField.value === "string" ? formField.value : ""}
                      onChange={formField.onChange}
                    />
                  )}
                />
              </div>
            </div>
          ))}

          {TEXT_FIELDS.slice(0, 2).map((field) => {
            const error = errors[field.name]?.message;
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <div className="mt-1.5">
                  <input
                    id={field.name}
                    type={field.type}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    {...register(field.name)}
                  />
                </div>
                {typeof error === "string" ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">About us</h2>
            <p className="mt-1 text-sm text-muted">เนื้อหาหน้า /about — รองรับตัวหนา, ลิงก์ และรายการ</p>
          </div>

          {RICH_TEXT_FIELDS.map((field) => (
            <div key={field.name} className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">{field.label}</label>
              <div className="mt-1.5">
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: formField }) => (
                    <RichTextEditor
                      value={typeof formField.value === "string" ? formField.value : ""}
                      onChange={formField.onChange}
                      onPickImage={pickEditorImage}
                      onPickImages={pickEditorImages}
                    />
                  )}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">Contact & social</h2>
            <p className="mt-1 text-sm text-muted">ที่อยู่, เวลาทำการ และช่องทางติดต่อ</p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="text-sm font-medium text-foreground">
              ที่อยู่
            </label>
            <textarea
              id="address"
              rows={4}
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register("address")}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="businessHours" className="text-sm font-medium text-foreground">
              เวลาทำการ
            </label>
            <textarea
              id="businessHours"
              rows={3}
              placeholder="เช่น จันทร์–อาทิตย์ 10:00–22:00 น."
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register("businessHours")}
            />
          </div>

          {TEXT_FIELDS.slice(2).map((field) => {
            const error = errors[field.name]?.message;
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <div className="mt-1.5">
                  <input
                    id={field.name}
                    type={field.type}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    {...register(field.name)}
                  />
                </div>
                {typeof error === "string" ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
              </div>
            );
          })}
        </section>

        {serverMessage ? (
          <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>{serverMessage}</p>
        ) : null}

        <div>
          <Button type="submit" isLoading={isSubmitting}>
            Save settings
          </Button>
        </div>
      </form>

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
        title={editorImagePickerMode === "multi" ? "Insert gallery" : "Choose image"}
      />
    </>
  );
}
