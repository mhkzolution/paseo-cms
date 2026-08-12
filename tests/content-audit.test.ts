import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuditAction, AuditModule } from "@prisma/client";

import type { CreateAuditLogInput } from "@/lib/audit-log";
import {
  auditContentCreate,
  auditContentDelete,
  auditContentUpdate,
  type ContentAuditDependencies,
} from "@/lib/content-audit";

const user = { id: "user-1", name: "Editor", role: "EDITOR" as const };
const context = { ipAddress: "203.0.113.30", userAgent: "Content audit test" };
const before = {
  id: "post-1",
  title: "Old title",
  slug: "old-title",
  status: "DRAFT",
  seo: { seoTitle: "Old SEO" },
};
const after = {
  id: "post-1",
  title: "New title",
  slug: "new-title",
  status: "PUBLISHED",
  seo: { seoTitle: "New SEO" },
};

function captureAuditInputs(): {
  dependencies: ContentAuditDependencies;
  inputs: CreateAuditLogInput[];
} {
  const inputs: CreateAuditLogInput[] = [];
  return {
    dependencies: {
      createAuditLog: async (input) => {
        inputs.push(input);
      },
      getAuditRequestContext: async () => context,
    },
    inputs,
  };
}

describe("content audit handlers", () => {
  it("audits a create exactly once with an after snapshot", async () => {
    const capture = captureAuditInputs();

    await auditContentCreate(
      { user, module: AuditModule.POSTS, entityType: "Post", entity: after },
      capture.dependencies,
    );

    assert.equal(capture.inputs.length, 1);
    assert.deepEqual(capture.inputs[0], {
      user,
      action: AuditAction.CREATE,
      module: AuditModule.POSTS,
      entityId: "post-1",
      entityType: "Post",
      entityName: "New title",
      entitySlug: "new-title",
      before: null,
      after: {
        title: "New title",
        slug: "new-title",
        excerpt: null,
        subtitle: null,
        status: "PUBLISHED",
        publishedAt: null,
        featuredImage: null,
        seoTitle: "New SEO",
        seoDescription: null,
        focusKeyword: null,
        canonicalUrl: null,
        noindex: null,
        nofollow: null,
      },
      context,
    });
  });

  it("resolves publish and audits an update exactly once", async () => {
    const capture = captureAuditInputs();

    await auditContentUpdate(
      { user, module: AuditModule.POSTS, entityType: "Post", before, after },
      capture.dependencies,
    );

    assert.equal(capture.inputs.length, 1);
    assert.equal(capture.inputs[0]?.action, AuditAction.PUBLISH);
    assert.deepEqual(capture.inputs[0]?.before, {
      title: "Old title",
      slug: "old-title",
      excerpt: null,
      subtitle: null,
      status: "DRAFT",
      publishedAt: null,
      featuredImage: null,
      seoTitle: "Old SEO",
      seoDescription: null,
      focusKeyword: null,
      canonicalUrl: null,
      noindex: null,
      nofollow: null,
    });
    assert.equal(capture.inputs[0]?.entityName, "New title");
  });

  it("audits a delete exactly once without content snapshots", async () => {
    const capture = captureAuditInputs();

    await auditContentDelete(
      { user, module: AuditModule.EVENTS, entityType: "Event", entity: before },
      capture.dependencies,
    );

    assert.equal(capture.inputs.length, 1);
    assert.deepEqual(capture.inputs[0], {
      user,
      action: AuditAction.DELETE,
      module: AuditModule.EVENTS,
      entityId: "post-1",
      entityType: "Event",
      entityName: "Old title",
      entitySlug: "old-title",
      context,
    });
  });
});
