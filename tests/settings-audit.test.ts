import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuditAction, AuditModule } from "@prisma/client";

import { buildDiff } from "@/lib/audit-diff";
import type { CreateAuditLogInput } from "@/lib/audit-log";
import {
  auditLocalizationUpdate,
  auditSiteSettingsUpdate,
  type SettingsAuditDependencies,
} from "@/lib/settings-audit";
import { LOCALIZATION_SETTING_ID } from "@/lib/localization-settings";

const context = {
  ipAddress: "203.0.113.20",
  userAgent: "Settings audit test agent",
};

const user = {
  id: "user-1",
  name: "Admin User",
  role: "ADMIN" as const,
};

function captureAuditInput(): {
  dependencies: SettingsAuditDependencies;
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

describe("settings audit handlers", () => {
  it("audits site settings updates with the actor and before/after values", async () => {
    const capture = captureAuditInput();
    const before = { siteTagline: "Old tagline" };
    const after = { siteTagline: "New tagline" };

    await auditSiteSettingsUpdate({ user, before, after }, capture.dependencies);

    assert.deepEqual(capture.getInput(), {
      user,
      action: AuditAction.UPDATE,
      module: AuditModule.SETTINGS,
      entityType: "SiteSettings",
      entityName: "Site Settings",
      before,
      after,
      context,
    });
  });

  it("audits localization updates with the fixed entity id and labels", async () => {
    const capture = captureAuditInput();
    const before = { timezone: "Asia/Bangkok", currency: "THB" };
    const after = { timezone: "Asia/Tokyo", currency: "JPY" };

    await auditLocalizationUpdate({ user, before, after }, capture.dependencies);

    assert.deepEqual(capture.getInput(), {
      user,
      action: AuditAction.UPDATE,
      module: AuditModule.LOCALIZATION,
      entityId: LOCALIZATION_SETTING_ID,
      entityType: "LocalizationSetting",
      entityName: "Localization Settings",
      before,
      after,
      context,
    });
  });

  it("uses a null actor when the session has no user", async () => {
    const capture = captureAuditInput();

    await auditSiteSettingsUpdate(
      { user: null, before: { siteTagline: "Old" }, after: { siteTagline: "New" } },
      capture.dependencies,
    );

    assert.equal(capture.getInput()?.user, null);
  });

  it("masks sensitive settings-shaped fields in the resulting diff", () => {
    assert.deepEqual(
      buildDiff(
        { siteTagline: "Old", smtpPassword: "old-secret" },
        { siteTagline: "New", smtpPassword: "new-secret" },
      ),
      {
        siteTagline: { before: "Old", after: "New" },
        smtpPassword: { changed: true, masked: true },
      },
    );
  });
});
