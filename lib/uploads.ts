import path from "node:path";
import sharp from "sharp";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
export function uploadPath(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) throw new Error("Invalid upload id");
  return path.join(uploadDirectory, `${id}.webp`);
}
export async function encodeImage(data: Buffer) {
  if (!data.length || data.length > MAX_IMAGE_BYTES) throw new Error("Invalid image size");
  const image = sharp(data, { limitInputPixels: 40_000_000, failOn: "warning" });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw new Error("Unsupported image");
  return image.rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
}

// Bound the multipart body even when Content-Length is missing or untrusted.
export async function boundedFormData(request: Request) {
  const limit = MAX_IMAGE_BYTES + 64 * 1024;
  if (Number(request.headers.get("content-length")) > limit) throw new Error("TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("EMPTY_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new Error("TOO_LARGE"); }
    chunks.push(value);
  }
  return new Response(Buffer.concat(chunks), { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
}
