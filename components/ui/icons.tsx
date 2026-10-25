import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ArrowRightIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function ArrowUpRightIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M7 17 17 7M7 7h10v10" /></svg>;
}

export function SearchIcon(props: IconProps) {
  return <svg {...base} {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

export function PlayIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m9 6 9 6-9 6Z" fill="currentColor" stroke="none" /></svg>;
}

export function PauseIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M8 6v12M16 6v12" strokeWidth="2.4" /></svg>;
}

export function FilterIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
}

export function ChevronDownIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m7 10 5 5 5-5" /></svg>;
}

export function MusicIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M9 18V6l10-2v12M9 9l10-2" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></svg>;
}

export function CloseIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
