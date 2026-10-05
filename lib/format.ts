export const pricingLabels: Record<string, string> = {
  HOURLY: "بالساعة",
  DAILY: "باليوم",
  PER_HECTARE: "بالهكتار",
  PER_DUNUM: "بالدونم",
  PER_JOB: "بالمهمة",
  NEGOTIABLE: "سعر يتم الاتفاق عليه"
};

export const availabilityLabels: Record<string, string> = {
  AVAILABLE: "متاح",
  BUSY: "مشغول",
  UNAVAILABLE: "غير متاح"
};

export function priceText(price?: number | null, pricingType = "NEGOTIABLE", currency = "SYP") {
  if (!price || pricingType === "NEGOTIABLE") return pricingLabels.NEGOTIABLE;
  return `${new Intl.NumberFormat("ar-SY").format(price)} ${currency === "SYP" ? "ل.س" : currency} / ${pricingLabels[pricingType]}`;
}
