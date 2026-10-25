import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="not-found">
      <div><div className="not-found-mark" aria-hidden="true">空</div><h1>此处无诗，只有山色</h1><p>你寻找的页面或许已经改名，也可能尚未被收录。</p><Link href="/poems" className="button button-primary">回到诗词集 <ArrowRightIcon width={18} height={18} /></Link></div>
    </div>
  );
}
