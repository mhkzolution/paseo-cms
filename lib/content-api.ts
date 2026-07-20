import { NextResponse } from "next/server";
import type { z } from "zod";

export function validationError(error: z.ZodError) {
  return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 422 });
}

export function conflictError(message = "Slug already exists") {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function forbiddenError(status: 401 | 403) {
  return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
}
