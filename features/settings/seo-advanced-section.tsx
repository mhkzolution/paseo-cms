"use client";

import { AlertTriangle } from "lucide-react";

import { SeoSectionCard, SeoTextareaField, type SeoSectionProps } from "@/features/settings/seo-form-fields";

export function SeoAdvancedSection({ register, errors }: SeoSectionProps) {
  return (
    <SeoSectionCard title="Advanced" description="สำหรับผู้ที่คุ้นเคยกับ structured data — ต้องเป็น JSON ที่ถูกต้อง">
      <div className="grid gap-4">
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Organization schema is managed in the Organization section. Custom JSON-LD below is a global override and may
            duplicate structured data if both are set.
          </p>
        </div>

        <SeoTextareaField
          name="customOrganizationSchema"
          label="Custom Organization Schema"
          description="แทนที่ Organization schema ที่ระบบสร้างให้ — ต้องเป็น JSON object"
          rows={8}
          monospace
          register={register}
          error={errors.customOrganizationSchema?.message}
        />

        <SeoTextareaField
          name="jsonLd"
          label="Global JSON-LD Override"
          description="JSON-LD เพิ่มเติมที่ฝังในทุกหน้า"
          rows={8}
          monospace
          register={register}
          error={errors.jsonLd?.message}
        />
      </div>
    </SeoSectionCard>
  );
}
