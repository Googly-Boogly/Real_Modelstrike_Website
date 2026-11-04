"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Renders children except on the given path prefixes (e.g. the private onboarding flow, which has its own minimal header). */
export function HideOn({ prefixes, children }: { prefixes: string[]; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ? null : children;
}
