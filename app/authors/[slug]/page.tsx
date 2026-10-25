import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllAuthors, getAuthorById, getPoemsByAuthor } from "@/lib/content";
import { PoemCard } from "@/components/poem/poem-card";

export const dynamicParams = false;
type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllAuthors().map((author) => ({ slug: author.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const author = getAuthorById((await params).slug);
  return author ? { title: `${author.name} · 作者小传`, description: `${author.name}生平简介、创作风格与收录作品。` } : {};
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = getAuthorById(slug);
  if (!author) notFound();
  const poems = getPoemsByAuthor(author.id);

  return (
    <>
      <header className="author-hero">
        <div className="page-shell">
          <nav className="breadcrumbs" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><Link href="/poems">寻诗</Link><span aria-hidden="true">/</span><span>{author.name}</span></nav>
          <div className="author-hero-grid">
            <span className="author-large-mark" aria-hidden="true">{author.name.slice(0, 1)}</span>
            <div><span className="detail-kicker">{author.dynasty} · 作者小传</span><h1>{author.name}</h1><p>{author.years} · 本站收录 {poems.length} 首作品</p></div>
          </div>
        </div>
      </header>
      <div className="page-shell author-essays">
        <section className="author-essay"><span className="section-kicker">LIFE & CONTEXT</span><h2>生平与时代</h2><div className="prose"><p>{author.biography}</p></div></section>
        <section className="author-essay"><span className="section-kicker">VOICE & STYLE</span><h2>创作风格</h2><div className="prose"><p>{author.writingStyle}</p></div></section>
      </div>
      <section className="page-shell collection-content">
        <div className="section-heading"><div><span className="section-kicker">SELECTED WORKS</span><h2>代表作赏析</h2></div></div>
        <div className="poem-grid">{poems.map((poem, index) => <PoemCard key={poem.slug} poem={poem} authorName={author.name} index={index} />)}</div>
      </section>
    </>
  );
}
