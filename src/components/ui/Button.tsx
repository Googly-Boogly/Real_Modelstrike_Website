import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent-600 text-white shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_8px_24px_-8px_rgb(37_99_235/0.6)] hover:bg-accent-700",
  secondary: "border border-line-strong bg-ink-800/60 text-fg hover:border-accent-400/60 hover:bg-ink-700",
  ghost: "text-accent-400 hover:text-accent-300",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
};

export function buttonClasses({ variant = "primary", size = "md", className = "" }: { variant?: Variant; size?: Size; className?: string } = {}) {
  const sizing = variant === "ghost" ? "text-sm" : sizes[size];
  return `${base} ${variants[variant]} ${sizing} ${className}`.trim();
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  arrow?: boolean;
  children: ReactNode;
};

export function ButtonLink({ variant, size, className, arrow, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {children}
      {arrow ? <Icon name="arrowRight" className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" /> : null}
    </Link>
  );
}
