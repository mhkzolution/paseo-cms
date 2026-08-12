import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuditAction, AuditModule, type Role } from "@prisma/client";

import {
  auditAuthSignIn,
  auditAuthSignOut,
  type AuthAuditDependencies,
} from "@/lib/auth-audit";
import type { CreateAuditLogInput } from "@/lib/audit-log";

const context = {
  ipAddress: "203.0.113.10",
  userAgent: "Audit test agent",
};

function captureAuditInput(): {
  dependencies: AuthAuditDependencies;
  getInput: () => CreateAuditLogInput | undefined;
} {
  let input: CreateAuditLogInput | undefined;

  return {
    dependencies: {
      createAuditLog: async (value) => {
        input = value;
      },
      getAuditRequestContext: async () => context,
    },
    getInput: () => input,
  };
}

describe("auth audit handlers", () => {
  it("writes LOGIN with the real actor and request context", async () => {
    const capture = captureAuditInput();

    await auditAuthSignIn(
      {
        user: {
          id: "user-1",
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
        },
      },
      capture.dependencies,
    );

    assert.deepEqual(capture.getInput(), {
      user: {
        id: "user-1",
        name: "Admin User",
        role: "ADMIN",
      },
      action: AuditAction.LOGIN,
      module: AuditModule.AUTH,
      context,
    });
  });

  it("writes LOGOUT with the actor resolved from the token", async () => {
    const capture = captureAuditInput();

    await auditAuthSignOut(
      {
        token: {
          id: "user-2",
          name: "Editor User",
          role: "EDITOR" satisfies Role,
        },
      },
      capture.dependencies,
    );

    assert.deepEqual(capture.getInput(), {
      user: {
        id: "user-2",
        name: "Editor User",
        role: "EDITOR",
      },
      action: AuditAction.LOGOUT,
      module: AuditModule.AUTH,
      context,
    });
  });

  it("writes LOGOUT with a null actor when the token has no usable id", async () => {
    const capture = captureAuditInput();

    await auditAuthSignOut({ token: null }, capture.dependencies);

    assert.deepEqual(capture.getInput(), {
      user: null,
      action: AuditAction.LOGOUT,
      module: AuditModule.AUTH,
      context,
    });
  });

  it("omits before and after so auth changes remain null", async () => {
    const capture = captureAuditInput();

    await auditAuthSignOut({ token: null }, capture.dependencies);

    const input = capture.getInput();
    assert.ok(input);
    assert.equal("before" in input, false);
    assert.equal("after" in input, false);
    assert.equal("changes" in input, false);
  });
});
