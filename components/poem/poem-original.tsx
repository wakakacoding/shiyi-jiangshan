import type { Poem } from "@/lib/types";

export function PoemOriginal({ poem }: { poem: Poem }) {
  return (
    <div className="original-wrap">
      <span className="original-seal" aria-hidden="true">诗意江山</span>
      {poem.preface && <p className="original-preface">{poem.preface}</p>}
      <div lang="zh-CN">
        {poem.original.map((stanza, index) => (
          <p className="original-stanza" key={`${poem.slug}-stanza-${index}`}>
            {stanza.map((line, lineIndex) => <span key={`${index}-${lineIndex}`}>{line}</span>)}
          </p>
        ))}
      </div>
    </div>
  );
}
