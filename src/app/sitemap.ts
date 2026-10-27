import type { MetadataRoute } from "next";
import { site } from "@/content/site";

const routes = ["/", "/services", "/industries", "/how-it-works", "/about", "/demo", "/contact", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${site.url}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path === "/privacy" ? 0.3 : 0.8,
  }));
}
