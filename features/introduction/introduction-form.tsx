"use client";

import { useRef, useState } from "react";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { MediaPickerDialog } from "@/features/media/media-picker-dialog";
import { introductionSchema } from "@/validators/content.validator";
import type { IntroductionFormValues } from "@/validators/content.validator";

const RICH_TEXT_FIELDS = [
  { name: "aboutDetail1", label: "รายละเอียด 1" },
  { name: "aboutDetail2", label: "รายละเอียด 2" },
  { name: "aboutDetail3", label: "รายละเอียด 3" },
  { name: "aboutDetail4", label: "รายละเอียด 4" },
  { name: "aboutMission", label: "พันธกิจ (Our Mission)" },
  { name: "aboutVision", label: "วิสัยทัศน์ (Our Vision)" },
] as const satisfies ReadonlyArray<{ name: keyof IntroductionFormValues; label: string }>;

interface IntroductionFormProps {
  defaultValues: IntroductionFormValues;
}

export function IntroductionForm({ defaultValues }: IntroductionFormProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editorImagePickerOpen, setEditorImagePickerOpen] = useState(false);
  const [editorImagePickerMode, setEditorImagePickerMode] = useState<"single" | "multi">("single");
  const editorImageResolver = useRef<((value: string | null) => void) | null>(null);
  const editorImagesResolver = useRef<((value: string[] | null) => void) | null>(null);
  const resolver = zodResolver(introductionSchema) as Resolver<IntroductionFormValues>;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IntroductionFormValues>({ resolver, defaultValues });

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

  const onSubmit = async (values: IntroductionFormValues) => {
    setServerMessage(null);
    setIsSuccess(false);

    const response = await fetch("/api/settings/introduction", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerMessage(body?.error ?? "Unable to save introduction content.");
      return;
    }

    setIsSuccess(true);
    setServerMessage("บันทึกเนื้อหาเรียบร้อยแล้ว");
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-4xl gap-8">
        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">About logo</h2>
            <p className="mt-1 text-sm text-muted">รูปโลโก้ที่แสดงในหน้า About us (/about)</p>
          </div>

          <Controller
            name="aboutLogo"
            control={control}
            render={({ field }) => (
              <CoverImageField
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
              />
            )}
          />
        </section>

        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">เนื้อหา About us</h2>
            <p className="mt-1 text-sm text-muted">รายละเอียด, พันธกิจ และวิสัยทัศน์ — รองรับตัวหนา, ลิงก์ และรายการ</p>
          </div>

          {RICH_TEXT_FIELDS.map((field) => (
            <div key={field.name}>
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

        {serverMessage ? (
          <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>{serverMessage}</p>
        ) : null}

        <div>
          <Button type="submit" isLoading={isSubmitting}>
            บันทึกเนื้อหา
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
