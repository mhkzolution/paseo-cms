"use client";

import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recaptchaSchema } from "@/validators/content.validator";
import type { RecaptchaFormValues } from "@/validators/content.validator";

type RecaptchaEnvFallback = {
  siteKeyFromEnv: boolean;
  secretKeyFromEnv: boolean;
};

interface RecaptchaFormProps {
  defaultValues: {
    recaptchaSiteKey: string;
    recaptchaSecretKey: string;
  };
  envFallback: RecaptchaEnvFallback;
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
          : "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
      }
    >
      {label}
    </span>
  );
}

export function RecaptchaForm({ defaultValues, envFallback }: RecaptchaFormProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [envStatus, setEnvStatus] = useState(envFallback);
  const resolver = zodResolver(recaptchaSchema) as Resolver<RecaptchaFormValues>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecaptchaFormValues>({
    resolver,
    defaultValues: {
      recaptchaSiteKey: defaultValues.recaptchaSiteKey,
      recaptchaSecretKey: defaultValues.recaptchaSecretKey,
    },
  });

  const siteKeyValue = watch("recaptchaSiteKey") ?? "";
  const secretKeyValue = watch("recaptchaSecretKey") ?? "";

  const onSubmit = async (values: RecaptchaFormValues) => {
    setServerMessage(null);
    setIsSuccess(false);

    const response = await fetch("/api/recaptcha", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerMessage(body?.error ?? "Unable to save reCAPTCHA settings.");
      return;
    }

    const body = (await response.json()) as { envFallback?: RecaptchaEnvFallback };
    if (body.envFallback) setEnvStatus(body.envFallback);

    setIsSuccess(true);
    setServerMessage("reCAPTCHA settings saved.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">สถานะการตั้งค่า</h2>
        <p className="mt-1 text-sm text-muted">
          คีย์ที่บันทึกในระบบมีลำดับความสำคัญสูงกว่าค่าใน environment variable ถ้าเว้นว่างไว้
          ระบบจะใช้ค่าจาก `.env` เป็น fallback
        </p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-background px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Site key</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              <StatusBadge
                active={Boolean(String(siteKeyValue).trim())}
                label={String(siteKeyValue).trim() ? "บันทึกในระบบแล้ว" : "ยังไม่ได้บันทึกในระบบ"}
              />
              <StatusBadge
                active={envStatus.siteKeyFromEnv}
                label={envStatus.siteKeyFromEnv ? "มีใน .env" : "ไม่มีใน .env"}
              />
            </dd>
          </div>

          <div className="rounded-lg border border-border/70 bg-background px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Secret key</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              <StatusBadge
                active={Boolean(String(secretKeyValue).trim())}
                label={String(secretKeyValue).trim() ? "บันทึกในระบบแล้ว" : "ยังไม่ได้บันทึกในระบบ"}
              />
              <StatusBadge
                active={envStatus.secretKeyFromEnv}
                label={envStatus.secretKeyFromEnv ? "มีใน .env" : "ไม่มีใน .env"}
              />
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Google reCAPTCHA v2</h2>
            <a
              href="https://www.google.com/recaptcha/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-paseo-dark hover:underline"
            >
              เปิด Google reCAPTCHA Admin
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          <p className="mt-1 text-sm text-muted">
            ใช้กับแบบฟอร์มพื้นที่เช่า (`/leasing`) เพื่อป้องกันสแปม สร้างคีย์ประเภท Checkbox (v2)
          </p>
        </div>

        <div>
          <label htmlFor="recaptchaSiteKey" className="text-sm font-medium text-foreground">
            Site key
          </label>
          <p className="mt-0.5 text-xs text-muted">คีย์ฝั่งเว็บไซต์ (สาธารณะ) สำหรับ widget ของ Google</p>
          <input
            id="recaptchaSiteKey"
            type="text"
            autoComplete="off"
            spellCheck={false}
            className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="เช่น 6Lc..."
            {...register("recaptchaSiteKey")}
          />
          {errors.recaptchaSiteKey?.message ? (
            <p className="mt-1 text-sm text-destructive">{errors.recaptchaSiteKey.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="recaptchaSecretKey" className="text-sm font-medium text-foreground">
            Secret key
          </label>
          <p className="mt-0.5 text-xs text-muted">คีย์ฝั่งเซิร์ฟเวอร์ สำหรับยืนยัน token — อย่าเปิดเผยต่อสาธารณะ</p>
          <input
            id="recaptchaSecretKey"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="••••••••••••••••"
            {...register("recaptchaSecretKey")}
          />
          {errors.recaptchaSecretKey?.message ? (
            <p className="mt-1 text-sm text-destructive">{errors.recaptchaSecretKey.message}</p>
          ) : null}
        </div>
      </section>

      {serverMessage ? (
        <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>{serverMessage}</p>
      ) : null}

      <div>
        <Button type="submit" isLoading={isSubmitting}>
          Save reCAPTCHA
        </Button>
      </div>
    </form>
  );
}
