import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AuditAction,
  AuditModule,
  AuditSeverity,
  Prisma,
} from "@prisma/client";

import {
  createAuditLog,
  getDefaultSeverity,
  resolveAuditChanges,
} from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

type AuditLogCreate = (args: {
  data: Record<string, unknown>;
}) => Promise<unknown>;

async function withAuditLogCreateStub(
  stub: AuditLogCreate,
  run: () => Promise<void>,
): Promise<void> {
  const delegate = prisma.auditLog as unknown as { create: AuditLogCreate };
  const originalCreate = delegate.create;
  delegate.create = stub;
  try {
    await run();
  } finally {
    delegate.create = originalCreate;
  }
}

describe("getDefaultSeverity", () => {
  it("maps DELETE to WARNING", () => {
    assert.equal(getDefaultSeverity(AuditAction.DELETE), AuditSeverity.WARNING);
  });

  for (const action of [
    AuditAction.CREATE,
    AuditAction.UPDATE,
    AuditAction.LOGIN,
    AuditAction.LOGOUT,
  ]) {
    it(`maps ${action} to INFO`, () => {
      assert.equal(getDefaultSeverity(action), AuditSeverity.INFO);
    });
  }
});

describe("resolveAuditChanges", () => {
  it("uses the explicit changes escape hatch", () => {
    const changes = { title: { before: "a", after: "b" } };
    assert.equal(resolveAuditChanges({ changes }), changes);
  });

  it("preserves explicit null changes", () => {
    assert.equal(
      resolveAuditChanges({
        changes: null,
        before: { title: "a" },
        after: { title: "b" },
      }),
      null,
    );
  });

  it("returns null when changes, before, and after are omitted", () => {
    assert.equal(resolveAuditChanges({}), null);
  });

  it("builds a diff when before or after is provided", () => {
    assert.deepEqual(
      resolveAuditChanges({
        before: { title: "a" },
        after: { title: "b" },
      }),
      { title: { before: "a", after: "b" } },
    );
  });
});

describe("createAuditLog", () => {
  it("preserves a CRITICAL severity override", async () => {
    let capturedData: Record<string, unknown> | undefined;

    await withAuditLogCreateStub(
      async ({ data }) => {
        capturedData = data;
        return {};
      },
      async () => {
        await createAuditLog({
          action: AuditAction.CREATE,
          module: AuditModule.SETTINGS,
          severity: AuditSeverity.CRITICAL,
        });
      },
    );

    assert.equal(capturedData?.severity, AuditSeverity.CRITICAL);
  });

  it("fails open and reports audit write failures", async () => {
    const originalConsoleError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };

    try {
      await withAuditLogCreateStub(
        async () => {
          throw new Error("database unavailable");
        },
        async () => {
          await assert.doesNotReject(
            createAuditLog({
              action: AuditAction.UPDATE,
              module: AuditModule.POSTS,
              entityId: "post-1",
            }),
          );
        },
      );
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.[0], "[audit] failed to write audit log");
  });

  for (const action of [AuditAction.LOGIN, AuditAction.LOGOUT]) {
    it(`stores null changes for ${action} without before or after`, async () => {
      let capturedData: Record<string, unknown> | undefined;

      await withAuditLogCreateStub(
        async ({ data }) => {
          capturedData = data;
          return {};
        },
        async () => {
          await createAuditLog({
            action,
            module: AuditModule.AUTH,
          });
        },
      );

      assert.equal(capturedData?.changes, Prisma.JsonNull);
    });
  }
});
