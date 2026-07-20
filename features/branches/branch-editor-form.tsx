"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { branchSchema } from "@/validators/content.validator";

type BranchFormValues = z.input<typeof branchSchema>;

interface BranchEditorFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  defaultValues: BranchFormValues;
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function BranchEditorForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  defaultValues,
}: BranchEditorFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const resolver = zodResolver(branchSchema) as Resolver<BranchFormValues>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({ resolver, defaultValues });

  const onSubmit = async (values: BranchFormValues) => {
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
        <label htmlFor="nameTh" className="text-sm font-medium text-foreground">
          ชื่อภาษาไทย
        </label>
        <input id="nameTh" type="text" className={`mt-1.5 ${inputClass}`} {...register("nameTh")} />
        {errors.nameTh?.message ? <p className="mt-1 text-sm text-destructive">{errors.nameTh.message}</p> : null}
      </div>

      <div>
        <label htmlFor="nameEn" className="text-sm font-medium text-foreground">
          ชื่อภาษาอังกฤษ
        </label>
        <input id="nameEn" type="text" className={`mt-1.5 ${inputClass}`} {...register("nameEn")} />
        {errors.nameEn?.message ? <p className="mt-1 text-sm text-destructive">{errors.nameEn.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label htmlFor="slug" className="text-sm font-medium text-foreground">
          Slug
        </label>
        <input id="slug" type="text" className={`mt-1.5 ${inputClass}`} {...register("slug")} />
        {errors.slug?.message ? <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground">Logo</label>
        <p className="mt-1 text-xs text-muted">ใช้ใน footer และจุดที่ต้องการโลโก้สาขา</p>
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
        <label className="text-sm font-medium text-foreground">รูปภาพ Thumbnail</label>
        <p className="mt-1 text-xs text-muted">รูปภาพสาขาสำหรับหน้ารู้จักเรา (ไม่ใช่โลโก้)</p>
        <div className="mt-1.5">
          <Controller
            name="thumbnail"
            control={control}
            render={({ field }) => (
              <CoverImageField
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        {errors.thumbnail?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.thumbnail.message}</p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label htmlFor="shortDescription" className="text-sm font-medium text-foreground">
          รายละเอียดสั้นๆ
        </label>
        <textarea
          id="shortDescription"
          rows={3}
          className={`mt-1.5 ${inputClass}`}
          placeholder="คำอธิบายสั้นๆ ของสาขาสำหรับหน้ารู้จักเรา"
          {...register("shortDescription")}
        />
        {errors.shortDescription?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.shortDescription.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-medium text-foreground">
          Phone
        </label>
        <input id="phone" type="text" className={`mt-1.5 ${inputClass}`} {...register("phone")} />
      </div>

      <div>
        <label htmlFor="leasingPhone1" className="text-sm font-medium text-foreground">
          เบอร์ติดต่อเช่าพื้นที่ 1
        </label>
        <input
          id="leasingPhone1"
          type="text"
          className={`mt-1.5 ${inputClass}`}
          {...register("leasingPhone1")}
        />
      </div>

      <div>
        <label htmlFor="leasingPhone2" className="text-sm font-medium text-foreground">
          เบอร์ติดต่อเช่าพื้นที่ 2
        </label>
        <input
          id="leasingPhone2"
          type="text"
          className={`mt-1.5 ${inputClass}`}
          {...register("leasingPhone2")}
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="mapsUrl" className="text-sm font-medium text-foreground">
          Google Maps link
        </label>
        <input
          id="mapsUrl"
          type="url"
          placeholder="https://maps.google.com/..."
          className={`mt-1.5 ${inputClass}`}
          {...register("mapsUrl")}
        />
        <p className="mt-1 text-xs text-muted">ลิงก์ Google Maps สำหรับเปิดแผนที่สาขา</p>
        {errors.mapsUrl?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.mapsUrl.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="latitude" className="text-sm font-medium text-foreground">
          Latitude
        </label>
        <input
          id="latitude"
          type="number"
          step="any"
          className={`mt-1.5 ${inputClass}`}
          {...register("latitude")}
        />
        {errors.latitude?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.latitude.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="longitude" className="text-sm font-medium text-foreground">
          Longitude
        </label>
        <input
          id="longitude"
          type="number"
          step="any"
          className={`mt-1.5 ${inputClass}`}
          {...register("longitude")}
        />
        {errors.longitude?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.longitude.message}</p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label htmlFor="address" className="text-sm font-medium text-foreground">
          Address
        </label>
        <textarea id="address" rows={4} className={`mt-1.5 ${inputClass}`} {...register("address")} />
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
