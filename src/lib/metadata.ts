import type { Metadata } from "next";
import { site } from "@/content/site";

type PageMeta = { title: string; description: string; path: string };

/** Per-page metadata with canonical URL and matching Open Graph / Twitter tags. */
export function pageMetadata({ title, description, path }: PageMeta): Metadata {
  const fullTitle = path === "/" ? title : `${title} | ${site.name}`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, siteName: site.name, type: "website", locale: "en_US" },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}
