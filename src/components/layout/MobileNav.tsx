"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cta, primaryNav } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { isActive } from "./NavLinks";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close whenever the route changes.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-lg border border-line-strong text-fg hover:bg-ink-700"
      >
        <Icon name={open ? "close" : "menu"} className="size-5" />
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      {/* Explicit height: the header's backdrop-filter makes it the containing block for this fixed panel. */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-ink-900/98 backdrop-blur-xl"
      >
        <nav aria-label="Mobile" className="px-4 py-6 sm:px-6">
          <ul className="divide-y divide-line">
            {primaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between py-4 font-display text-lg font-semibold ${active ? "text-accent-400" : "text-fg"}`}
                  >
                    {item.label}
                    <Icon name="arrowRight" className="size-4 text-fg-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href={cta.href} onClick={() => setOpen(false)} className={buttonClasses({ size: "lg", className: "mt-8 w-full" })}>
            {cta.navLabel}
          </Link>
        </nav>
      </div>
    </div>
  );
}
