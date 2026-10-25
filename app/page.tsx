import Image from "next/image";
import Link from "next/link";
import { getAllAuthors, getAllPoems, getAuthorById, getPoemBySlug } from "@/lib/content";
import { dynasties, topics } from "@/lib/taxonomy";
import { PoemCard } from "@/components/poem/poem-card";
import { ArrowRightIcon, ArrowUpRightIcon } from "@/components/ui/icons";

export default function HomePage() {
  const poems = getAllPoems();
  const authors = getAllAuthors();
  const heroPoem = getPoemBySlug("shan-ju-qiu-ming");
  if (!heroPoem) throw new Error("缺少首页精选诗词");
  const featured = poems.filter((poem) => poem.featured && poem.slug !== heroPoem.slug).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="page-shell hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">中国古诗词赏析 · V1.0 beta</div>
            <h1 className="hero-title">一山一水，<br /><span>皆有诗意。</span></h1>
            <p className="hero-description">从《诗经》的芦苇水岸，到唐宋的明月与风雨。读原文，知其事，会其意，听见千年前的回声。</p>
            <div className="hero-actions">
              <Link href="/poems" className="button button-primary">循诗入境 <ArrowRightIcon width={18} height={18} /></Link>
              <Link href={`/poems/${heroPoem.slug}`} className="button button-quiet">今日一诗 <ArrowUpRightIcon width={17} height={17} /></Link>
            </div>
            <div className="hero-stats" aria-label="网站内容统计">
              <div className="hero-stat"><strong>{poems.length}</strong><span>首精选</span></div>
              <div className="hero-stat"><strong>{authors.length}</strong><span>位作者</span></div>
              <div className="hero-stat"><strong>{topics.length}</strong><span>类意境</span></div>
            </div>
          </div>

          <div className="hero-art-wrap">
            <Link href={`/poems/${heroPoem.slug}`} aria-label={`赏析${heroPoem.title}`}>
              <figure className="hero-art">
                <Image src={heroPoem.image.src} alt={heroPoem.image.alt} width={heroPoem.image.width} height={heroPoem.image.height} priority sizes="(max-width: 860px) 90vw, 44vw" />
                <figcaption className="hero-art-caption">
                  <div><strong>{heroPoem.title}</strong><small>{heroPoem.dynasty} · {getAuthorById(heroPoem.authorId)?.name} · {heroPoem.genre}</small></div>
                  <span>明月松间照</span>
                </figcaption>
              </figure>
            </Link>
            <span className="hero-art-seal" aria-hidden="true">入境</span>
            <span className="vertical-note" aria-hidden="true">空山新雨后 · 天气晚来秋</span>
          </div>
        </div>
      </section>

      <section className="section section-bordered">
        <div className="page-shell">
          <div className="section-heading">
            <div><span className="section-kicker">EDITOR&apos;S SELECTION</span><h2>此刻，宜读诗</h2><p>精选意境深远的作品，从一声乌啼、一场夜雨，走进古人的心事。</p></div>
            <Link href="/poems" className="text-link">查看全部 {poems.length} 首 <ArrowRightIcon width={17} height={17} /></Link>
          </div>
          <div className="poem-grid">
            {featured.map((poem, index) => <PoemCard key={poem.slug} poem={poem} authorName={getAuthorById(poem.authorId)?.name ?? "佚名"} index={index} />)}
          </div>
        </div>
      </section>

      <section className="section section-bordered">
        <div className="page-shell">
          <div className="section-heading">
            <div><span className="section-kicker">THROUGH THE DYNASTIES</span><h2>沿着时间长河</h2></div>
            <p>每个时代都有自己的月色。<br />由诗入史，也由史懂诗。</p>
          </div>
          <div className="dynasty-grid">
            {dynasties.map((dynasty, index) => (
              <Link href={`/dynasty/${dynasty.slug}`} className="dynasty-card" key={dynasty.slug}>
                <span className="dynasty-number">{String(index + 1).padStart(2, "0")}</span>
                <ArrowUpRightIcon width={18} height={18} />
                <h3>{dynasty.name}</h3>
                <p>{dynasty.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section reading-method">
        <div className="page-shell method-grid">
          <div className="method-quote">
            <blockquote>此中有真意，<br />欲辨已忘言。</blockquote>
            <cite>东晋 · 陶渊明《饮酒·其五》</cite>
          </div>
          <div className="method-list">
            {[
              ["壹", "读其文", "保留规范标点与诗词分片，先听见字句本身的节奏。"],
              ["贰", "通其意", "以准确自然的白话译文，消除古今语言的隔膜。"],
              ["叁", "知其事", "回到时代与人生现场，理解文字背后的真实境遇。"],
              ["肆", "会其心", "从意象、章法与情怀出发，找到跨越千年的共鸣。"],
            ].map(([number, title, description]) => (
              <div className="method-item" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-shell">
          <div className="section-heading"><div><span className="section-kicker">REALMS OF POETRY</span><h2>因境寻诗</h2></div><p>心之所向，便有一首诗在那里等候。</p></div>
          <div className="topic-grid">
            {topics.map((topic) => (
              <Link href={`/topics/${topic.slug}`} className="topic-card" key={topic.slug}>
                <span className="topic-mark" aria-hidden="true">{topic.name.slice(0, 1)}</span>
                <div><strong>{topic.name}</strong><small>{topic.description}</small></div>
                <ArrowUpRightIcon width={17} height={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-invite page-shell">
        <span className="brand-seal" aria-hidden="true">诗</span>
        <h2>留一刻，给千年的月光</h2>
        <p>不必急着读懂所有。先选一首，让一幅山水、一段清音，陪你慢慢读完。</p>
        <Link href="/poems" className="button button-primary">选一首诗 <ArrowRightIcon width={18} height={18} /></Link>
      </section>
    </>
  );
}
