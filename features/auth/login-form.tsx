"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginInput } from "@/validators/auth.validator";

const inputClassName =
  "h-[52px] w-full rounded-lg border border-border bg-surface pl-11 pr-3 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus-visible:border-paseo focus-visible:ring-[3px] focus-visible:ring-paseo/25";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);

    const { signIn } = await import("next-auth/react");
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Invalid email or password");
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={cn(inputClassName, errors.email && "border-destructive focus-visible:ring-destructive/25")}
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className={cn(
              inputClassName,
              "pr-12",
              errors.password && "border-destructive focus-visible:ring-destructive/25",
            )}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="mt-1 h-[52px] w-full rounded-lg text-[15px] font-semibold shadow-sm transition-colors hover:shadow-md"
      >
        Sign In
      </Button>
    </form>
  );
}
