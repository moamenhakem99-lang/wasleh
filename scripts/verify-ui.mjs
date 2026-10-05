import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const failures = [];
await mkdir("artifacts/ui", { recursive: true });

async function checkLayout(page, label) {
  await expect(page.locator("#main-content")).toHaveCount(1);
  await page.evaluate(async () => {
    document.querySelectorAll("img").forEach(image => { image.loading = "eager"; });
    await document.fonts.ready;
  });
  await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
  const measurements = await page.evaluate(() => ({
    viewport: innerWidth,
    width: document.documentElement.scrollWidth,
    font: getComputedStyle(document.body).fontFamily,
    actualFontLoaded: [...document.fonts].some(font => font.family.toLowerCase() === "tajawal" && font.status === "loaded"),
    clippedControls: [...document.querySelectorAll("button, .btn, .category-link")].filter(element => {
      return element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2;
    }).map(element => element.textContent),
  }));
  assert.ok(measurements.width <= measurements.viewport + 1, label + ": horizontal overflow");
  assert.ok(measurements.actualFontLoaded, label + ": Arabic font is missing");
  assert.deepEqual(measurements.clippedControls, [], label + ": clipped controls");
  console.log(label, JSON.stringify(measurements));
}

try {
  const page = await browser.newPage();
  page.on("pageerror", error => failures.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400 && response.url().startsWith(baseURL)) failures.push(response.status() + " " + response.url());
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("تأجير الآليات الزراعية");
    await checkLayout(page, "home-" + viewport.width);
    assert.ok(await page.locator(".search-band").evaluate(element => element.getBoundingClientRect().top < innerHeight - 50), "Search must be visible in the first viewport");
    if (viewport.width === 1440 || viewport.width === 390) {
      const name = viewport.width === 1440 ? "desktop" : "mobile";
      await page.screenshot({ path: "artifacts/ui/" + name + ".png", fullPage: true });
      await page.screenshot({ path: "artifacts/ui/" + name + "-preview.png" });
    }
    if (viewport.width === 390) {
      await page.getByRole("button", { name: "فتح القائمة", exact: true }).click();
      await expect(page.getByRole("navigation", { name: "قائمة الموبايل" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("navigation", { name: "قائمة الموبايل" })).toBeHidden();
      await page.getByRole("button", { name: "فتح القائمة", exact: true }).click();
      await page.getByRole("navigation", { name: "قائمة الموبايل" }).getByRole("link", { name: "تصفح الآليات" }).click();
      await expect(page).toHaveURL(/\/machinery$/);
      await expect(page.getByRole("navigation", { name: "قائمة الموبايل" })).toBeHidden();
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  const search = page.getByRole("form", { name: "البحث عن الآليات" });
  await search.getByRole("searchbox").fill("جرار");
  await search.getByRole("combobox", { name: "نوع الآلية" }).selectOption("tractors");
  await search.getByRole("combobox", { name: "المحافظة أو المنطقة" }).selectOption("gov-2");
  await search.getByRole("button", { name: "ابحث عن آلية" }).click();
  await expect(page.locator(".machine-card").first()).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveValue("جرار");
  await expect(page.getByRole("combobox", { name: "المحافظة أو المنطقة" })).toHaveValue("gov-2");
  await page.getByRole("combobox", { name: "ترتيب حسب" }).selectOption("price-asc");
  await page.getByRole("checkbox", { name: "يمكنها التنقل" }).check();
  await page.getByRole("button", { name: "تطبيق", exact: true }).click();
  await expect(page.locator(".machine-card").first()).toBeVisible();
  const filteredURL = new URL(page.url());
  for (const [key, value] of Object.entries({ q: "جرار", category: "tractors", location: "gov-2", sort: "price-asc", canTravel: "on" })) {
    assert.equal(filteredURL.searchParams.get(key), value, "Lost filter: " + key);
  }
  await checkLayout(page, "filtered-catalog");
  await page.screenshot({ path: "artifacts/ui/catalog.png", fullPage: true });

  await page.locator(".machine-card").first().getByRole("link", { name: "التفاصيل", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("جرار");
  await expect(page.getByRole("link", { name: "اتصال", exact: true })).toHaveAttribute("href", /^tel:/);
  await expect(page.getByRole("link", { name: "واتساب", exact: true })).toHaveAttribute("href", /^https:\/\/wa.me\//);
  await expect(page.getByRole("link", { name: "طلب حجز", exact: true })).toHaveAttribute("href", /^\/book\?machineryId=/);
  await checkLayout(page, "details-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await checkLayout(page, "details-mobile");
  await page.screenshot({ path: "artifacts/ui/details-mobile.png", fullPage: true });

  await page.goto(baseURL + "/machinery?q=nonexistent-wasla-machine");
  await expect(page.getByRole("heading", { name: "لم نجد آليات مطابقة لبحثك" })).toBeVisible();
  await page.getByRole("link", { name: "عرض جميع الآليات" }).click();
  await expect(page.locator(".machine-card").first()).toBeVisible();
  await checkLayout(page, "catalog-mobile");
  await page.screenshot({ path: "artifacts/ui/catalog-mobile.png", fullPage: true });

  await page.goto(baseURL + "/login");
  await checkLayout(page, "login-mobile");
  await expect(page.getByRole("button", { name: "دخول", exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/ui/login-mobile.png", fullPage: true });
  assert.deepEqual(failures, [], "Browser or HTTP errors");
  console.log("PASS: responsive layout, local fonts, images, mobile navigation, search, sorting, details and empty state.");
} finally {
  await browser.close();
}
