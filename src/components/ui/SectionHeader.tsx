import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-cyan-400">
      <span aria-hidden className="h-px w-6 bg-cyan-400/70" />
      {children}
    </p>
  );
}

export function SectionHeader({ id, eyebrow, title, body, align = "left", as: Heading = "h2", className = "" }: Props) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading
        id={id}
        className={`font-display font-bold text-fg ${Heading === "h1" ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"}`}
      >
        {title}
      </Heading>
      {body ? <div className="mt-5 text-lg leading-relaxed text-fg-muted">{body}</div> : null}
    </div>
  );
}
