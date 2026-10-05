import { NextResponse } from "next/server";
import { z } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(statusCode: number, code: string, message: string, errors?: unknown) {
  return NextResponse.json({ statusCode, code, message, errors }, { status: statusCode });
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { data: null, response: error(400, "VALIDATION_ERROR", "البيانات المدخلة غير صحيحة", parsed.error.flatten()) };
  }
  return { data: parsed.data, response: null };
}

export function pageParams(url: string) {
  const search = new URL(url).searchParams;
  const page = Math.max(Number(search.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(search.get("pageSize") ?? 12), 1), 50);
  return { search, page, pageSize, skip: (page - 1) * pageSize };
}
