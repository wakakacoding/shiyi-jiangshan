import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAllAuthors, getAllPoems } from "@/lib/content";
import { BrowsePoems } from "@/components/browse/browse-poems";

export const metadata: Metadata = { title: "寻诗 · 全部作品", description: "按朝代、作者、题材与体裁浏览诗词，并搜索标题、作者、原文和赏析内容。" };

export default function PoemsPage() {
  return (
    <>
      <header className="page-intro page-shell">
        <nav className="breadcrumbs" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><span>寻诗</span></nav>
        <h1>循诗入境</h1>
        <p>从一句诗、一个名字，或一种意境开始。让搜索成为一次不经意的相遇。</p>
      </header>
      <Suspense fallback={<div className="browse-section page-shell"><div className="empty-state">正在整理诗词…</div></div>}>
        <BrowsePoems poems={getAllPoems()} authors={getAllAuthors()} />
      </Suspense>
    </>
  );
}
