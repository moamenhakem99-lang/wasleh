import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { request, chromium, expect, type APIRequestContext } from "@playwright/test";

const db = new PrismaClient();
const baseURL = process.env.UI_BASE_URL ?? "http://localhost:3000";
const prefix = `permission-check-${randomUUID()}`;
const users: { id: string; role: Role; phone: string }[] = [];
const clients: APIRequestContext[] = [];
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let checks = 0;
async function status(client: APIRequestContext, method: string, path: string, expected: number, data?: unknown) {
  const response = await client.fetch(`/api/v1${path}`, { method, data });
  assert.equal(response.status(), expected, `${method} ${path}: ${await response.text()}`);
  checks++;
  return response;
}

async function main() {
  const password = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  for (const role of ["FARMER", "MACHINERY_OWNER", "ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT", "MACHINERY_OWNER", "FARMER"] as Role[]) {
    const user = await db.user.create({ data: { name: prefix, phone: `+999${Date.now()}${users.length}`, role, passwordHash } });
    users.push(user);
    const client = await request.newContext({ baseURL, timeout: 90000 });
    clients.push(client);
    await status(client, "POST", "/auth/login", 200, { phone: user.phone, password });
  }
  const [farmer, owner, admin, superAdmin, support, otherOwner, otherFarmer] = clients;
  const guest = await request.newContext({ baseURL, timeout: 90000 });
  clients.push(guest);
  const category = await db.category.findFirstOrThrow();
  const location = await db.location.findFirstOrThrow();
  const machineData = { title: prefix, description: "Temporary authorization test machinery", categoryId: category.id, locationId: location.id, pricingType: "DAILY", price: 100 };
  await status(guest, "POST", "/machinery", 401, machineData);
  await status(farmer, "POST", "/machinery", 403, machineData);
  await status(support, "POST", "/machinery", 403, machineData);
  const created = await (await status(owner, "POST", "/machinery", 201, { ...machineData, ownerId: users[0].id, approvalStatus: "APPROVED", featured: true })).json();
  const machine = created.item;
  assert.equal(machine.ownerId, users[1].id);
  assert.equal(machine.approvalStatus, "PENDING");
  assert.equal(machine.featured, false);
  for (const client of [farmer, owner, support]) {
    await status(client, "GET", "/admin/dashboard", 403);
    await status(client, "GET", "/admin/machinery/pending", 403);
    await status(client, "PATCH", `/admin/machinery/${machine.id}/approve`, 403);
    await status(client, "PATCH", `/admin/machinery/${machine.id}/reject`, 403);
  }
  await status(support, "GET", "/bookings", 403);
  await status(owner, "POST", "/bookings", 403, {});
  const dates = { startDate: "2030-01-01T00:00:00Z", endDate: "2030-01-02T00:00:00Z" };
  await status(farmer, "POST", "/bookings", 404, { machineryId: machine.id, ...dates });
  await status(admin, "PATCH", `/admin/machinery/${machine.id}/approve`, 200);
  await status(superAdmin, "GET", "/admin/dashboard", 200);
  const pending = await (await status(admin, "GET", "/admin/machinery/pending", 200)).text();
  assert.equal(pending.includes("passwordHash"), false);
  const booking = (await (await status(farmer, "POST", "/bookings", 201, { machineryId: machine.id, farmerId: users[6].id, ...dates })).json()).item;
  assert.equal(booking.farmerId, users[0].id);
  for (const client of [farmer, owner]) {
    const body = await (await status(client, "GET", "/bookings", 200)).json();
    assert.deepEqual(body.items.map((item: { id: string }) => item.id), [booking.id]);
  }
  for (const client of [otherOwner, otherFarmer]) {
    assert.deepEqual((await (await status(client, "GET", "/bookings", 200)).json()).items, []);
  }
  for (const path of [`/owner/bookings/${booking.id}/accept`, `/owner/bookings/${booking.id}/reject`, `/bookings/${booking.id}/complete`]) {
    await status(otherOwner, "PATCH", path, 404);
    await status(farmer, "PATCH", path, 403);
  }
  await status(owner, "PATCH", `/bookings/${booking.id}/complete`, 409);
  await status(farmer, "POST", `/bookings/${booking.id}/review`, 409, { rating: 5 });
  await status(owner, "PATCH", `/owner/bookings/${booking.id}/accept`, 200);
  await status(owner, "PATCH", `/owner/bookings/${booking.id}/reject`, 409);
  await status(owner, "PATCH", `/bookings/${booking.id}/complete`, 200);
  await status(otherFarmer, "POST", `/bookings/${booking.id}/review`, 404, { rating: 5 });
  await status(farmer, "POST", `/bookings/${booking.id}/review`, 201, { rating: 5 });
  await status(farmer, "POST", `/bookings/${booking.id}/review`, 409, { rating: 5 });
  for (const role of ["ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT"]) await status(guest, "POST", "/auth/register", 400, { name: prefix, phone: "+9991234567", password, role });

  browser = await chromium.launch();
  for (const [client, canAdd] of [[farmer, false], [owner, true], [support, false]] as const) {
    const context = await browser.newContext({ storageState: await client.storageState() });
    const page = await context.newPage();
    await page.goto(baseURL, { waitUntil: "networkidle" });
    const count = await page.locator('a[href="/add-machinery"]').count();
    assert.equal(count > 0, canAdd);
    await page.goto(`${baseURL}/add-machinery`);
    await expect(page).toHaveURL(canAdd ? /\/add-machinery$/ : /\/access-denied$/);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
    await expect(page.getByRole("link", { name: "تسجيل الدخول", exact: true })).toBeVisible();
    assert.equal(await page.locator('a[href="/add-machinery"]').count(), 0);
    await context.close();
    checks += 5;
  }
  const denied = await farmer.get("/admin", { maxRedirects: 0 });
  assert.equal(denied.headers().location, "/access-denied");
  const unauthenticated = await guest.get("/add-machinery", { maxRedirects: 0 });
  assert.match(unauthenticated.headers().location, /^\/login\?next=/);
  await db.user.update({ where: { id: users[1].id }, data: { role: "FARMER" } });
  await status(owner, "POST", "/machinery", 403, machineData);
  await db.user.update({ where: { id: users[1].id }, data: { active: false } });
  await status(owner, "GET", "/bookings", 401);
  console.log(`PASS: ${checks} API and UI authorization checks, including stale roles and disabled accounts.`);
}

main().finally(async () => {
  await browser?.close();
  await Promise.all(clients.map(client => client.dispose()));
  const ids = users.map(user => user.id);
  if (ids.length) {
    const machines = await db.machinery.findMany({ where: { ownerId: { in: ids } }, select: { id: true } });
    const machineIds = machines.map(machine => machine.id);
    await db.review.deleteMany({ where: { machineryId: { in: machineIds } } });
    await db.booking.deleteMany({ where: { machineryId: { in: machineIds } } });
    await db.machinery.deleteMany({ where: { id: { in: machineIds } } });
    await db.notification.deleteMany({ where: { userId: { in: ids } } });
    await db.ownerProfile.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  await db.$disconnect();
}).catch(error => { console.error(error); process.exitCode = 1; });
