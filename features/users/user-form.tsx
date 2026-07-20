"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/validators/user.validator";

const ROLE_OPTIONS = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING", "VIEWER"] as const;
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
  defaultValues?: Partial<CreateUserInput>;
}

export function UserForm({ mode, userId, defaultValues }: UserFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = mode === "create" ? createUserSchema : updateUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      password: "",
      role: defaultValues?.role ?? "VIEWER",
      status: defaultValues?.status ?? "ACTIVE",
    },
  });

  const onSubmit = async (values: CreateUserInput | UpdateUserInput) => {
    setServerError(null);

    const endpoint = mode === "create" ? "/api/users" : `/api/users/${userId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    // Don't send an empty password on edit — the API treats omission as "keep current".
    const payload =
      mode === "edit" && !values.password
        ? { ...values, password: undefined }
        : values;

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/admin/users");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("name")}
        />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("email")}
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {mode === "create" ? "Password" : "New password"}
        </label>
        <input
          id="password"
          type="password"
          placeholder={mode === "edit" ? "Leave blank to keep current password" : undefined}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-foreground">
            Role
          </label>
          <select
            id="role"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register("role")}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-foreground">
            Status
          </label>
          <select
            id="status"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register("status")}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <Button type="submit" isLoading={isSubmitting}>
        {mode === "create" ? "Create user" : "Save changes"}
      </Button>
    </form>
  );
}
