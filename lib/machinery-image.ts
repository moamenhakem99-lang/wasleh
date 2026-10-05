const demoCovers: Record<string, string> = {
  "tractor-90-hp-homs": "/images/field-tractor.jpg",
  "wheat-harvester-homs": "/images/harvester-demo.jpg"
};

export function machineryCover(item: { slug: string; images: { url: string }[] }) {
  const source = item.images[0]?.url;
  if (source && source !== "/images/machinery-placeholder.svg") {
    return { src: source, illustrative: item.slug.startsWith("demo-v2-") && ["/images/field-tractor.jpg", "/images/harvester-demo.jpg"].includes(source) };
  }
  // Only the seeded examples receive illustrative photos; actual listings keep their own images.
  const demo = source === "/images/machinery-placeholder.svg" ? demoCovers[item.slug] : undefined;
  return { src: demo ?? null, illustrative: Boolean(demo) };
}
