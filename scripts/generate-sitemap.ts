import { mkdir, writeFile } from "node:fs";
import path from "node:path";
import { getAllAuthors, getAllPoems } from "../lib/content";
import { dynasties, topics } from "../lib/taxonomy";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const urls = [
  ...["", "/poems", "/about"].map((p) => `${base}${p}`),
  ...getAllPoems().map((poem) => `${base}/poems/${poem.slug}`),
  ...getAllAuthors().map((author) => `${base}/authors/${author.id}`),
  ...dynasties.map((dynasty) => `${base}/dynasty/${dynasty.slug}`),
  ...topics.map((topic) => `${base}/topics/${topic.slug}`),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((url) => `  <url><loc>${url}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

const outPath = path.join(process.cwd(), "public", "sitemap.xml");
mkdir(path.dirname(outPath), { recursive: true }, () => {
  writeFile(outPath, xml, "utf8", () => {
    console.log(`sitemap.xml：${urls.length} 个 URL 已写入 public/sitemap.xml`);
  });
});
