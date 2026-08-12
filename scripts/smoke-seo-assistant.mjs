import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx);
      const value = trimmed.slice(idx + 1).replace(/^"|"$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore missing .env
  }
}

function resolveSmokeIds() {
  const output = execSync(
    `npx tsx -e "(async()=>{const {prisma}=await import('./lib/prisma.ts');const [post,event,promotion]=await Promise.all([prisma.post.findFirst({where:{deletedAt:null},select:{id:true}}),prisma.event.findFirst({where:{deletedAt:null},select:{id:true}}),prisma.promotion.findFirst({where:{deletedAt:null},select:{id:true}})]);console.log(JSON.stringify({post:post?.id??null,event:event?.id??null,promotion:promotion?.id??null}));await prisma.$disconnect();})()"`,
    { cwd: process.cwd(), encoding: "utf8" },
  );
  return JSON.parse(output.trim());
}

loadEnv();

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@thepaseo.co.th";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

const results = [];

function record(scope, name, passed, detail = "") {
  const label = `[${scope}] ${name}`;
  results.push({ scope, name, passed, detail });
  const mark = passed ? "PASS" : "FAIL";
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function openSeoTab(page) {
  const seoTab = page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(2);
  await seoTab.click();
  const seoTabClass = (await seoTab.getAttribute("class")) ?? "";
  if (!/border-accent/.test(seoTabClass)) {
    throw new Error(`SEO tab did not activate. class="${seoTabClass}"`);
  }
  await page
    .locator("section")
    .filter({ has: page.getByTestId("seo-optimization-assistant") })
    .waitFor({ state: "visible", timeout: 10000 });
}

async function runEditorSmoke(page, scope, config) {
  await page.goto(`${BASE_URL}${config.editPath}`, { waitUntil: "networkidle" });
  await openSeoTab(page);

  record(scope, "assistant renders", await page.getByTestId("seo-optimization-assistant").isVisible());
  record(scope, "summary renders", await page.getByTestId("seo-summary-card").isVisible());
  record(scope, "diagnostics renders", await page.getByTestId("seo-diagnostics-panel").isVisible());
  record(
    scope,
    "no legacy SeoScorePanel",
    (await page.getByText("SEO analysis", { exact: true }).count()) === 0,
  );

  const scoreLocator = page.getByTestId("seo-score").locator("p").first();
  const scoreBefore = (await scoreLocator.textContent())?.trim() ?? "";
  await page.locator('input[name="seo.seoTitle"]').fill("Smoke test SEO title update");
  await page.waitForTimeout(400);
  const scoreAfter = (await scoreLocator.textContent())?.trim() ?? "";
  record(scope, "score updates after debounce", scoreBefore !== scoreAfter, `${scoreBefore} -> ${scoreAfter}`);

  await page.locator('input[name="seo.seoTitle"]').fill("Bad");
  await page.locator('textarea[name="seo.seoDescription"]').fill("short");
  await page.waitForTimeout(400);

  const quickWinsVisible = await page.getByTestId("seo-quick-wins-card").isVisible().catch(() => false);
  const fixVisible = await page.getByTestId("seo-fix-suggestions-card").isVisible().catch(() => false);
  record(scope, "quick wins or excellent state", quickWinsVisible || !fixVisible, quickWinsVisible ? "quick wins visible" : "excellent/minimal");

  if (fixVisible) {
    const copyCount = await page.getByTestId("seo-copy-button").count();
    record(scope, "fix suggestions + copy buttons", copyCount > 0, `copy=${copyCount}`);
    if (copyCount > 0) {
      const firstCopy = page.getByTestId("seo-copy-button").first();
      await firstCopy.click();
      await page.waitForTimeout(100);
      record(scope, "copy feedback", /Copied!/i.test((await firstCopy.textContent()) ?? ""));
    }
  }

  const internalLinksVisible = await page.getByTestId("seo-internal-links-card").isVisible().catch(() => false);
  if (internalLinksVisible) {
    const hasSuggested = (await page.getByTestId("seo-internal-links-suggested").count()) > 0;
    const hasHub = (await page.getByText("Explore More").count()) > 0;
    const hasEmpty = (await page.getByTestId("seo-internal-links-empty").count()) > 0;
    record(scope, "internal links content", hasSuggested || hasHub || hasEmpty);
  } else {
    record(scope, "internal links hidden (check good)", true, "showInternalLinks=false");
  }

  if (config.stale) {
    const taxonomyTab = page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(1);
    await taxonomyTab.click();
    await config.applyStaleChange(page);
    await page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(2).click();
    await page.waitForTimeout(200);
    record(
      scope,
      "stale notice after taxonomy change",
      await page.getByTestId("seo-internal-links-stale-notice").isVisible(),
    );
    await config.restoreStaleChange?.(page);
    await page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(2).click();
  }

  const collapsed = (await page.getByTestId("seo-diagnostics-details").getAttribute("open")) == null;
  record(scope, "diagnostics collapsed by default", collapsed);
}

async function main() {
  const ids = resolveSmokeIds();
  const editors = [
    {
      scope: "Post",
      editPath: `/admin/posts/${process.env.SMOKE_POST_ID ?? ids.post}/edit`,
      stale: true,
      applyStaleChange: async (page) => {
        const select = page.locator('select[name="categoryId"]');
        const options = await select.locator("option").evaluateAll((nodes) =>
          nodes.map((node) => node.value).filter((value) => value.length > 0),
        );
        const current = await select.inputValue();
        const next = options.find((value) => value !== current);
        if (next) await select.selectOption(next);
      },
    },
    {
      scope: "Event",
      editPath: `/admin/events/${process.env.SMOKE_EVENT_ID ?? ids.event}/edit`,
      stale: true,
      applyStaleChange: async (page) => {
        const firstTag = page.locator('input[type="checkbox"][name="tagIds"]').first();
        if (await firstTag.count()) await firstTag.check({ force: true });
      },
    },
    {
      scope: "Promotion",
      editPath: `/admin/promotions/${process.env.SMOKE_PROMOTION_ID ?? ids.promotion}/edit`,
      stale: true,
      applyStaleChange: async (page) => {
        const select = page.locator('select[name="category"]');
        const options = await select.locator("option").evaluateAll((nodes) =>
          nodes.map((node) => node.value).filter((value) => value.length > 0),
        );
        const current = await select.inputValue();
        const next = options.find((value) => value !== current);
        if (next) await select.selectOption(next);
      },
    },
  ].filter((editor) => !editor.editPath.includes("null"));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/admin\//, { timeout: 15000 });

  for (const editor of editors) {
    console.log(`\n--- ${editor.scope} ---`);
    await runEditorSmoke(page, editor.scope, editor);
  }

  const badConsole = consoleErrors.filter((message) =>
    /Unknown checkId|Hydration|Maximum update depth|Cannot read properties of undefined/i.test(message),
  );
  record("All", "console clean", badConsole.length === 0, badConsole.join(" | ") || "ok");

  await browser.close();

  const failed = results.filter((item) => !item.passed);
  console.log(`\n--- Smoke summary ---`);
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length > 0) {
    for (const item of failed) {
      console.log(`- [${item.scope}] ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
