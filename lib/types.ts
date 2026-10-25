export type MediaAsset = {
  src: string;
  title?: string;
  alt?: string;
  width?: number;
  height?: number;
  credit: string;
  license: string;
};

export type Source = {
  title: string;
  publisher?: string;
  note?: string;
  url?: string;
};

export type Poem = {
  slug: string;
  title: string;
  tune?: string;
  preface?: string;
  dynasty: string;
  authorId: string;
  genre: string;
  topics: string[];
  original: string[][];
  translation: string[];
  background: string[];
  appreciation: string[];
  reflection: string[];
  featured: boolean;
  image: MediaAsset & { alt: string; width: number; height: number };
  audio: MediaAsset & { title: string };
  sources: Source[];
};

export type Author = {
  id: string;
  name: string;
  dynasty: string;
  years: string;
  biography: string;
  writingStyle: string;
};

export type BrowseFilters = {
  q?: string;
  dynasty?: string;
  author?: string;
  topic?: string;
  genre?: string;
};

export type AudioTrack = {
  src: string;
  title: string;
  poemSlug: string;
  poemTitle: string;
};
