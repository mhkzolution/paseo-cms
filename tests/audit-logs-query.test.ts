import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUDIT_LOG_ORDER_BY,
  buildAuditLogsWhere,
  normalizeAuditSearch,
  parseAuditLogsListQuery,
  resolveBangkokDayBounds,
} from "@/lib/audit-logs-query";

describe("normalizeAuditSearch", () => {
  it("trims and rejects empty / short terms", () => {
    assert.equal(normalizeAuditSearch("  "), undefined);
    assert.equal(normalizeAuditSearch("a"), undefined);
    assert.equal(normalizeAuditSearch(" ab "), "ab");
  });
});

describe("parseAuditLogsListQuery", () => {
  it("defaults page=1 pageSize=50", () => {
    const q = parseAuditLogsListQuery({});
    assert.equal(q.page, 1);
    assert.equal(q.pageSize, 50);
  });

  it("coerces invalid pageSize to 50", () => {
    assert.equal(parseAuditLogsListQuery({ pageSize: "999" }).pageSize, 50);
  });

  it("accepts allowed pageSize values 25, 50, 100", () => {
    assert.equal(parseAuditLogsListQuery({ pageSize: "25" }).pageSize, 25);
    assert.equal(parseAuditLogsListQuery({ pageSize: "50" }).pageSize, 50);
    assert.equal(parseAuditLogsListQuery({ pageSize: "100" }).pageSize, 100);
  });

  it("coerces invalid page to 1", () => {
    assert.equal(parseAuditLogsListQuery({ page: "0" }).page, 1);
    assert.equal(parseAuditLogsListQuery({ page: "-3" }).page, 1);
    assert.equal(parseAuditLogsListQuery({ page: "abc" }).page, 1);
  });

  it("ignores invalid enum values (treated as unset)", () => {
    const q = parseAuditLogsListQuery({
      module: "NOT_A_MODULE",
      action: "NOT_AN_ACTION",
      severity: "NOT_A_SEVERITY",
    });
    assert.equal(q.module, undefined);
    assert.equal(q.action, undefined);
    assert.equal(q.severity, undefined);
  });

  it("accepts valid enum values", () => {
    const q = parseAuditLogsListQuery({
      module: "POSTS",
      action: "CREATE",
      severity: "WARNING",
    });
    assert.equal(q.module, "POSTS");
    assert.equal(q.action, "CREATE");
    assert.equal(q.severity, "WARNING");
  });

  it("normalizes search via trim and min length", () => {
    assert.equal(parseAuditLogsListQuery({ search: "  x " }).search, undefined);
    assert.equal(parseAuditLogsListQuery({ search: "  hero " }).search, "hero");
  });
});

describe("resolveBangkokDayBounds", () => {
  it("maps YYYY-MM-DD to Asia/Bangkok start/end instants", () => {
    const { gte, lte } = resolveBangkokDayBounds("2026-08-12", "2026-08-12");
    assert.ok(gte instanceof Date && lte instanceof Date);
    assert.ok(gte.getTime() < lte.getTime());
    // 2026-08-12 00:00 ICT = 2026-08-11 17:00 UTC
    assert.equal(gte.toISOString(), "2026-08-11T17:00:00.000Z");
    assert.equal(lte.toISOString(), "2026-08-12T16:59:59.999Z");
  });

  it("returns only gte when dateTo is omitted", () => {
    const { gte, lte } = resolveBangkokDayBounds("2026-08-12", undefined);
    assert.ok(gte);
    assert.equal(lte, undefined);
  });

  it("returns only lte when dateFrom is omitted", () => {
    const { gte, lte } = resolveBangkokDayBounds(undefined, "2026-08-12");
    assert.equal(gte, undefined);
    assert.ok(lte);
  });
});

describe("buildAuditLogsWhere", () => {
  it("adds OR contains on entityName, entitySlug, userName when search >= 2", () => {
    const where = buildAuditLogsWhere({ page: 1, pageSize: 50, search: "hero" });
    assert.deepEqual(where.OR, [
      { entityName: { contains: "hero" } },
      { entitySlug: { contains: "hero" } },
      { userName: { contains: "hero" } },
    ]);
  });

  it("does not add OR when search is too short", () => {
    const where = buildAuditLogsWhere({ page: 1, pageSize: 50, search: "a" });
    assert.equal(where.OR, undefined);
  });

  it("sets createdAt gte/lte from Bangkok day bounds", () => {
    const where = buildAuditLogsWhere({
      page: 1,
      pageSize: 50,
      dateFrom: "2026-08-12",
      dateTo: "2026-08-12",
    });
    const createdAt = where.createdAt as { gte?: Date; lte?: Date } | undefined;
    assert.equal(createdAt?.gte?.toISOString(), "2026-08-11T17:00:00.000Z");
    assert.equal(createdAt?.lte?.toISOString(), "2026-08-12T16:59:59.999Z");
  });

  it("filters by module, action, severity when set", () => {
    const where = buildAuditLogsWhere({
      page: 1,
      pageSize: 50,
      module: "POSTS",
      action: "CREATE",
      severity: "INFO",
    });
    assert.equal(where.module, "POSTS");
    assert.equal(where.action, "CREATE");
    assert.equal(where.severity, "INFO");
  });
});

describe("AUDIT_LOG_ORDER_BY", () => {
  it("defaults to createdAt desc then id desc", () => {
    assert.deepEqual(AUDIT_LOG_ORDER_BY, [{ createdAt: "desc" }, { id: "desc" }]);
  });
});
