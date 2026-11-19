import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getAllProjects } from "@/lib/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/projects", "/about"].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: new Date(),
  }));

  const projects = getAllProjects().map((p) => ({
    url: `${site.url}/projects/${p.slug}`,
    lastModified: new Date(p.date),
  }));

  return [...pages, ...projects];
}
