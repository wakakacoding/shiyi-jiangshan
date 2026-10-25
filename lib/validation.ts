import { z } from "zod";

const mediaSchema = z.object({
  src: z.string().min(1),
  title: z.string().optional(),
  alt: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  credit: z.string().min(1),
  license: z.string().min(1),
});

export const authorSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  dynasty: z.string().min(1),
  years: z.string().min(1),
  biography: z.string().min(20),
  writingStyle: z.string().min(20),
});

export const poemSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  tune: z.string().optional(),
  preface: z.string().optional(),
  dynasty: z.string().min(1),
  authorId: z.string().min(1),
  genre: z.string().min(1),
  topics: z.array(z.string().min(1)).min(1),
  original: z.array(z.array(z.string().min(1)).min(1)).min(1),
  translation: z.array(z.string().min(1)).min(1),
  background: z.array(z.string().min(1)).min(1),
  appreciation: z.array(z.string().min(1)).min(1),
  reflection: z.array(z.string().min(1)).min(1),
  featured: z.boolean(),
  image: mediaSchema.extend({
    alt: z.string().min(8),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  audio: mediaSchema.extend({ title: z.string().min(1) }),
  sources: z.array(z.object({
    title: z.string().min(1),
    publisher: z.string().optional(),
    note: z.string().optional(),
    url: z.string().url().optional(),
  })).min(1),
});

export function uniqueBy<T>(items: T[], getKey: (item: T) => string, label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) throw new Error(`${label}重复：${key}`);
    seen.add(key);
  }
}
