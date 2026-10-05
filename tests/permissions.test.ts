import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { accountHome, allowedReturnTo, hasPermission, type Permission } from "@/lib/permissions";
import { registerSchema, machinerySchema } from "@/lib/schemas";

const user = (role: Role) => ({ id: "test-user", role });
describe("role permissions", () => {
  const matrix: [Permission, Role[]][] = [
    ["machinery:create", ["MACHINERY_OWNER", "ADMIN", "SUPER_ADMIN"]],
    ["machinery:moderate", ["ADMIN", "SUPER_ADMIN"]],
    ["owner:access", ["MACHINERY_OWNER", "ADMIN", "SUPER_ADMIN"]],
    ["admin:access", ["ADMIN", "SUPER_ADMIN"]],
    ["owners:create", ["ADMIN", "SUPER_ADMIN"]],
    ["bookings:create", ["FARMER", "ADMIN", "SUPER_ADMIN"]],
    ["bookings:read", ["FARMER", "MACHINERY_OWNER", "ADMIN", "SUPER_ADMIN"]],
    ["bookings:read:any", ["ADMIN", "SUPER_ADMIN"]],
    ["bookings:manage", ["MACHINERY_OWNER", "ADMIN", "SUPER_ADMIN"]],
    ["bookings:manage:any", ["ADMIN", "SUPER_ADMIN"]],
    ["bookings:review", ["FARMER"]]
  ];
  for (const [permission, roles] of matrix) {
    it(permission, () => {
      expect(hasPermission(null, permission)).toBe(false);
      for (const role of Object.values(Role)) expect(hasPermission(user(role), permission)).toBe(roles.includes(role));
    });
  }
  it("only returns to authorized local pages", () => {
    for (const next of ["https://evil.test", "//evil.test", "/\\evil.test", "/\t/evil.test", "/admin", "/owner", "/add-machinery"]) {
      expect(allowedReturnTo(user("FARMER"), next)).toBe("/machinery");
    }
    expect(allowedReturnTo(user("FARMER"), "/book?machineryId=123")).toBe("/book?machineryId=123");
    expect(accountHome(user("MACHINERY_OWNER"))).toBe("/owner");
    expect(accountHome(user("SUPER_ADMIN"))).toBe("/admin");
  });
  it("does not allow privileged registration or ownership/status injection", () => {
    for (const role of ["ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT"]) expect(registerSchema.safeParse({ name: "Test", phone: "123456789", password: "Test12345!", role }).success).toBe(false);
    const machine = machinerySchema.parse({ title: "Test", description: "Test machinery", categoryId: "c", locationId: "l", pricingType: "DAILY", ownerId: "other", approvalStatus: "APPROVED", featured: true });
    expect(machine).not.toHaveProperty("ownerId");
    expect(machine).not.toHaveProperty("approvalStatus");
    expect(machine).not.toHaveProperty("featured");
  });
});
