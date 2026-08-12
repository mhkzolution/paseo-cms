#!/usr/bin/env node
/**
 * Smoke test for SEO Workspace (A6.0).
 * Run: npm run dev  (in another terminal)
 *      node scripts/smoke-seo-workspace.mjs
 */

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function main() {
  const failures = [];

  const workspaceRes = await fetch(`${BASE}/api/admin/seo/workspace`, {
    headers: { cookie: process.env.SMOKE_SESSION_COOKIE ?? "" },
  });

  if (workspaceRes.status === 401 || workspaceRes.status === 403) {
    console.log("SKIP: API requires authenticated session (set SMOKE_SESSION_COOKIE)");
    process.exit(0);
  }

  if (!workspaceRes.ok) {
    failures.push(`GET /api/admin/seo/workspace → ${workspaceRes.status}`);
  } else {
    const snapshot = await workspaceRes.json();
    const requiredKeys = ["generatedAt", "health", "attention", "quickWins", "internalLinks", "noAudit"];
    for (const key of requiredKeys) {
      if (!(key in snapshot)) failures.push(`snapshot missing ${key}`);
    }
    console.log("OK: workspace snapshot shape", {
      totalPublished: snapshot.health?.totalPublished,
      attention: snapshot.attention?.length,
      quickWins: snapshot.quickWins?.length,
    });
  }

  const pageRes = await fetch(`${BASE}/admin/seo/workspace`, {
    headers: { cookie: process.env.SMOKE_SESSION_COOKIE ?? "" },
    redirect: "manual",
  });

  if (pageRes.status === 307 || pageRes.status === 302) {
    console.log("OK: workspace page redirects to login when unauthenticated");
  } else if (pageRes.ok) {
    const html = await pageRes.text();
    if (!html.includes("SEO Workspace")) failures.push("workspace page missing title");
    else console.log("OK: workspace page renders");
  } else {
    failures.push(`GET /admin/seo/workspace → ${pageRes.status}`);
  }

  if (failures.length > 0) {
    console.error("FAILURES:\n", failures.join("\n"));
    process.exit(1);
  }

  console.log("smoke-seo-workspace: all checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
