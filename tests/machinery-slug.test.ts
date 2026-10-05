import { expect, it } from "vitest";
import { decodeMachinerySlug } from "@/lib/machinery-slug";

it("supports encoded and already decoded Arabic listing slugs", () => {
  const slug = "جرار-زراعي-123";
  expect(decodeMachinerySlug(encodeURIComponent(slug))).toBe(slug);
  expect(decodeMachinerySlug(slug)).toBe(slug);
  expect(decodeMachinerySlug("tractor-90")).toBe("tractor-90");
});
it("rejects malformed escapes and path separators", () => {
  for (const value of ["", "%ZZ", "%E0%A4%A", "a%2Fb", "a%5Cb"]) expect(decodeMachinerySlug(value)).toBeNull();
});
