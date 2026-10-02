import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Confirmation links are personal to one buyer and must not be indexed.
      disallow: ["/o/", "/dashboard", "/orders", "/customers", "/income", "/settings"],
    },
  };
}
