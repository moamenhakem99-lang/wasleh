import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  password: z.string().min(8),
  role: z.enum(["FARMER", "MACHINERY_OWNER"]).default("FARMER")
});

export const loginSchema = z.object({
  phone: z.string().min(7),
  password: z.string().min(1)
});

export const machinerySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  categoryId: z.string().min(1),
  locationId: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  manufactureYear: z.number().int().optional(),
  horsePower: z.number().int().optional(),
  condition: z.enum(["NEW", "VERY_GOOD", "GOOD", "FAIR", "NEEDS_MAINTENANCE"]).default("GOOD"),
  pricingType: z.enum(["HOURLY", "DAILY", "PER_HECTARE", "PER_DUNUM", "PER_JOB", "NEGOTIABLE"]),
  price: z.number().int().nonnegative().optional(),
  canTravel: z.boolean().default(false),
  serviceRadiusKm: z.number().int().nonnegative().optional(),
  images: z.array(z.string().regex(/^\/api\/v1\/uploads\/[0-9a-f-]{36}$/)).max(6).refine(values => new Set(values).size === values.length).default([])
});

export const ownerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^(?:\+|00)?[0-9 ()-]{7,22}$/),
  businessName: z.string().trim().min(2).max(120),
  password: z.string().min(10).max(72),
  verified: z.boolean().default(false)
});

export const bookingSchema = z.object({
  machineryId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().max(1000).optional()
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional()
});

export function slugify(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").slice(0, 80);
}
