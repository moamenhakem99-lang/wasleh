export function decodeMachinerySlug(value: string): string | null {
  try {
    const slug = decodeURIComponent(value);
    return slug && !/[\\/]/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}
