"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Author, Poem } from "@/lib/types";
import { browsePoems } from "@/lib/search";
import { dynasties, genres, topics } from "@/lib/taxonomy";
import { PoemCard } from "@/components/poem/poem-card";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

type FilterState = { q: string; dynasty: string; author: string; topic: string; genre: string };

const emptyFilters: FilterState = { q: "", dynasty: "", author: "", topic: "", genre: "" };

function readFilters(params: URLSearchParams): FilterState {
  return {
    q: params.get("q") ?? "",
    dynasty: params.get("dynasty") ?? "",
    author: params.get("author") ?? "",
    topic: params.get("topic") ?? "",
    genre: params.get("genre") ?? "",
  };
}

export function BrowsePoems({ poems, authors }: { poems: Poem[]; authors: Author[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => readFilters(searchParams));
  const { q: query, dynasty, author, topic, genre } = filters;
  const authorNames = useMemo(() => new Map(authors.map((item) => [item.id, item.name])), [authors]);
  const results = useMemo(() => browsePoems(poems, authors, filters), [poems, authors, filters]);
  const hasFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    const restoreFilters = () => setFilters(readFilters(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", restoreFilters);
    return () => window.removeEventListener("popstate", restoreFilters);
  }, []);

  function syncUrl(next: FilterState, replace = false) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => { if (value.trim()) params.set(key, value); });
    const suffix = params.size ? `?${params.toString()}` : "";
    window.history[replace ? "replaceState" : "pushState"](null, "", `${pathname}${suffix}`);
  }

  function updateQuery(value: string) {
    const next = { ...filters, q: value };
    setFilters(next);
    syncUrl(next, true);
  }

  function updateFilter(key: keyof Omit<FilterState, "q">, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    syncUrl(next);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    syncUrl(emptyFilters);
  }

  return (
    <section className="browse-section page-shell" aria-label="诗词搜索与筛选">
      <div className="browse-toolbar">
        <div className="search-form">
          <SearchIcon />
          <label htmlFor="poem-search" className="sr-only">搜索诗词</label>
          <input id="poem-search" className="search-input" type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="搜一句诗、一位作者，或一种心境…" autoComplete="off" />
          {query && <button type="button" className="search-clear" onClick={() => updateQuery("")} aria-label="清空搜索"><CloseIcon width={17} height={17} /></button>}
        </div>
        <div className="result-count" aria-live="polite">寻得 <strong>{results.length}</strong> 首</div>
      </div>

      <div className="browse-layout">
        <aside className="filter-panel" aria-label="组合筛选">
          <div className="filter-heading"><strong>细寻诗意</strong>{hasFilters && <button type="button" className="filter-reset" onClick={resetFilters}>全部清空</button>}</div>
          <div className="filter-group"><label htmlFor="filter-dynasty">朝代</label><select id="filter-dynasty" className="filter-select" value={dynasty} onChange={(event) => updateFilter("dynasty", event.target.value)}><option value="">全部朝代</option>{dynasties.map((item) => <option value={item.name} key={item.slug}>{item.name}</option>)}</select></div>
          <div className="filter-group"><label htmlFor="filter-author">作者</label><select id="filter-author" className="filter-select" value={author} onChange={(event) => updateFilter("author", event.target.value)}><option value="">全部作者</option>{authors.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
          <div className="filter-group"><label htmlFor="filter-topic">题材</label><select id="filter-topic" className="filter-select" value={topic} onChange={(event) => updateFilter("topic", event.target.value)}><option value="">全部题材</option>{topics.map((item) => <option value={item.name} key={item.slug}>{item.name}</option>)}</select></div>
          <div className="filter-group"><label htmlFor="filter-genre">体裁</label><select id="filter-genre" className="filter-select" value={genre} onChange={(event) => updateFilter("genre", event.target.value)}><option value="">全部体裁</option>{genres.map((item) => <option value={item} key={item}>{item}</option>)}</select></div>
          <p className="filter-note">分类可以叠加。试试“唐 · 山水田园”，或直接从一句“明月”开始。</p>
        </aside>

        <div>
          {results.length > 0 ? (
            <div className="poem-grid">{results.map((poem, index) => <PoemCard key={poem.slug} poem={poem} authorName={authorNames.get(poem.authorId) ?? "佚名"} index={index} priority={index < 3} />)}</div>
          ) : (
            <div className="empty-state"><div className="empty-mark" aria-hidden="true">觅</div><h2>暂未寻得这首诗</h2><p>换一个字句，或清空部分筛选条件。<br />也许下一首，正是你要找的。</p><button type="button" className="button button-primary" onClick={resetFilters}>查看全部诗词</button></div>
          )}
        </div>
      </div>
    </section>
  );
}
