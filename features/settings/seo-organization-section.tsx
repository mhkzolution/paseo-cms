"use client";

import { SeoSectionCard, SeoTextField, type SeoSectionProps } from "@/features/settings/seo-form-fields";

export function SeoOrganizationSection({ register, errors }: SeoSectionProps) {
  return (
    <SeoSectionCard
      title="Organization"
      description="ต้องกรอก Name และ URL เพื่อให้ระบบสร้าง Organization schema — ฟิลด์อื่นเป็นตัวเลือกเสริม"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SeoTextField
          name="organizationName"
          label="Name"
          description="จำเป็นสำหรับสร้าง schema"
          register={register}
          error={errors.organizationName?.message}
        />
        <SeoTextField
          name="organizationUrl"
          label="URL"
          description="จำเป็นสำหรับสร้าง schema"
          placeholder="https://thepaseo.co.th"
          register={register}
          error={errors.organizationUrl?.message}
        />
        <SeoTextField
          name="organizationLogo"
          label="Logo URL"
          placeholder="https://thepaseo.co.th/logo.png"
          register={register}
          error={errors.organizationLogo?.message}
        />
        <SeoTextField
          name="organizationPhone"
          label="Phone"
          placeholder="+66 2 000 0000"
          register={register}
          error={errors.organizationPhone?.message}
        />
        <SeoTextField
          name="organizationEmail"
          label="Email"
          placeholder="contact@thepaseo.co.th"
          register={register}
          error={errors.organizationEmail?.message}
        />
      </div>
    </SeoSectionCard>
  );
}
