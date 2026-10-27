"use client";

// Rendered on the client so the static footer never shows a stale year.
export function CurrentYear() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
