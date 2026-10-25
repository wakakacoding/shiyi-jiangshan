import { describe, expect, it } from "vitest";
import { browsePoems } from "@/lib/search";
import type { Author, Poem } from "@/lib/types";

const authors: Author[] = [
  { id: "wang-wei", name: "王维", dynasty: "唐", years: "701—761", biography: "王维的生平与山水田园创作。", writingStyle: "诗中有画，语言清新而意境深远。" },
  { id: "su-shi", name: "苏轼", dynasty: "宋", years: "1037—1101", biography: "苏轼经历丰富，诗文词皆有成就。", writingStyle: "词境开阔，在悲欢中表现旷达襟怀。" },
];

function makePoem(overrides: Partial<Poem>): Poem {
  return {
    slug: "sample", title: "示例", dynasty: "唐", authorId: "wang-wei", genre: "五言律诗",
    topics: ["山水田园"], original: [["空山新雨后，"]], translation: ["山中刚下过一场雨。"],
    background: ["此诗作于山居时期。"], appreciation: ["诗中动静相衬。"], reflection: ["人与自然相亲。"],
    featured: false,
    image: { src: "/images/poems/sample.webp", alt: "山野与清泉的水墨插画", width: 1536, height: 1024, credit: "原创", license: "项目素材" },
    audio: { src: "/audio/moonlight.m4a", title: "松间月", credit: "程序化生成", license: "本站原创" },
    sources: [{ title: "测试来源" }], ...overrides,
  };
}

const poems = [
  makePoem({ slug: "shan-ju", title: "山居秋暝", original: [["明月松间照，", "清泉石上流。"]], translation: ["明月照进松林。"] }),
  makePoem({ slug: "jiang-xue", title: "江雪", authorId: "wang-wei", genre: "五言绝句", original: [["孤舟蓑笠翁，", "独钓寒江雪。"]] }),
  makePoem({ slug: "shui-diao", title: "水调歌头·明月几时有", dynasty: "宋", authorId: "su-shi", genre: "词", topics: ["思乡怀人", "人生哲理"], original: [["明月几时有？把酒问青天。"]], appreciation: ["在宇宙人生中转入旷达。"] }),
];

describe("browsePoems", () => {
  it("returns every poem when no filter is active", () => {
    expect(browsePoems(poems, authors, { q: "  " })).toHaveLength(3);
  });

  it("combines dynasty, topic, genre and author filters", () => {
    expect(browsePoems(poems, authors, { dynasty: "唐", topic: "山水田园" })).toHaveLength(2);
    expect(browsePoems(poems, authors, { dynasty: "唐", topic: "山水田园", genre: "五言律诗", author: "wang-wei" }).map((poem) => poem.slug)).toEqual(["shan-ju"]);
  });

  it("searches title, author and original text", () => {
    expect(browsePoems(poems, authors, { q: "明月" })).toHaveLength(2);
    expect(browsePoems(poems, authors, { q: "王维" })).toHaveLength(2);
    expect(browsePoems(poems, authors, { q: "寒江雪" })[0].slug).toBe("jiang-xue");
  });

  it("searches editorial content and respects active filters", () => {
    expect(browsePoems(poems, authors, { q: "旷达" })[0].slug).toBe("shui-diao");
    expect(browsePoems(poems, authors, { q: "明月", dynasty: "宋" }).map((poem) => poem.slug)).toEqual(["shui-diao"]);
    expect(browsePoems(poems, authors, { q: "不存在的句子" })).toEqual([]);
  });
});
