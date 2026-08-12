import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuditAction, AuditModule } from "@prisma/client";

import { buildDiff } from "@/lib/audit-diff";
import type { CreateAuditLogInput } from "@/lib/audit-log";
import { DEFAULT_SEO, normalizeSeoSettingsValues } from "@/lib/settings";
import {
  auditLocalizationUpdate,
  auditSeoSettingsUpdate,
  auditSiteSettingsUpdate,
  type SettingsAuditDependencies,
} from "@/lib/settings-audit";
import { LOCALIZATION_SETTING_ID } from "@/lib/localization-settings";
import { seoSchema } from "@/validators/content.validator";

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

  it("audits SEO settings updates under AuditModule.SEO", async () => {
    const capture = captureAuditInput();
    const before = { organizationPhone: "" };
    const after = { organizationPhone: "02-123-4567" };

    await auditSeoSettingsUpdate({ user, before, after }, capture.dependencies);

    assert.deepEqual(capture.getInput(), {
      user,
      action: AuditAction.UPDATE,
      module: AuditModule.SEO,
      entityType: "SeoSettings",
      entityName: "SEO Settings",
      before,
      after,
      context,
    });
  });

  it("stores only changed SEO fields in diff", () => {
    const diff = buildDiff(
      {
        metaTitle: "The Paseo",
        metaDescription: "Same",
        organizationPhone: "",
      },
      {
        metaTitle: "The Paseo",
        metaDescription: "Same",
        organizationPhone: "02-123-4567",
      },
    );

    assert.deepEqual(diff, {
      organizationPhone: { before: "", after: "02-123-4567" },
    });
  });

  it("normalizes parsed empty SEO values before building audit diffs", () => {
    const changed = normalizeSeoSettingsValues(
      seoSchema.parse({ ...DEFAULT_SEO, organizationPhone: "02-123-4567" }),
    );

    assert.deepEqual(buildDiff(DEFAULT_SEO, changed), {
      organizationPhone: { before: "", after: "02-123-4567" },
    });

    const unchanged = normalizeSeoSettingsValues(seoSchema.parse({ ...DEFAULT_SEO }));
    assert.equal(buildDiff(DEFAULT_SEO, unchanged), null);
  });

  it("marks jsonLd and customOrganizationSchema as long-text diffs", () => {
    assert.deepEqual(
      buildDiff({ jsonLd: "{}" }, { jsonLd: '{"@type":"Thing"}' }),
      { jsonLd: { changed: true } },
    );
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
