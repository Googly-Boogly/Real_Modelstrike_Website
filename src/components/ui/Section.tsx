import type { ComponentProps, ReactNode } from "react";

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

type SectionProps = ComponentProps<"section"> & { tone?: "base" | "raised"; containerClassName?: string };

export function Section({ tone = "base", className = "", containerClassName = "", children, ...props }: SectionProps) {
  const bg = tone === "raised" ? "bg-ink-800 border-y border-line" : "";
  return (
    <section className={`relative py-20 sm:py-28 ${bg} ${className}`} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
