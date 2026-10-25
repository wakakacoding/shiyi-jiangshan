export const dynasties = [
  { name: "先秦", slug: "xianqin", description: "诗乐相和，歌谣初起。在质朴复沓的歌唱中，听见中国诗歌悠远的回声。" },
  { name: "东晋", slug: "dongjin", description: "玄风轻拂，田园入诗。诗人重新发现自然，也重新安顿自身。" },
  { name: "唐", slug: "tang", description: "山河壮阔，气象万千。盛唐明月与边塞风雨，共同构成中国诗歌的高原。" },
  { name: "宋", slug: "song", description: "词心深婉，理趣悠长。把人生风雨、日常景物与旷达襟怀写入长短句。" },
] as const;

export const topics = [
  { name: "山水田园", slug: "landscape", description: "山川有清音，田园见本心。" },
  { name: "思乡怀人", slug: "longing", description: "月有盈亏，人有聚散，思念跨越千里。" },
  { name: "节令风物", slug: "seasons", description: "四时流转，花开花落皆有情。" },
  { name: "羁旅送别", slug: "journey", description: "孤舟远客，在旅途中辨认故乡与自我。" },
  { name: "人生哲理", slug: "philosophy", description: "把悲欢放进天地，在风雨中领会人生。" },
  { name: "爱情闲愁", slug: "romance", description: "婉约词心，写尽相遇、等待与无计消除的愁绪。" },
] as const;

export const genres = ["诗经", "古体诗", "五言绝句", "五言律诗", "七言绝句", "词"] as const;

export function getDynastyBySlug(slug: string) {
  return dynasties.find((item) => item.slug === slug);
}

export function getTopicBySlug(slug: string) {
  return topics.find((item) => item.slug === slug);
}
