import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-driven scenes. A Scene is a tall section with a pinned stage. Its
 * scroll progress goes to children through useScene and to CSS as variables:
 *   --enter  0 -> 1 while the section's top rises from the bottom of the screen to the nav
 *   --p      0 -> 1 while the stage is pinned
 *   --exit   0 -> 1 while the section's bottom rises from the bottom of the screen to the nav
 * Neighbouring sections share an edge, so one scene's exit is the next one's enter.
 * One rAF-batched scroll handler serves every scene on the page.
 */

export interface Progress { enter: number; p: number; exit: number }
type Listener = (pr: Progress) => void;

const NAV = 64; // the fixed navbar; stages pin just below it

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Where p sits inside [a, b], as 0..1. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => t * t * (3 - 2 * t);

const scenes = new Map<HTMLElement, Set<Listener>>();
let queued = false;

function measure() {
  queued = false;
  const vh = window.innerHeight, view = vh - NAV;
  scenes.forEach((listeners, el) => {
    const r = el.getBoundingClientRect();
    const travel = r.height - view;
    const pr: Progress = {
      enter: clamp01((vh - r.top) / view),
      p: travel > 0 ? clamp01((NAV - r.top) / travel) : r.top <= NAV ? 1 : 0,
      exit: clamp01((vh - r.bottom) / view),
    };
    el.style.setProperty("--enter", pr.enter.toFixed(4));
    el.style.setProperty("--p", pr.p.toFixed(4));
    el.style.setProperty("--exit", pr.exit.toFixed(4));
    listeners.forEach((l) => l(pr));
  });
}

const queue = () => {
  if (!queued) { queued = true; requestAnimationFrame(measure); }
};

const Ctx = createContext<Set<Listener> | null>(null);

export function Scene({ height, pin = true, id, className = "", children }: {
  height?: string; pin?: boolean; id?: string; className?: string; children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const listeners = useRef(new Set<Listener>()).current;
  useEffect(() => {
    const el = ref.current!;
    scenes.set(el, listeners);
    if (scenes.size === 1) {
      window.addEventListener("scroll", queue, { passive: true });
      window.addEventListener("resize", queue);
    }
    queue();
    return () => {
      scenes.delete(el);
      if (scenes.size === 0) {
        window.removeEventListener("scroll", queue);
        window.removeEventListener("resize", queue);
      }
    };
  }, [listeners]);
  return (
    <Ctx.Provider value={listeners}>
      <section ref={ref} id={id} className="relative" style={{ height }}>
        <div className={`${pin ? "sticky top-16 h-[calc(100svh-4rem)]" : ""} ${className}`}>{children}</div>
      </section>
    </Ctx.Provider>
  );
}

/** Calls `fn` with the enclosing Scene's progress on every scroll frame. Touch the DOM in it, not state. */
export function useScene(fn: Listener) {
  const listeners = useContext(Ctx);
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    if (!listeners) return;
    const l: Listener = (pr) => latest.current(pr);
    listeners.add(l);
    queue();
    return () => { listeners.delete(l); };
  }, [listeners]);
}

/** A number that counts up while the scene scrolls through `range`. */
export function Count({ to, from = 0, range: [a, b], decimals = 0, prefix = "", suffix = "" }: {
  to: number; from?: number; range: [number, number]; decimals?: number; prefix?: string; suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = (v: number) => `${Math.abs(v) < 0.5 ? "" : prefix}${v.toFixed(decimals)}${suffix}`;
  useScene(({ p }) => { ref.current!.textContent = text(lerp(from, to, ease(seg(p, a, b)))); });
  return (
    <>
      <span ref={ref} aria-hidden="true">{text(from)}</span>
      <span className="sr-only">{text(to)}</span>
    </>
  );
}

/** A heading whose words light up one after another while the scene scrolls through `range`. */
export function Words({ text, range: [a, b], className }: { text: string; range: [number, number]; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useScene(({ p }) => {
    const words = ref.current!.children, n = words.length, s = (b - a) / (n + 1);
    for (let i = 0; i < n; i++) (words[i] as HTMLElement).style.opacity = String(0.16 + 0.84 * seg(p, a + i * s, a + (i + 2) * s));
  });
  return (
    <h2 ref={ref} className={className}>
      {text.split(" ").map((w, i) => <span key={i} className="transition-opacity duration-200">{w} </span>)}
    </h2>
  );
}
