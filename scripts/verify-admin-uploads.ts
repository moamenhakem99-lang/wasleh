import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, mkdir, unlink } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { chromium, expect, type BrowserContext } from "@playwright/test";
import { uploadPath } from "../lib/uploads";

const db = new PrismaClient();
const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000";
const ids: string[] = [];
const contexts: BrowserContext[] = [];
const prefix = randomUUID();
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let checks = 0;
async function layout(page: import("@playwright/test").Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + " horizontal overflow");
  await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: `artifacts/admin/${name}.png`, fullPage: true });
  checks++;
}
async function workflow() {
  // A separate function keeps fixture cleanup active for every assertion.
  browser = await chromium.launch();
  await mkdir("artifacts/admin", { recursive: true });
  const password = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  for (const role of ["ADMIN", "MACHINERY_OWNER", "FARMER", "MACHINERY_OWNER"] as Role[]) {
    const user = await db.user.create({ data: { name: "حساب اختبار", phone: `+998${Date.now().toString().slice(-10)}${ids.length}`, role, passwordHash } });
    ids.push(user.id);
    const context = await browser.newContext({ baseURL });
    contexts.push(context);
    assert.equal((await context.request.post("/api/v1/auth/login", { data: { phone: user.phone, password } })).status(), 200);
  }
  const [admin, owner, farmer, otherOwner] = contexts;
  const guest = await browser.newContext({ baseURL }); contexts.push(guest);
  const ownerBody = { name: "مالك اختبار جديد", businessName: "اختبار الخدمات الزراعية", phone: `+997${Date.now().toString().slice(-10)}`, password, role: "SUPER_ADMIN", verified: true };
  for (const [client, code] of [[guest, 401], [owner, 403], [farmer, 403]] as const) {
    assert.equal((await client.request.post("/api/v1/admin/owners", { data: ownerBody })).status(), code);
    checks++;
  }
  for (const [client, code] of [[guest, 401], [farmer, 403]] as const) {
    assert.equal((await client.request.post("/api/v1/uploads", { data: {} })).status(), code); checks++;
  }
  const a = await admin.newPage();
  for (const width of [1440, 390, 320]) {
    await a.setViewportSize({ width, height: 900 });
    for (const path of ["/admin", "/admin/owners", "/admin/machinery", "/admin/bookings", "/admin/owners/new"]) {
      await a.goto(path, { waitUntil: "networkidle" });
      await layout(a, path.replaceAll("/", "-") + "-" + width);
    }
  }
  await a.setViewportSize({ width: 1440, height: 900 });
  await a.goto("/admin/owners/new");
  await a.getByLabel("الاسم الكامل", { exact: true }).fill(ownerBody.name);
  await a.getByLabel("اسم النشاط", { exact: true }).fill(ownerBody.businessName);
  await a.getByLabel("رقم الهاتف", { exact: true }).fill(ownerBody.phone);
  await a.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await a.getByLabel("تم التحقق من هوية المالك").check();
  const createdResponse = a.waitForResponse(response => response.url().endsWith("/api/v1/admin/owners") && response.request().method() === "POST");
  await a.getByRole("button", { name: "إنشاء حساب المالك", exact: true }).click();
  const created = await (await createdResponse).json();
  assert.ok(created.owner?.id); ids.push(created.owner.id);
  assert.equal(created.owner.role, "MACHINERY_OWNER");
  assert.equal(JSON.stringify(created).includes("passwordHash"), false);
  await expect(a.getByRole("heading", { name: "تم إنشاء حساب المالك" })).toBeVisible();
  assert.equal((await (await admin.request.get("/api/v1/auth/me")).json()).user.id, ids[0]);
  assert.equal((await admin.request.post("/api/v1/admin/owners", { data: ownerBody })).status(), 409);
  assert.equal((await (await db.user.findUniqueOrThrow({ where: { id: created.owner.id }, include: { ownerProfile: true } })).ownerProfile)?.verificationStatus, "VERIFIED");
  await a.goto("/admin/owners");
  await a.getByRole("textbox", { name: "بحث عن مالك" }).fill(ownerBody.phone);
  await a.getByRole("button", { name: "بحث", exact: true }).click();
  await expect(a.locator("tbody tr")).toHaveCount(1);
  await expect(a.locator("tbody")).toContainText(ownerBody.name);
  checks += 8;
  const photo = await readFile("public/images/field-tractor.jpg");
  for (const [buffer, mimeType, expected] of [[Buffer.from("<html>not an image</html>"), "image/jpeg", 400], [Buffer.alloc(5 * 1024 * 1024 + 1), "image/jpeg", 413], [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), "image/svg+xml", 400]] as const) {
    const response = await owner.request.post("/api/v1/uploads", { multipart: { file: { name: "photo.jpg", mimeType, buffer } } });
    assert.equal(response.status(), expected); checks++;
  }
  const uploaded = await (await owner.request.post("/api/v1/uploads", { multipart: { file: { name: "../../photo.jpg", mimeType: "image/jpeg", buffer: photo } } })).json();
  assert.ok(uploaded.id);
  assert.equal((await guest.request.get(uploaded.url)).status(), 404);
  assert.equal((await otherOwner.request.get(uploaded.url)).status(), 404);
  assert.equal((await admin.request.get(uploaded.url)).status(), 200);
  assert.equal((await otherOwner.request.delete(uploaded.url)).status(), 404);
  const category = await db.category.findFirstOrThrow();
  const location = await db.location.findFirstOrThrow();
  const machineBody = { title: "اختبار آلية " + prefix, description: "آلية مؤقتة لاختبار رفع الصور والموافقة", categoryId: category.id, locationId: location.id, pricingType: "DAILY", price: 100, images: [uploaded.url] };
  assert.equal((await otherOwner.request.post("/api/v1/machinery", { data: machineBody })).status(), 400);
  assert.equal((await owner.request.delete(uploaded.url)).status(), 200);
  assert.equal((await owner.request.get(uploaded.url)).status(), 404);
  checks += 7;
  const p = await owner.newPage();
  await p.goto("/add-machinery");
  await p.locator('input[type="file"]').setInputFiles(["public/images/field-tractor.jpg", "public/images/harvester-demo.jpg", "public/images/field-tractor.jpg"]);
  await expect(p.locator(".upload-photo")).toHaveCount(3);
  await expect(p.getByRole("button", { name: "إرسال للمراجعة" })).toBeEnabled();
  await p.reload();
  await expect(p.locator(".upload-photo")).toHaveCount(3);
  await p.getByLabel("اسم الآلية", { exact: true }).fill(machineBody.title);
  await p.getByLabel("التصنيف", { exact: true }).selectOption(category.id);
  await p.getByLabel("الموقع", { exact: true }).selectOption(location.id);
  await p.getByLabel("وصف الآلية", { exact: true }).fill(machineBody.description);
  await p.getByLabel("السعر بالليرة السورية", { exact: true }).fill("100");
  await expect(p.getByRole("button", { name: "إرسال للمراجعة" })).toBeEnabled();
  await p.getByRole("button", { name: "تعيين الصورة 2 كرئيسية" }).click();
  const primary = await p.locator(".upload-photo img").first().getAttribute("src");
  await p.getByRole("button", { name: "حذف الصورة 3" }).click();
  await expect(p.locator(".upload-photo")).toHaveCount(2);
  for (const width of [1440, 390, 320]) { await p.setViewportSize({ width, height: 900 }); await layout(p, "upload-form-" + width); }
  const save = p.waitForResponse(response => response.url().endsWith("/api/v1/machinery") && response.request().method() === "POST");
  await p.getByRole("button", { name: "إرسال للمراجعة" }).click();
  const response = await save;
  assert.equal(response.status(), 201);
  const machine = (await response.json()).item;
  assert.equal(machine.images[0].url, primary);
  assert.equal(machine.images.length, 2);
  await expect(p).toHaveURL(/\/owner$/);
  assert.equal((await owner.request.delete(primary!)).status(), 404);
  assert.equal((await owner.request.post("/api/v1/machinery", { data: { ...machineBody, images: [primary] } })).status(), 400);
  assert.equal((await guest.request.get(primary!)).status(), 404);
  await a.goto("/admin/machinery?" + new URLSearchParams({ q: machine.title, status: "PENDING" }));
  await a.locator("summary").click();
  await layout(a, "review-uploaded-machine");
  await a.getByRole("button", { name: "اعتماد", exact: true }).click();
  await expect(a.getByText("لا توجد آليات مطابقة.", { exact: true })).toBeVisible();
  const publicImage = await guest.request.get(primary!);
  assert.equal(publicImage.status(), 200);
  assert.equal(publicImage.headers()["content-type"], "image/webp");
  const publicPage = await guest.newPage();
  const pageResponse = await publicPage.goto("/machinery/" + machine.slug);
  assert.equal(pageResponse?.status(), 200);
  assert.equal((await guest.request.get("/api/v1/machinery/" + encodeURIComponent(machine.slug))).status(), 200);
  await expect(publicPage.locator(".gallery-thumbnails button")).toHaveCount(2);
  await publicPage.getByRole("button", { name: "عرض الصورة 2" }).click();
  await expect(publicPage.locator(".gallery-thumbnails button").nth(1)).toHaveAttribute("aria-pressed", "true");
  await layout(publicPage, "public-uploaded-gallery");
  checks += 16;
  console.log(`PASS: ${checks} upload/admin workflow checks including UI owner creation, private photos, cross-owner denial, moderation and public gallery.`);
}
workflow().finally(async () => {
  await browser?.close();
  if (ids.length) {
    const uploads = await db.upload.findMany({ where: { userId: { in: ids } } });
    await db.upload.deleteMany({ where: { userId: { in: ids } } });
    for (const upload of uploads) await unlink(uploadPath(upload.id)).catch(() => {});
    await db.machinery.deleteMany({ where: { ownerId: { in: ids } } });
    await db.ownerProfile.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  await db.$disconnect();
}).catch(error => { console.error(error); process.exitCode = 1; });
