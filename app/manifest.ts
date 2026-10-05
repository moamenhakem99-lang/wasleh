import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "وصلة WASLA",
    short_name: "وصلة",
    description: "سوق الآليات الزراعية",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F9F5",
    theme_color: "#0B5D3B",
    icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }]
  };
}
