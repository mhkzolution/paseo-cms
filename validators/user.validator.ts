import { z } from "zod";

const ROLE_VALUES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING", "VIEWER"] as const;
const STATUS_VALUES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ROLE_VALUES),
  status: z.enum(STATUS_VALUES),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.union([z.string().min(8, "Password must be at least 8 characters"), z.literal("")]),
  role: z.enum(ROLE_VALUES),
  status: z.enum(STATUS_VALUES),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
