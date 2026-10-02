import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HunarHisaab",
    short_name: "HunarHisaab",
    description:
      "Price your work properly and keep a record your customer confirmed.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#0e6b3a",
    orientation: "portrait",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/mark.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
