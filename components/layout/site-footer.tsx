import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-main">
        <div className="footer-intro">
          <span className="brand-seal" aria-hidden="true">诗</span>
          <div>
            <strong>诗意江山</strong>
            <p>以诗为舟，与古人隔水相望。</p>
          </div>
        </div>
        <div className="footer-links">
          <div>
            <span>循诗</span>
            <Link href="/poems">全部作品</Link>
            <Link href="/dynasty/tang">唐代诗歌</Link>
            <Link href="/dynasty/song">宋代词作</Link>
          </div>
          <div>
            <span>入境</span>
            <Link href="/topics/landscape">山水田园</Link>
            <Link href="/topics/philosophy">人生哲理</Link>
            <Link href="/about">内容与版权</Link>
          </div>
        </div>
      </div>
      <div className="page-shell footer-bottom">
        <span>© {new Date().getFullYear()} 诗意江山</span>
        <span>V1.0 BETA · 内容持续校订中</span>
      </div>
    </footer>
  );
}
