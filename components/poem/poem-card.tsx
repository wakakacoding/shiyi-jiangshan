import Image from "next/image";
import Link from "next/link";
import type { Poem } from "@/lib/types";
import { poemExcerpt } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/ui/icons";

export function PoemCard({ poem, authorName, index, priority = false }: {
  poem: Poem;
  authorName: string;
  index?: number;
  priority?: boolean;
}) {
  return (
    <article className="poem-card">
      <Link href={`/poems/${poem.slug}`} className="poem-card-image" tabIndex={-1} aria-hidden="true">
        <Image
          src={poem.image.src}
          alt=""
          width={poem.image.width}
          height={poem.image.height}
          sizes="(max-width: 620px) 100vw, (max-width: 860px) 50vw, 33vw"
          priority={priority}
        />
        {typeof index === "number" && <span className="card-index">{String(index + 1).padStart(2, "0")}</span>}
      </Link>
      <div className="card-meta">
        <span>{poem.dynasty}</span><i />
        <span>{authorName}</span><i />
        <span>{poem.genre}</span>
      </div>
      <h3><Link href={`/poems/${poem.slug}`}>{poem.title}</Link></h3>
      <p className="card-excerpt">{poemExcerpt(poem)}</p>
      <div className="card-footer">
        <span>{poem.topics.join(" · ")}</span>
        <ArrowRightIcon width={18} height={18} />
      </div>
    </article>
  );
}
