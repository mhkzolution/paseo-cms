"use client";

import {
  SeoSectionCard,
  SeoTextField,
  SeoTextareaField,
  type SeoSectionProps,
} from "@/features/settings/seo-form-fields";

interface SeoGeneralSectionProps extends SeoSectionProps {
  allowIndexing: boolean;
  onAllowIndexingChange: (allowIndexing: boolean) => void;
}

export function SeoGeneralSection({
  register,
  errors,
  allowIndexing,
  onAllowIndexingChange,
}: SeoGeneralSectionProps) {
  return (
    <>
      <SeoSectionCard title="General SEO" description="Metadata กลางที่ใช้เป็นค่าเริ่มต้นของทุกหน้า">
        <div className="grid gap-4 md:grid-cols-2">
          <SeoTextField
            name="metaTitle"
            label="Meta title"
            description="ไม่เกิน 70 ตัวอักษร"
            register={register}
            error={errors.metaTitle?.message}
          />
          <SeoTextField
            name="canonicalUrl"
            label="Canonical URL"
            type="url"
            description="เว้นว่างเพื่อใช้ URL ของแต่ละหน้า"
            register={register}
            error={errors.canonicalUrl?.message}
          />
          <SeoTextareaField
            name="metaDescription"
            label="Meta description"
            description="ไม่เกิน 170 ตัวอักษร"
            rows={3}
            register={register}
            error={errors.metaDescription?.message}
            className="md:col-span-2"
          />
          <SeoTextField
            name="ogImage"
            label="Open Graph image"
            description="รูปที่ใช้แสดงเมื่อแชร์ลิงก์"
            register={register}
            error={errors.ogImage?.message}
          />
          <div>
            <label htmlFor="twitterCard" className="text-sm font-medium text-foreground">
              Twitter card
            </label>
            <p className="mt-0.5 text-xs text-muted">รูปแบบการ์ดเมื่อแชร์บน X / Twitter</p>
            <select
              id="twitterCard"
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
              {...register("twitterCard")}
            >
              <option value="summary_large_image">Summary large image</option>
              <option value="summary">Summary</option>
            </select>
            {errors.twitterCard?.message ? (
              <p className="mt-1 text-sm text-destructive">{errors.twitterCard.message}</p>
            ) : null}
          </div>
        </div>
      </SeoSectionCard>

      <SeoSectionCard title="Search Indexing" description="ควบคุมว่าจะให้ search engine เก็บ index เว็บไซต์หรือไม่">
        <input type="hidden" {...register("robots")} />
        <label className="flex items-start gap-3 text-sm">
          <input
            id="allowIndexing"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border text-paseo focus:ring-paseo"
            checked={allowIndexing}
            onChange={(event) => onAllowIndexingChange(event.target.checked)}
          />
          <span>
            <span className="font-medium text-foreground">Allow search indexing</span>
            <span className="mt-0.5 block text-xs text-muted">
              เปิด = <code className="font-mono">index,follow</code> • ปิด ={" "}
              <code className="font-mono">noindex,nofollow</code> (ซ่อนเว็บไซต์ทั้งหมดจากผลการค้นหา)
            </span>
          </span>
        </label>
        {errors.robots?.message ? <p className="mt-1 text-sm text-destructive">{errors.robots.message}</p> : null}
      </SeoSectionCard>
    </>
  );
}
