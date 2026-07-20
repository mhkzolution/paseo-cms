import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "MARKETING" | "VIEWER";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "MARKETING" | "VIEWER";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "MARKETING" | "VIEWER";
  }
}
