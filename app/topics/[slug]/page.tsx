import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorById, getPoemsByTopic } from "@/lib/content";
import { getTopicBySlug, topics } from "@/lib/taxonomy";
import { PoemCard } from "@/components/poem/poem-card";

export const dynamicParams = false;
type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const topic = getTopicBySlug((await params).slug);
  return topic ? { title: `${topic.name}诗词赏析`, description: topic.description } : {};
}

export default async function TopicPage({ params }: PageProps) {
  const topic = getTopicBySlug((await params).slug);
  if (!topic) notFound();
  const poems = getPoemsByTopic(topic.name);
  return (
    <>
      <header className="page-intro page-shell">
        <nav className="breadcrumbs" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><span>{topic.name}</span></nav>
        <h1>{topic.name}</h1>
        <p>{topic.description} 在相近的意象中，读不同作者、不同年代的心声。</p>
        <div className="page-count">收录 {poems.length} 首作品</div>
      </header>
      <div className="page-shell collection-content"><div className="poem-grid">{poems.map((poem, index) => <PoemCard key={poem.slug} poem={poem} authorName={getAuthorById(poem.authorId)?.name ?? "佚名"} index={index} />)}</div></div>
    </>
  );
}
