import authorsJson from "../content/authors.json";
import poemsJson from "../content/poems.json";
import type { Author, Poem } from "./types";
import { authorSchema, poemSchema, uniqueBy } from "./validation";

const authors: Author[] = authorSchema.array().parse(authorsJson);
const poems: Poem[] = poemSchema.array().parse(poemsJson);

uniqueBy(authors, (author) => author.id, "作者 id");
uniqueBy(poems, (poem) => poem.slug, "诗篇 slug");

const authorIds = new Set(authors.map((author) => author.id));
for (const poem of poems) {
  if (!authorIds.has(poem.authorId)) {
    throw new Error(`诗篇 ${poem.slug} 引用了不存在的作者：${poem.authorId}`);
  }
}

export function getAllPoems(): Poem[] {
  return poems;
}

export function getPoemBySlug(slug: string): Poem | undefined {
  return poems.find((poem) => poem.slug === slug);
}

export function getAllAuthors(): Author[] {
  return authors;
}

export function getAuthorById(id: string): Author | undefined {
  return authors.find((author) => author.id === id);
}

export function getPoemsByAuthor(authorId: string): Poem[] {
  return poems.filter((poem) => poem.authorId === authorId);
}

export function getPoemsByDynasty(dynasty: string): Poem[] {
  return poems.filter((poem) => poem.dynasty === dynasty);
}

export function getPoemsByTopic(topic: string): Poem[] {
  return poems.filter((poem) => poem.topics.includes(topic));
}

export function getPoemsByGenre(genre: string): Poem[] {
  return poems.filter((poem) => poem.genre === genre);
}

export function getFeaturedPoems(): Poem[] {
  return poems.filter((poem) => poem.featured);
}

export function getRelatedPoems(poem: Poem, limit = 3): Poem[] {
  return poems
    .filter((candidate) => candidate.slug !== poem.slug)
    .filter((candidate) =>
      candidate.authorId === poem.authorId ||
      candidate.topics.some((topic) => poem.topics.includes(topic))
    )
    .slice(0, limit);
}
