import { describe, expect, it } from "vitest";
import { priceText } from "@/lib/format";

describe("priceText", () => {
  it("formats Syrian pound prices in Arabic", () => {
    expect(priceText(250000, "DAILY", "SYP")).toContain("ل.س");
  });

  it("handles negotiable listings", () => {
    expect(priceText(null, "NEGOTIABLE", "SYP")).toBe("سعر يتم الاتفاق عليه");
  });
});
