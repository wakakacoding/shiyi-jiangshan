import type { MetadataRoute } from "next";
import { getAllAuthors, getAllPoems } from "@/lib/content";
import { dynasties, topics } from "@/lib/taxonomy";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticPages = ["", "/poems", "/about"].map((path) => ({ url: `${base}${path}` }));
  return [
    ...staticPages,
    ...getAllPoems().map((poem) => ({ url: `${base}/poems/${poem.slug}` })),
    ...getAllAuthors().map((author) => ({ url: `${base}/authors/${author.id}` })),
    ...dynasties.map((dynasty) => ({ url: `${base}/dynasty/${dynasty.slug}` })),
    ...topics.map((topic) => ({ url: `${base}/topics/${topic.slug}` })),
  ];
}
