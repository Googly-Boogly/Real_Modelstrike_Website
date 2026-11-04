"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { tourSteps, type TourAction, type TourState, type TourTarget } from "@/lib/demo/tour";

export const GUIDED_DEMO_EVENT = "modelstrike:guided-demo";

/** Starts the guided demo from anywhere on the page (e.g. the server-rendered hero). */
export function GuidedDemoButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(GUIDED_DEMO_EVENT))} className={buttonClasses({ variant: "secondary", size: "lg", className })}>
      <Icon name="play" className="size-4" />
      Guided Demo
    </button>
  );
}

type Box = { top: number; left: number; width: number; height: number };

const PAD = 8;
const CARD_W = 360;

function sameBox(a: Box | null, b: Box | null) {
  return a === b || (a !== null && b !== null && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);
}

const isTyping = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * Spotlights one part of the page at a time with a short explanation. The page
 * stays fully usable underneath (the overlay never captures clicks), so a
 * visitor or a salesperson can try each step while the tour is open.
 */
export function GuidedDemo({ tour, onAction, onEnter }: { tour: TourState; onAction: (a: TourAction) => void; onEnter: (target: TourTarget) => void }) {
  const id = useId();
  const step = tour.active ? tourSteps[tour.index] : null;
  const [box, setBox] = useState<Box | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [cardHeight, setCardHeight] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const onEnterRef = useRef(onEnter);
  useLayoutEffect(() => {
    onEnterRef.current = onEnter;
  });

  // Remember where focus was so it can go back when the tour closes.
  useEffect(() => {
    if (tour.active) {
      if (!returnFocus.current) returnFocus.current = document.activeElement as HTMLElement | null;
    } else if (returnFocus.current) {
      const el = returnFocus.current;
      returnFocus.current = null;
      if (el.isConnected) el.focus({ preventScroll: true });
    }
  }, [tour.active]);

  // On each step: prepare the page, scroll the target into view, focus the explanation.
  const target = step?.target;
  useEffect(() => {
    if (!target) return;
    onEnterRef.current(target);
    const frame = requestAnimationFrame(() => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
      headingRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);

  // Follow the target through scrolling, resizing and layout changes.
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      const r = el?.getBoundingClientRect();
      const next = r && r.width > 0 ? { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) } : null;
      setBox((prev) => (sameBox(prev, next) ? prev : next));
      setViewport((prev) => (prev.w === window.innerWidth && prev.h === window.innerHeight ? prev : { w: window.innerWidth, h: window.innerHeight }));
      const h = cardRef.current?.offsetHeight ?? 0;
      setCardHeight((prev) => (prev === h ? prev : h));
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [target]);

  // Keyboard: arrows to move, Escape to leave. Typing in a field is never intercepted.
  useEffect(() => {
    if (!tour.active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAction({ type: "exit" });
      else if (isTyping(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      else if (e.key === "ArrowRight") onAction({ type: "next" });
      else if (e.key === "ArrowLeft") onAction({ type: "prev" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tour.active, onAction]);

  if (!step) return null;
  const last = tour.index === tourSteps.length - 1;

  // Card placement: a bottom sheet on small screens; otherwise just below or
  // above the target, whichever fits entirely on screen, else the corner.
  const small = viewport.w > 0 && viewport.w < 640;
  let cardStyle: React.CSSProperties | undefined;
  if (!small && box && viewport.w > 0) {
    const h = cardHeight || 300;
    const left = Math.min(Math.max(12, box.left), viewport.w - CARD_W - 12);
    const below = box.top + box.height + PAD + 12;
    const above = box.top - PAD - 12 - h;
    if (below + h <= viewport.h - 12) cardStyle = { top: below, left };
    else if (above >= 12) cardStyle = { top: above, left };
    else cardStyle = { bottom: 16, right: 16 };
  }

  return (
    <>
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-40 rounded-2xl ring-2 ring-cyan-400 transition-all duration-200"
          style={{ top: box.top - PAD, left: box.left - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2, boxShadow: "0 0 0 9999px rgb(7 12 24 / 0.62)" }}
        />
      ) : null}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        className={`demo-in fixed z-50 rounded-2xl border border-accent-400/40 bg-ink-800 p-5 shadow-2xl shadow-black/50 ${small || !cardStyle ? "inset-x-3 bottom-3" : ""}`}
        style={small ? undefined : { width: CARD_W, ...(cardStyle ?? { bottom: 16, right: 16 }) }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-400">
            Guided Demo · Step {tour.index + 1} of {tourSteps.length}
          </p>
          <button type="button" onClick={() => onAction({ type: "exit" })} aria-label="Exit guided demo" className="-m-1.5 rounded-md p-1.5 text-fg-muted hover:text-fg">
            <Icon name="close" className="size-4" />
          </button>
        </div>
        <h2 id={`${id}-title`} ref={headingRef} tabIndex={-1} className="mt-2 font-display text-lg font-bold text-fg focus:outline-none">
          {step.title}
        </h2>
        <p id={`${id}-body`} className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          {step.body}
        </p>
        <div className="mt-3 flex gap-1" aria-hidden>
          {tourSteps.map((s, i) => (
            <span key={s.target} className={`h-1 flex-1 rounded-full ${i <= tour.index ? "bg-accent-500" : "bg-ink-600"}`} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => onAction({ type: "prev" })} disabled={tour.index === 0} className={buttonClasses({ variant: "secondary", className: "px-3" })}>
            Back
          </button>
          <div className="flex gap-2">
            {last ? (
              <button type="button" onClick={() => onAction({ type: "restart" })} className={buttonClasses({ variant: "secondary", className: "px-3" })}>
                <Icon name="refresh" className="size-4" />
                Restart
              </button>
            ) : null}
            <button type="button" onClick={() => onAction({ type: "next" })} className={buttonClasses({ className: "px-4" })}>
              {last ? "Finish" : "Next"}
              {last ? null : <Icon name="arrowRight" className="size-4" />}
            </button>
          </div>
        </div>
        <p className="mt-3 hidden text-[11px] text-fg-subtle sm:block">Use ← → to move, Esc to exit.</p>
      </div>
    </>
  );
}
