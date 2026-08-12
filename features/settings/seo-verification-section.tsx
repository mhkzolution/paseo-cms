"use client";

import { SeoSectionCard, SeoTextField, type SeoSectionProps } from "@/features/settings/seo-form-fields";

export function SeoVerificationSection({ register, errors }: SeoSectionProps) {
  return (
    <SeoSectionCard
      title="Verification"
      description="วาง content value จาก Google Search Console / Bing Webmaster Tools — เว้นว่างเพื่อไม่ให้แสดง meta tag"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SeoTextField
          name="googleVerification"
          label="Google site verification"
          placeholder="abc123DEF456..."
          register={register}
          error={errors.googleVerification?.message}
        />
        <SeoTextField
          name="bingVerification"
          label="Bing site verification"
          placeholder="1A2B3C4D5E..."
          register={register}
          error={errors.bingVerification?.message}
        />
      </div>
    </SeoSectionCard>
  );
}
