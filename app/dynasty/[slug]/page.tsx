import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorById, getPoemsByDynasty } from "@/lib/content";
import { dynasties, getDynastyBySlug } from "@/lib/taxonomy";
import { PoemCard } from "@/components/poem/poem-card";

export const dynamicParams = false;
type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return dynasties.map((dynasty) => ({ slug: dynasty.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dynasty = getDynastyBySlug((await params).slug);
  return dynasty ? { title: `${dynasty.name}诗词赏析`, description: dynasty.description } : {};
}

export default async function DynastyPage({ params }: PageProps) {
  const dynasty = getDynastyBySlug((await params).slug);
  if (!dynasty) notFound();
  const poems = getPoemsByDynasty(dynasty.name);
  return (
    <>
      <header className="page-intro page-shell">
        <nav className="breadcrumbs" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><span>{dynasty.name}诗词</span></nav>
        <h1>{dynasty.name}诗词</h1>
        <p>{dynasty.description}</p>
        <div className="page-count">收录 {poems.length} 首作品</div>
      </header>
      <div className="page-shell collection-content"><div className="poem-grid">{poems.map((poem, index) => <PoemCard key={poem.slug} poem={poem} authorName={getAuthorById(poem.authorId)?.name ?? "佚名"} index={index} />)}</div></div>
    </>
  );
}
