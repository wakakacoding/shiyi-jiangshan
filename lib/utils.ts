import type { Poem } from "@/lib/types";
import { dynasties, topics } from "@/lib/taxonomy";

export function poemExcerpt(poem: Poem, lineCount = 2) {
  return poem.original.flat().slice(0, lineCount).join(" ");
}

export function dynastySlug(name: string) {
  return dynasties.find((item) => item.name === name)?.slug ?? name;
}

export function topicSlug(name: string) {
  return topics.find((item) => item.name === name)?.slug ?? name;
}

export function clampText(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
