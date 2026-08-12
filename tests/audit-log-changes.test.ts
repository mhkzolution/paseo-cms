import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatAuditChangeRows } from "@/features/audit-logs/audit-log-changes";

describe("formatAuditChangeRows", () => {
  it("formats before/after, changed, and masked", () => {
    const rows = formatAuditChangeRows({
      title: { before: "A", after: "B" },
      content: { changed: true },
      smtpPassword: { changed: true, masked: true },
    });
    assert.deepEqual(rows, [
      { key: "title", kind: "diff", before: "A", after: "B" },
      { key: "content", kind: "changed" },
      { key: "smtpPassword", kind: "masked" },
    ]);
  });

  it("returns empty list for null changes", () => {
    assert.deepEqual(formatAuditChangeRows(null), []);
  });
});
