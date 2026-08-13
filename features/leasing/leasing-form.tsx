"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { trackEvent } from "@/components/integrations/events/track-event";
import { Button } from "@/components/ui/button";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import type { BranchRecord } from "@/lib/branches/types";
import { cn } from "@/lib/utils";
import { leasingSchema } from "@/validators/content.validator";

const inputClass =
  "w-full rounded-lg border border-[#D8D0C4] bg-white px-4 py-2.5 text-[15px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#688E22] focus:ring-2 focus:ring-[#688E22]/20";

type LeasingFormValues = z.input<typeof leasingSchema>;

type LeasingFormProps = {
  branches: BranchRecord[];
  recaptchaSiteKey: string;
};

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void },
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

export function LeasingForm({ branches, recaptchaSiteKey }: LeasingFormProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeasingFormValues>({
    resolver: zodResolver(leasingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      details: "",
      branchId: branches[0]?.id ?? "",
      productCategory: "",
      productDetails: "",
      recaptchaToken: recaptchaSiteKey ? "" : "dev-bypass",
    },
  });

  const renderRecaptcha = useCallback(() => {
    if (!recaptchaSiteKey || !scriptReady || !recaptchaRef.current || recaptchaWidgetId !== null) return;
    if (!window.grecaptcha) return;

    const widgetId = window.grecaptcha.render(recaptchaRef.current, {
      sitekey: recaptchaSiteKey,
      callback: (token: string) => setValue("recaptchaToken", token, { shouldValidate: true }),
      "expired-callback": () => setValue("recaptchaToken", "", { shouldValidate: true }),
    });
    setRecaptchaWidgetId(widgetId);
  }, [recaptchaSiteKey, recaptchaWidgetId, scriptReady, setValue]);

  useEffect(() => {
    renderRecaptcha();
  }, [renderRecaptcha]);

  const resetRecaptcha = useCallback(() => {
    if (recaptchaWidgetId !== null && window.grecaptcha) {
      window.grecaptcha.reset(recaptchaWidgetId);
    }
    setValue("recaptchaToken", recaptchaSiteKey ? "" : "dev-bypass", { shouldValidate: false });
  }, [recaptchaSiteKey, recaptchaWidgetId, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitState("idle");
    setSubmitError(null);

    const response = await fetch("/api/leasing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setSubmitState("error");
      setSubmitError(payload?.error ?? "ไม่สามารถส่งแบบฟอร์มได้ กรุณาลองใหม่อีกครั้ง");
      resetRecaptcha();
      return;
    }

    trackEvent("form_submit", { formId: "leasing" });
    setSubmitState("success");
    reset();
    resetRecaptcha();
  });

  if (submitState === "success") {
    return (
      <div className="rounded-2xl border border-[#C8E6C9] bg-[#F1F8E9] px-6 py-10 text-center sm:px-10">
        <p className="text-lg font-semibold text-[#2E7D32]">ส่งแบบฟอร์มเรียบร้อยแล้ว</p>
        <p className="mt-2 text-[15px] leading-7 text-[#4B5563]">
          ขอบคุณที่สนใจเช่าพื้นที่กับเดอะพาซิโอ ทีมงานจะติดต่อกลับทางอีเมลหรือเบอร์โทรที่ระบุโดยเร็วที่สุด
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6 border-[#D8D0C4] bg-white"
          onClick={() => setSubmitState("idle")}
        >
          ส่งแบบฟอร์มอีกครั้ง
        </Button>
      </div>
    );
  }

  return (
    <>
      {recaptchaSiteKey ? (
        <Script
          src="https://www.google.com/recaptcha/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <h2 className="text-xl font-semibold text-[#1F2937] sm:text-2xl">สนใจพื้นที่ขายกรุณากรอกแบบฟอร์ม</h2>
          <p className="mt-2 text-[15px] leading-7 text-[#6B7280]">
            กรอกข้อมูลให้ครบถ้วน ทีมงานจะติดต่อกลับเพื่อพูดคุยรายละเอียดการเช่าพื้นที่
          </p>
        </div>

        <div>
          <label htmlFor="leasing-name" className="text-sm font-medium text-[#374151]">
            ชื่อ <span className="text-[#C8102E]">*</span>
          </label>
          <input id="leasing-name" type="text" autoComplete="name" className={cn("mt-1.5", inputClass)} {...register("name")} />
          {errors.name ? <p className="mt-1 text-sm text-[#C8102E]">{errors.name.message}</p> : null}
        </div>

        <div>
          <label htmlFor="leasing-email" className="text-sm font-medium text-[#374151]">
            อีเมล <span className="text-[#C8102E]">*</span>
          </label>
          <input
            id="leasing-email"
            type="email"
            autoComplete="email"
            className={cn("mt-1.5", inputClass)}
            {...register("email")}
          />
          {errors.email ? <p className="mt-1 text-sm text-[#C8102E]">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="leasing-phone" className="text-sm font-medium text-[#374151]">
            เบอร์โทรศัพท์ <span className="text-[#C8102E]">*</span>
          </label>
          <input
            id="leasing-phone"
            type="tel"
            autoComplete="tel"
            className={cn("mt-1.5", inputClass)}
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1 text-sm text-[#C8102E]">{errors.phone.message}</p> : null}
        </div>

        <div>
          <label htmlFor="leasing-branch" className="text-sm font-medium text-[#374151]">
            สาขาที่ต้องการเช่า <span className="text-[#C8102E]">*</span>
          </label>
          <select id="leasing-branch" className={cn("mt-1.5", inputClass)} {...register("branchId")}>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {getBranchThaiName(branch)}
              </option>
            ))}
          </select>
          {errors.branchId ? <p className="mt-1 text-sm text-[#C8102E]">{errors.branchId.message}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="leasing-details" className="text-sm font-medium text-[#374151]">
            รายละเอียด
          </label>
          <textarea id="leasing-details" rows={3} className={cn("mt-1.5", inputClass)} {...register("details")} />
          {errors.details ? <p className="mt-1 text-sm text-[#C8102E]">{errors.details.message}</p> : null}
        </div>

        <div>
          <label htmlFor="leasing-product-category" className="text-sm font-medium text-[#374151]">
            ประเภทสินค้าที่ต้องการขาย <span className="text-[#C8102E]">*</span>
          </label>
          <input
            id="leasing-product-category"
            type="text"
            placeholder="เช่น แฟชั่น, อาหารและเครื่องดื่ม"
            className={cn("mt-1.5", inputClass)}
            {...register("productCategory")}
          />
          {errors.productCategory ? (
            <p className="mt-1 text-sm text-[#C8102E]">{errors.productCategory.message}</p>
          ) : null}
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="leasing-product-details" className="text-sm font-medium text-[#374151]">
            รายละเอียดสินค้า <span className="text-[#C8102E]">*</span>
          </label>
          <textarea
            id="leasing-product-details"
            rows={4}
            placeholder="อธิบายสินค้า แบรนด์ หรือแนวคิดร้านค้า"
            className={cn("mt-1.5", inputClass)}
            {...register("productDetails")}
          />
          {errors.productDetails ? (
            <p className="mt-1 text-sm text-[#C8102E]">{errors.productDetails.message}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          {recaptchaSiteKey ? (
            <div>
              <div ref={recaptchaRef} />
              {errors.recaptchaToken ? (
                <p className="mt-2 text-sm text-[#C8102E]">{errors.recaptchaToken.message}</p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[#D8D0C4] bg-[#FAF9F6] px-4 py-3 text-sm text-[#6B7280]">
              reCAPTCHA ยังไม่ได้ตั้งค่า — โหมดพัฒนา: สามารถส่งแบบฟอร์มได้โดยไม่ต้องยืนยัน
            </p>
          )}
        </div>

        {submitError ? (
          <p className="sm:col-span-2 text-sm text-[#C8102E]" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={branches.length === 0}
            className="h-11 min-w-[140px] rounded-full bg-[#1a1a1a] px-8 hover:bg-black"
          >
            ส่ง
          </Button>
        </div>
      </form>
    </>
  );
}
