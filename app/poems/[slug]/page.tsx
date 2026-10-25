import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPoems, getAuthorById, getPoemBySlug, getRelatedPoems } from "@/lib/content";
import { dynastySlug, poemExcerpt, topicSlug } from "@/lib/utils";
import { PoemOriginal } from "@/components/poem/poem-original";
import { PoemSection } from "@/components/poem/poem-section";
import { PoemCard } from "@/components/poem/poem-card";
import { AudioButton } from "@/components/media/audio-button";
import { ArrowRightIcon } from "@/components/ui/icons";

export const dynamicParams = false;

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPoems().map((poem) => ({ slug: poem.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const poem = getPoemBySlug(slug);
  if (!poem) return {};
  const author = getAuthorById(poem.authorId);
  return {
    title: `${poem.title} · ${author?.name ?? "佚名"}`,
    description: `${poem.title}原文、白话译文、创作背景与作品赏析。${poemExcerpt(poem)}`,
    alternates: { canonical: `/poems/${poem.slug}` },
    openGraph: {
      title: `${poem.title}｜${author?.name ?? "佚名"}`,
      description: poemExcerpt(poem),
      images: [{ url: poem.image.src, width: poem.image.width, height: poem.image.height, alt: poem.image.alt }],
      type: "article",
    },
  };
}

const chapters = [
  ["original", "诗词原文"],
  ["translation", "白话译文"],
  ["background", "创作背景"],
  ["appreciation", "作品赏析"],
  ["reflection", "古意情怀"],
  ["author", "作者小传"],
  ["sources", "参考与素材"],
] as const;

export default async function PoemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const poem = getPoemBySlug(slug);
  if (!poem) notFound();
  const author = getAuthorById(poem.authorId);
  if (!author) throw new Error(`缺少作者资料：${poem.authorId}`);
  const poems = getAllPoems();
  const index = poems.findIndex((item) => item.slug === poem.slug);
  const previous = poems[(index - 1 + poems.length) % poems.length];
  const next = poems[(index + 1) % poems.length];
  const related = getRelatedPoems(poem, 3);
  const titleParts = poem.tune && poem.title.startsWith(`${poem.tune}·`)
    ? { tune: poem.tune, subtitle: poem.title.slice(poem.tune.length + 1) }
    : null;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: poem.title,
    inLanguage: "zh-CN",
    author: { "@type": "Person", name: author.name },
    image: [poem.image.src],
    articleSection: ["中国古诗词", poem.dynasty, ...poem.topics],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="detail-header page-shell">
        <nav className="breadcrumbs" aria-label="面包屑">
          <Link href="/">首页</Link><span aria-hidden="true">/</span>
          <Link href="/poems">寻诗</Link><span aria-hidden="true">/</span>
          <Link href={`/dynasty/${dynastySlug(poem.dynasty)}`}>{poem.dynasty}</Link><span aria-hidden="true">/</span>
          <span>{poem.title}</span>
        </nav>
        <div className="detail-heading">
          <span className="detail-kicker">{poem.genre} · {poem.topics.join(" · ")}</span>
          <h1 aria-label={poem.title}>
            {titleParts ? <><span>{titleParts.tune}</span><span className="detail-title-separator">·</span><span className="detail-subtitle">{titleParts.subtitle}</span></> : poem.title}
          </h1>
          <div className="detail-byline">
            <span>{poem.dynasty}</span><i />
            <Link href={`/authors/${author.id}`}>{author.name}</Link><i />
            <span>{author.years}</span>
          </div>
        </div>
      </header>

      <figure className="detail-artwork page-shell">
        <div className="artwork-frame">
          <Image src={poem.image.src} alt={poem.image.alt} width={poem.image.width} height={poem.image.height} priority sizes="(max-width: 1280px) 100vw, 1240px" />
        </div>
        <AudioButton track={{ src: poem.audio.src, title: poem.audio.title, poemSlug: poem.slug, poemTitle: poem.title }} />
        <figcaption className="artwork-caption"><span>{poem.image.alt}</span><span>{poem.image.credit} · {poem.image.license}</span></figcaption>
      </figure>

      <div className="detail-body page-shell">
        <div className="detail-layout">
          <article className="detail-content">
            <section id="original" className="poem-section" aria-labelledby="original-title">
              <div className="section-label"><span>壹</span><h2 id="original-title">诗词原文</h2></div>
              <PoemOriginal poem={poem} />
            </section>
            <PoemSection id="translation" number="贰" title="白话译文" paragraphs={poem.translation} />
            <PoemSection id="background" number="叁" title="创作背景" paragraphs={poem.background} />
            <PoemSection id="appreciation" number="肆" title="作品赏析" paragraphs={poem.appreciation} />
            <PoemSection id="reflection" number="伍" title="古意情怀" paragraphs={poem.reflection} className="reflection-section" />

            <section id="author" className="poem-section" aria-labelledby="author-title">
              <div className="section-label"><span>陆</span><h2 id="author-title">作者小传</h2></div>
              <div className="author-panel">
                <div className="author-panel-top">
                  <div className="author-identity">
                    <span className="author-monogram" aria-hidden="true">{author.name.slice(0, 1)}</span>
                    <div><h2>{author.name}</h2><span className="author-years">{author.dynasty} · {author.years}</span></div>
                  </div>
                </div>
                <div className="prose"><p>{author.biography}</p></div>
                <p className="author-style"><strong>创作风格　</strong>{author.writingStyle}</p>
                <Link href={`/authors/${author.id}`} className="text-link">读作者与全部作品 <ArrowRightIcon width={17} height={17} /></Link>
              </div>
            </section>

            <section id="sources" className="poem-section" aria-labelledby="sources-title">
              <div className="section-label"><span>柒</span><h2 id="sources-title">参考与素材</h2></div>
              <ul className="source-list">
                {poem.sources.map((source, sourceIndex) => (
                  <li key={`${source.title}-${sourceIndex}`}>
                    {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : source.title}
                    {source.publisher && ` · ${source.publisher}`}{source.note && `。${source.note}`}
                  </li>
                ))}
              </ul>
              <div className="asset-credits">配图：{poem.image.credit}（{poem.image.license}）<br />音乐：{poem.audio.title} · {poem.audio.credit}（{poem.audio.license}）</div>
            </section>

            <nav className="previous-next" aria-label="相邻诗词">
              <Link href={`/poems/${previous.slug}`}><small>← 上一首</small><strong>{previous.title}</strong></Link>
              <Link href={`/poems/${next.slug}`}><small>下一首 →</small><strong>{next.title}</strong></Link>
            </nav>
          </article>

          <aside className="detail-sidebar">
            <p className="sidebar-title">本篇目录</p>
            <nav className="chapter-nav" aria-label="本篇目录">
              {chapters.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
            </nav>
            <div className="sidebar-topics">
              <p className="sidebar-title">作品题材</p>
              <div className="tag-list">{poem.topics.map((topic) => <Link className="tag" href={`/topics/${topicSlug(topic)}`} key={topic}>{topic}</Link>)}</div>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related-section">
          <div className="page-shell">
            <div className="section-heading"><div><span className="section-kicker">KEEP READING</span><h2>诗意相续</h2></div><p>从相近的山水与心事出发，再读一首。</p></div>
            <div className="poem-grid">{related.map((item) => <PoemCard key={item.slug} poem={item} authorName={getAuthorById(item.authorId)?.name ?? "佚名"} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
