import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildDiff } from "@/lib/audit-diff";

describe("buildDiff", () => {
  it("returns null when nothing changed", () => {
    assert.equal(buildDiff({ title: "A" }, { title: "A" }), null);
  });

  it("returns null for empty diff", () => {
    assert.equal(buildDiff({}, {}), null);
  });

  it("diffs normal fields with before/after", () => {
    assert.deepEqual(buildDiff({ title: "Old Title" }, { title: "New Title" }), {
      title: { before: "Old Title", after: "New Title" },
    });
  });

  it("diffs primitive fields with before/after", () => {
    assert.deepEqual(buildDiff({ count: 1, active: true }, { count: 2, active: false }), {
      count: { before: 1, after: 2 },
      active: { before: true, after: false },
    });
  });

  it("ignores createdAt updatedAt deletedAt", () => {
    assert.equal(
      buildDiff(
        { title: "A", createdAt: "1", updatedAt: "1", deletedAt: null },
        { title: "A", createdAt: "2", updatedAt: "2", deletedAt: "x" },
      ),
      null,
    );
  });

  it("masks sensitive fields", () => {
    assert.deepEqual(buildDiff({ smtpPassword: "old" }, { smtpPassword: "new" }), {
      smtpPassword: { changed: true, masked: true },
    });
  });

  it("masks all configured sensitive keys", () => {
    const before = {
      password: "old-pw",
      token: "old-token",
      secret: "old-secret",
      apiKey: "old-key",
      smtpPassword: "old-smtp",
    };
    const after = {
      password: "new-pw",
      token: "new-token",
      secret: "new-secret",
      apiKey: "new-key",
      smtpPassword: "new-smtp",
    };
    assert.deepEqual(buildDiff(before, after), {
      password: { changed: true, masked: true },
      token: { changed: true, masked: true },
      secret: { changed: true, masked: true },
      apiKey: { changed: true, masked: true },
      smtpPassword: { changed: true, masked: true },
    });
  });

  it("marks long-text fields without values", () => {
    assert.deepEqual(buildDiff({ content: "long a" }, { content: "long b" }), {
      content: { changed: true },
    });
  });

  it("marks all configured long-text keys without values", () => {
    const before = {
      content: "a",
      customJsonLd: "b",
      metadata: "c",
      schemaOverrides: "d",
      robotsDirectives: "e",
    };
    const after = {
      content: "a2",
      customJsonLd: "b2",
      metadata: "c2",
      schemaOverrides: "d2",
      robotsDirectives: "e2",
    };
    assert.deepEqual(buildDiff(before, after), {
      content: { changed: true },
      customJsonLd: { changed: true },
      metadata: { changed: true },
      schemaOverrides: { changed: true },
      robotsDirectives: { changed: true },
    });
  });

  it("shallow-compares arrays without nested diff", () => {
    assert.deepEqual(buildDiff({ tags: ["a", "b"] }, { tags: ["a", "b", "c"] }), {
      tags: { before: ["a", "b"], after: ["a", "b", "c"] },
    });
  });

  it("shallow-compares objects without nested diff", () => {
    const before = { settings: { theme: "dark", lang: "en" } };
    const after = { settings: { theme: "light", lang: "en" } };
    assert.deepEqual(buildDiff(before, after), {
      settings: { before: { theme: "dark", lang: "en" }, after: { theme: "light", lang: "en" } },
    });
  });

  it("treats null before as create-style after values", () => {
    assert.deepEqual(buildDiff(null, { title: "Hello", content: "body" }), {
      title: { before: null, after: "Hello" },
      content: { changed: true },
    });
  });

  it("CREATE: buildDiff(null, after) produces before null and after value", () => {
    assert.deepEqual(buildDiff(null, { title: "New Post" }), {
      title: { before: null, after: "New Post" },
    });
  });

  it("DELETE: buildDiff(before, null) produces before value and after null for normal fields", () => {
    assert.deepEqual(buildDiff({ title: "Old Post", status: "draft" }, null), {
      title: { before: "Old Post", after: null },
      status: { before: "draft", after: null },
    });
  });

  it("DELETE: still ignores timestamp fields when after is null", () => {
    assert.deepEqual(
      buildDiff({ title: "Old Post", createdAt: "1", updatedAt: "2", deletedAt: null }, null),
      {
        title: { before: "Old Post", after: null },
      },
    );
  });

  it("DELETE: still masks sensitive fields when after is null", () => {
    assert.deepEqual(buildDiff({ smtpPassword: "secret" }, null), {
      smtpPassword: { changed: true, masked: true },
    });
  });

  it("DELETE: still marks long-text fields without values when after is null", () => {
    assert.deepEqual(buildDiff({ content: "long body" }, null), {
      content: { changed: true },
    });
  });

  it("treats objects with different key order as equal", () => {
    assert.equal(buildDiff({ a: 1, b: 2 }, { b: 2, a: 1 }), null);
  });

  it("treats nested objects with different key order as equal", () => {
    assert.equal(
      buildDiff({ meta: { a: 1, b: 2 } }, { meta: { b: 2, a: 1 } }),
      null,
    );
  });
});
