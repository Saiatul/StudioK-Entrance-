import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudioK Event Check-In",
    short_name: "StudioK Check-In",
    description: "Tablet guest registration and badge printing for StudioK.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#070708",
    theme_color: "#070708",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
