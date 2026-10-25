import { useRef } from "react";
import { reducedMotion } from "./fish";
import { clamp01, ease, lerp, seg, useScene } from "./scene";

const LEVELS = [
  { label: "Family", value: 97.0, r: 128, color: "hsl(195 35% 72%)" },
  { label: "Genus", value: 94.2, r: 104, color: "hsl(178 45% 56%)" },
  { label: "Species", value: 87.6, r: 80, color: "hsl(168 70% 46%)" },
];

/**
 * Accuracy at each taxonomic level as nested arcs: family contains genus
 * contains species. The dial turns in and each arc fills as the scene scrolls
 * through `range`, one level after another.
 */
export function AccuracyRings({ range: [a, b] }: { range: [number, number] }) {
  const svg = useRef<SVGSVGElement>(null);
  const arcs = useRef<(SVGCircleElement | null)[]>([]);
  const nums = useRef<(HTMLElement | null)[]>([]);
  const w = (b - a) / 1.8, step = w * 0.4; // each arc fills over w, starting `step` after the one outside it

  useScene(({ p }) => {
    const dial = ease(seg(p, a, b));
    if (!reducedMotion()) svg.current!.style.transform = `rotate(${lerp(-150, -90, dial)}deg) scale(${lerp(0.88, 1, dial)})`;
    LEVELS.forEach((l, i) => {
      const t = ease(seg(p, a + i * step, a + i * step + w));
      arcs.current[i]!.setAttribute("stroke-dashoffset", String(2 * Math.PI * l.r * (1 - (l.value / 100) * t)));
      nums.current[i]!.textContent = `${(l.value * t).toFixed(1)}%`;
    });
  });

  return (
    <div className="flex items-center gap-6 sm:gap-14">
      <svg ref={svg} viewBox="0 0 300 300" className="w-36 shrink-0 -rotate-90 sm:w-64 md:w-80" aria-hidden="true">
        {LEVELS.map((l, i) => {
          const C = 2 * Math.PI * l.r;
          return (
            <g key={l.label}>
              <circle cx="150" cy="150" r={l.r} fill="none" stroke="hsl(var(--border))" strokeWidth="14" />
              <circle ref={(el) => { arcs.current[i] = el; }} cx="150" cy="150" r={l.r} fill="none" stroke={l.color}
                strokeWidth="14" strokeDasharray={C} strokeDashoffset={C} />
            </g>
          );
        })}
      </svg>
      <dl className="space-y-4 sm:space-y-6">
        {LEVELS.map((l, i) => (
          <div key={l.label} className="flex items-center gap-3 sm:gap-4">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: l.color }} />
            <div className="sm:flex sm:items-baseline sm:gap-4">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground sm:w-20 sm:text-sm">{l.label}</dt>
              <dd className="font-display text-3xl tabular-nums sm:text-5xl md:text-6xl">
                <span ref={(el) => { nums.current[i] = el; }} aria-hidden="true">0.0%</span>
                <span className="sr-only">{l.value.toFixed(1)}%</span>
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

// a small fish, facing right, in a 20 x 10 box
const GLYPH = "M19 5Q14 0 7 2.6L1 0L2.5 5L1 10L7 7.4Q14 10 19 5Z";
const CORAL = "hsl(var(--coral))", PALE = "hsl(190 30% 78%)";

/** Deterministic shuffle so the same fish drop out on every visit. */
function order(n: number, seed: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  let s = seed;
  for (let i = n - 1; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * 100 fish as a unit chart, driven by scroll through `range`. "vanish": `to`
 * of them turn coral and fade away. "turn": `from` start coral and more turn
 * until `to` are.
 */
export function FishGrid({ mode, from, to, range: [a, b] }: { mode: "vanish" | "turn"; from: number; to: number; range: [number, number] }) {
  const svg = useRef<SVGSVGElement>(null);
  const rank = useRef(order(100, mode === "vanish" ? 7 : 11)).current;

  useScene(({ p }) => {
    const t = seg(p, a, b), cells = svg.current!.children;
    for (let i = 0; i < 100; i++) {
      const r = rank[i], fish = cells[i].firstElementChild as SVGPathElement;
      if (mode === "vanish") { // each fish gets a 3-fish-wide window, so they go in a ripple
        const k = r < to ? clamp01((t * (to + 2) - r) / 3) : 0, gone = seg(k, 0.3, 1);
        fish.style.fill = k > 0 ? CORAL : PALE;
        fish.style.opacity = String(0.9 * (1 - gone));
        fish.style.transform = `translateY(${gone * 5}px)`;
      } else {
        const k = r < from ? 1 : r < to ? clamp01((t * (to - from + 2) - (r - from)) / 3) : 0;
        fish.style.fill = k > 0.5 ? CORAL : PALE;
      }
    }
  });

  return (
    <svg ref={svg} viewBox="0 0 250 160" className="w-full max-w-[15rem] sm:max-w-sm" role="img"
      aria-label={mode === "vanish" ? `${to} of 100 fish fade away` : `${from} of 100 fish highlighted, rising to ${to}`}>
      {rank.map((r, i) => (
        <g key={i} transform={`translate(${(i % 10) * 25 + 2} ${Math.floor(i / 10) * 16 + 3})`}>
          <path d={GLYPH} style={{
            fill: mode === "turn" && r < from ? CORAL : PALE, opacity: 0.9,
            transition: "fill 0.35s ease, opacity 0.35s ease, transform 0.35s ease",
          }} />
        </g>
      ))}
    </svg>
  );
}
