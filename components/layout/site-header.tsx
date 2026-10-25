"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, ChevronDownIcon } from "@/components/ui/icons";

const navigation = [
  { href: "/poems", label: "寻诗" },
  { href: "/dynasty/tang", label: "唐诗" },
  { href: "/dynasty/song", label: "宋词" },
  { href: "/topics/landscape", label: "山水意境" },
  { href: "/about", label: "关于" },
];

function closeMenu(event: React.MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="header-inner page-shell">
        <Link href="/" className="brand" aria-label="诗意江山首页">
          <span className="brand-seal" aria-hidden="true">诗</span>
          <span className="brand-type">
            <strong>诗意江山</strong>
            <small>POETRY OF CHINA</small>
          </span>
          <span className="beta-badge">BETA</span>
        </Link>

        <nav className="desktop-nav" aria-label="主导航">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href === "/poems" && pathname.startsWith("/poems/"));
            return (
              <Link key={item.href} href={item.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/poems" className="header-cta">
          开始阅读 <ArrowUpRightIcon width={16} height={16} />
        </Link>

        <details className="mobile-nav">
          <summary aria-label="打开导航菜单">
            <span className="menu-line" /><span className="menu-line" />
            <span className="sr-only">菜单</span>
          </summary>
          <div className="mobile-nav-panel">
            <div className="mobile-menu-heading">循诗入境 <ChevronDownIcon /></div>
            {[{ href: "/", label: "首页" }, ...navigation].map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu}>{item.label}<span>↗</span></Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
