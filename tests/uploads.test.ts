import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { boundedFormData, encodeImage, MAX_IMAGE_BYTES, uploadPath } from "@/lib/uploads";
import { machinerySchema, ownerSchema } from "@/lib/schemas";

describe("image validation", () => {
  it("decodes and re-encodes actual images without EXIF metadata", async () => {
    const input = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: "#327650" } }).jpeg().withMetadata().toBuffer();
    const output = await encodeImage(input);
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(1920);
    expect(metadata.exif).toBeUndefined();
  });
  it("rejects spoofed files, SVG, empty and oversized data", async () => {
    for (const data of [Buffer.from("not a jpeg"), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"></svg>'), Buffer.alloc(0), Buffer.alloc(MAX_IMAGE_BYTES + 1)]) {
      await expect(encodeImage(data)).rejects.toThrow();
    }
  });
  it("bounds request bodies independently of content length", async () => {
    const request = new Request("http://localhost/upload", { method: "POST", body: Buffer.alloc(MAX_IMAGE_BYTES + 65537) });
    await expect(boundedFormData(request)).rejects.toThrow("TOO_LARGE");
    expect(() => uploadPath("../secret")).toThrow();
  });
  it("only accepts uploaded image references and limits their number", () => {
    const base = { title: "Tractor", description: "A working tractor", categoryId: "c", locationId: "l", pricingType: "DAILY" };
    expect(machinerySchema.safeParse({ ...base, images: ["https://external.test/image.jpg"] }).success).toBe(false);
    const url = "/api/v1/uploads/11111111-1111-4111-8111-111111111111";
    expect(machinerySchema.safeParse({ ...base, images: [url, url] }).success).toBe(false);
    expect(machinerySchema.safeParse({ ...base, images: [url] }).success).toBe(true);
  });
  it("validates owner credentials and ignores requested privileged roles", () => {
    const data = { name: "Test Owner", businessName: "Test Farm", phone: "+963900123456", password: "LongPassword123!", role: "SUPER_ADMIN" };
    expect(ownerSchema.parse(data)).not.toHaveProperty("role");
    expect(ownerSchema.safeParse({ ...data, password: "short" }).success).toBe(false);
    expect(ownerSchema.safeParse({ ...data, phone: "abc" }).success).toBe(false);
  });
});
