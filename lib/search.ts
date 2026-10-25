import Fuse from "fuse.js";
import type { Author, BrowseFilters, Poem } from "@/lib/types";

type SearchRecord = {
  poem: Poem;
  title: string;
  authorName: string;
  original: string;
  topics: string;
  translation: string;
  context: string;
};

function toRecord(poem: Poem, authorName: string): SearchRecord {
  return {
    poem,
    title: poem.title,
    authorName,
    original: poem.original.flat().join(" "),
    topics: [...poem.topics, poem.genre, poem.dynasty].join(" "),
    translation: poem.translation.join(" "),
    context: [...poem.background, ...poem.appreciation, ...poem.reflection].join(" "),
  };
}

export function browsePoems(poems: Poem[], authors: Author[], filters: BrowseFilters) {
  const authorNames = new Map(authors.map((author) => [author.id, author.name]));
  const filtered = poems.filter((poem) => {
    if (filters.dynasty && poem.dynasty !== filters.dynasty) return false;
    if (filters.author && poem.authorId !== filters.author) return false;
    if (filters.topic && !poem.topics.includes(filters.topic)) return false;
    if (filters.genre && poem.genre !== filters.genre) return false;
    return true;
  });
  const query = filters.q?.trim().replace(/\s+/g, " ");
  if (!query) return filtered;

  const records = filtered.map((poem) => toRecord(poem, authorNames.get(poem.authorId) ?? "佚名"));
  const fuse = new Fuse(records, {
    keys: [
      { name: "title", weight: 0.3 },
      { name: "authorName", weight: 0.2 },
      { name: "original", weight: 0.22 },
      { name: "topics", weight: 0.1 },
      { name: "translation", weight: 0.1 },
      { name: "context", weight: 0.08 },
    ],
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.25,
    minMatchCharLength: 1,
  });
  return fuse.search(query).map((result) => result.item.poem);
}
