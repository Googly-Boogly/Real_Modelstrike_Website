import Link from "next/link";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="ms-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#111c30" stroke="#2b3c5e" />
      <path d="M8 22V10l8 7 8-7v12" fill="none" stroke="url(#ms-mark)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="17" r="2.2" fill="#f8fafc" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md" aria-label="ModelStrike — home">
      <LogoMark />
      <span className="font-display text-[1.05rem] font-bold tracking-tight text-fg">
        Model<span className="text-accent-400">Strike</span>
      </span>
    </Link>
  );
}
