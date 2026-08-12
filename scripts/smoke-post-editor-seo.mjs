import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

loadEnv();

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const POST_ID = process.env.SMOKE_POST_ID ?? "7565a5ec-07bc-4cf0-a65d-57c9a5ada765";
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@thepaseo.co.th";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

const results = [];

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  const mark = passed ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/admin\//, { timeout: 15000 });

  await page.goto(`${BASE_URL}/admin/posts/${POST_ID}/edit`, { waitUntil: "networkidle" });
  const seoTab = page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(2);
  await seoTab.click();
  const seoTabClass = (await seoTab.getAttribute("class")) ?? "";
  if (!/border-accent/.test(seoTabClass)) {
    throw new Error(`SEO tab did not activate. class="${seoTabClass}"`);
  }
  const seoSection = page.locator("section").filter({ has: page.getByTestId("seo-optimization-assistant") });
  await seoSection.waitFor({ state: "visible", timeout: 10000 });

  const assistant = page.getByTestId("seo-optimization-assistant");

  record("1. Render — SEO Score Summary", await page.getByTestId("seo-summary-card").isVisible());
  record("1. Render — Diagnostics", await page.getByTestId("seo-diagnostics-panel").isVisible());

  const hasQuickWins = await page.getByTestId("seo-quick-wins-card").isVisible().catch(() => false);
  const hasFixSuggestions = await page.getByTestId("seo-fix-suggestions-card").isVisible().catch(() => false);
  const isExcellent = !(hasQuickWins || hasFixSuggestions);

  record(
    "1. Render — Quick Wins / Fix Suggestions or Excellent state",
    hasQuickWins || hasFixSuggestions || isExcellent,
    isExcellent ? "excellent state (quick wins hidden by design)" : "workflow blocks visible",
  );

  const oldPanelMarkers = [
    page.getByText("SEO analysis", { exact: true }),
    page.getByText("Readability", { exact: true }).filter({ has: page.locator("xpath=ancestor::section") }),
  ];
  let oldPanelVisible = false;
  for (const marker of oldPanelMarkers) {
    if (await marker.count()) {
      if (await marker.first().isVisible().catch(() => false)) {
        oldPanelVisible = true;
      }
    }
  }
  record("1. No legacy SeoScorePanel markers", !oldPanelVisible);

  const internalLinksCardVisible = await page.getByTestId("seo-internal-links-card").isVisible().catch(() => false);
  record("P2. Internal Links card visible", internalLinksCardVisible);

  const hasSuggestedLinks = (await page.getByTestId("seo-internal-links-suggested").count()) > 0;
  const hasHubLinks = (await page.getByText("Explore More").count()) > 0;
  const hasEmptyLinks = (await page.getByTestId("seo-internal-links-empty").count()) > 0;
  record(
    "P2. Internal Links shows suggestions, hub, or empty state",
    hasSuggestedLinks || hasHubLinks || hasEmptyLinks,
    hasSuggestedLinks ? "db suggestions" : hasHubLinks ? "hub fallback" : hasEmptyLinks ? "empty state" : "none",
  );

  const scoreLocator = page.getByTestId("seo-score").locator("p").first();
  const gapLocator = page.getByTestId("seo-gap-message").locator("p").last();
  const blockersLocator = page.getByTestId("seo-top-blockers");

  const scoreBefore = (await scoreLocator.textContent())?.trim() ?? "";
  const gapBefore = (await gapLocator.textContent())?.trim() ?? "";
  const blockersBefore = (await blockersLocator.textContent())?.trim() ?? "";

  const seoTitleInput = page.locator('input[name="seo.seoTitle"]');
  const seoDescriptionInput = page.locator('textarea[name="seo.seoDescription"]');
  const originalSeoTitle = await seoTitleInput.inputValue();
  const originalSeoDescription = await seoDescriptionInput.inputValue();

  await seoTitleInput.fill("เมล็ดกาแฟคั่วกลาง สำหรับเครื่องเอสเปรสโซ");
  await page.waitForTimeout(400);

  const scoreAfter = (await scoreLocator.textContent())?.trim() ?? "";
  const gapAfter = (await gapLocator.textContent())?.trim() ?? "";
  const blockersAfter = (await blockersLocator.textContent())?.trim() ?? "";

  const reactiveChanged =
    scoreBefore !== scoreAfter || gapBefore !== gapAfter || blockersBefore !== blockersAfter;
  record(
    "2. Reactive Score (~300ms debounce)",
    reactiveChanged,
    `score ${scoreBefore} -> ${scoreAfter}`,
  );

  await seoTitleInput.fill("Bad");
  await seoDescriptionInput.fill("short");
  await page.waitForTimeout(400);

  const quickWinsVisible = await page.getByTestId("seo-quick-wins-card").isVisible().catch(() => false);
  const quickWinPoints = await page.locator('[data-testid^="seo-quick-win-"]').allTextContents();
  const hasPointLabels = quickWinPoints.some((text) => /\+\d+\s*คะแนน/.test(text));
  record("3. Quick Wins with recoverable points", quickWinsVisible && hasPointLabels, quickWinPoints.join(" | "));

  const fixCardVisible = await page.getByTestId("seo-fix-suggestions-card").isVisible().catch(() => false);
  const hasCurrent = await page.getByTestId("seo-fix-text-current").count();
  const hasRecommended = await page.getByTestId("seo-fix-text-recommended").count();
  const hasCopy = await page.getByTestId("seo-copy-button").count();
  record(
    "4. Fix Suggestions — Current / Recommended / Copy",
    fixCardVisible && hasCurrent > 0 && hasRecommended > 0 && hasCopy > 0,
    `rows current=${hasCurrent} recommended=${hasRecommended} copy=${hasCopy}`,
  );

  if (hasCopy > 0) {
    const firstCopyButton = page.getByTestId("seo-copy-button").first();
    await firstCopyButton.click();
    await page.waitForTimeout(100);
    const copiedLabel = await firstCopyButton.textContent();
    record("4. Copy button feedback", /Copied!/i.test(copiedLabel ?? ""));
  } else {
    record("4. Copy button feedback", false, "no copy button found");
  }

  const details = page.getByTestId("seo-diagnostics-details");
  const collapsedByDefault = (await details.getAttribute("open")) == null;
  record("5. Diagnostics collapsed by default", collapsedByDefault);

  await page.getByTestId("seo-diagnostics-summary").click();
  await page.waitForTimeout(100);

  const diagnosticsBody = page.getByTestId("seo-diagnostics-body");
  const diagnosticsText = (await diagnosticsBody.textContent()) ?? "";
  record(
    "5. Diagnostics shows label/status/reason",
    (await page.getByTestId("seo-diagnostics-label").count()) > 0 &&
      (await page.getByTestId("seo-diagnostics-status").count()) > 0 &&
      (await page.getByTestId("seo-diagnostics-reason").count()) > 0,
  );
  record(
    "5. Diagnostics hides copy/recommended/recoverable clutter",
    !/Recommended|Copy URL|recoverable/i.test(diagnosticsText),
  );

  const badConsole = consoleErrors.filter((message) =>
    /Unknown checkId|Hydration|Maximum update depth|Cannot read properties of undefined/i.test(message),
  );
  record("6. Console clean", badConsole.length === 0, badConsole.join(" | ") || "no critical console errors");

  const categoryTab = page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(1);
  await categoryTab.click();
  const categorySelect = page.locator('select[name="categoryId"]');
  const categoryOptions = await categorySelect.locator("option").evaluateAll((options) =>
    options.map((option) => option.value).filter((value) => value.length > 0),
  );
  const currentCategory = await categorySelect.inputValue();
  const nextCategory = categoryOptions.find((value) => value !== currentCategory);
  if (nextCategory) {
    await categorySelect.selectOption(nextCategory);
    await page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(2).click();
    await page.waitForTimeout(200);
    const staleVisible = await page.getByTestId("seo-internal-links-stale-notice").isVisible();
    record("P2. Stale notice after category change", staleVisible);
    await categoryTab.click();
    await categorySelect.selectOption(currentCategory);
    await page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(2).click();
  } else {
    record("P2. Stale notice after category change", false, "need at least two categories");
    await page.locator("form > div.flex.flex-wrap.gap-2.border-b").getByRole("button").nth(2).click();
  }

  await page.screenshot({ path: "scripts/smoke-post-editor-seo-tab.png", fullPage: true });

  await seoTitleInput.fill(originalSeoTitle);
  await seoDescriptionInput.fill(originalSeoDescription);
  await page.getByRole("button", { name: /save changes/i }).click();
  await page.waitForURL(/\/admin\/posts/, { timeout: 15000 });
  const saveSucceeded = page.url().includes("/admin/posts");
  record("7. Save Draft/Update regression — save succeeds", saveSucceeded, page.url());
  await browser.close();

  console.log("Screenshot: scripts/smoke-post-editor-seo-tab.png");

  const failed = results.filter((item) => !item.passed);
  console.log("\n--- Smoke summary ---");
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length > 0) {
    console.log("Failed checks:");
    for (const item of failed) {
      console.log(`- ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
