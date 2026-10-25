import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dynasties, genres, topics } from "../lib/taxonomy";
import type { Poem } from "../lib/types";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(projectRoot, "public");
const dynastyNames = new Set<string>(dynasties.map((dynasty) => dynasty.name));
const topicNames = new Set<string>(topics.map((topic) => topic.name));
const genreNames = new Set<string>(genres);
const audioPaths = new Set([
  "/audio/moonlight.m4a",
  "/audio/mountain-rain.m4a",
  "/audio/river-night.m4a",
  "/audio/wind-and-blossom.m4a",
]);

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function validatePoemContent(poem: Poem): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(`${poem.slug}：${message}`);

  if (!dynastyNames.has(poem.dynasty)) fail(`未知朝代“${poem.dynasty}”`);
  if (!genreNames.has(poem.genre)) fail(`未知体裁“${poem.genre}”`);
  if (poem.topics.length > 2) fail("题材超过两个");
  if (new Set(poem.topics).size !== poem.topics.length) fail("题材重复");
  for (const topic of poem.topics) {
    if (!topicNames.has(topic)) fail(`未知题材“${topic}”`);
  }

  if (
    poem.original.length === 0 ||
    poem.original.some((section) =>
      section.length === 0 || section.some((line) => !hasText(line))
    )
  ) {
    fail("原文存在空分节或空行");
  }

  for (const field of ["translation", "background", "appreciation", "reflection"] as const) {
    if (poem[field].length === 0 || poem[field].some((paragraph) => !hasText(paragraph))) {
      fail(`${field} 存在空段落`);
    }
  }

  if (poem.sources.length === 0) {
    fail("缺少来源");
  }
  poem.sources.forEach((source, index) => {
    if (!hasText(source.title)) fail(`来源 ${index + 1} 缺少 title`);
    if (!source.publisher || !hasText(source.publisher)) fail(`来源 ${index + 1} 缺少 publisher`);
    if (!source.note || !hasText(source.note)) fail(`来源 ${index + 1} 缺少 note`);
  });

  const expectedImageSrc = `/images/poems/${poem.slug}.webp`;
  if (poem.image.src !== expectedImageSrc) fail(`图片路径应为 ${expectedImageSrc}`);
  if (poem.image.width !== 1536 || poem.image.height !== 1024) {
    fail("图片尺寸应为 1536×1024");
  }
  if (!hasText(poem.image.alt)) fail("图片缺少 alt");
  if (poem.image.credit !== "诗意江山原创水墨插画") fail("图片 credit 不符合素材方案");
  if (poem.image.license !== "诗意江山项目素材") fail("图片 license 不符合素材方案");
  if (!audioPaths.has(poem.audio.src)) fail(`音频路径不在允许清单中：${poem.audio.src}`);
  if (!hasText(poem.audio.title)) fail("音频缺少 title");
  if (poem.audio.credit !== "诗意江山程序化生成") fail("音频 credit 不符合素材方案");
  if (poem.audio.license !== "本站原创，可随本站使用") fail("音频 license 不符合素材方案");

  return errors;
}

async function main() {
  const { getAllAuthors, getAllPoems } = await import("../lib/content");
  const authors = getAllAuthors();
  const poems = getAllPoems();

  console.log(`结构校验：通过（Zod schema、作者 id / 诗篇 slug 唯一、作者引用有效）`);
  console.log(`数据规模：${authors.length} 位作者，${poems.length} 首作品，${poems.filter((poem) => poem.featured).length} 首首页精选。`);

  const contentErrors = poems.flatMap(validatePoemContent);
  for (const author of authors) {
    if (!dynastyNames.has(author.dynasty)) {
      contentErrors.push(`${author.id}：未知朝代“${author.dynasty}”`);
    }
  }

  if (contentErrors.length === 0) {
    console.log("完整性校验：通过（原文、译文、背景、赏析、情怀、来源、题材及媒体元数据）");
  } else {
    console.error(`完整性校验：发现 ${contentErrors.length} 个问题`);
    contentErrors.forEach((error) => console.error(`  - ${error}`));
  }

  const assetPaths = [...new Set(poems.flatMap((poem) => [poem.image.src, poem.audio.src]))];
  const missingAssets = assetPaths.filter((src) => {
    if (!src.startsWith("/")) return true;
    return !existsSync(path.join(publicRoot, src.slice(1)));
  });

  if (missingAssets.length === 0) {
    console.log(`素材校验：通过（${assetPaths.length} 个本地图片、音频文件均存在）`);
  } else {
    console.error(`素材校验：缺少 ${missingAssets.length} 个本地文件`);
    missingAssets.forEach((src) => console.error(`  - public${src}`));
  }

  if (contentErrors.length > 0 || missingAssets.length > 0) {
    console.error(
      `校验结果：未通过（内容问题 ${contentErrors.length} 个，素材缺失 ${missingAssets.length} 个）。`
    );
    process.exitCode = 1;
    return;
  }

  console.log("校验结果：全部通过。");
}

main().catch((error: unknown) => {
  console.error("结构校验：失败");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
