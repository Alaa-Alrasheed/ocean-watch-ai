import { useEffect, useRef } from "react";
import { drawBrackets, drawFish, drawTag, fitCanvas, onResize, reducedMotion, runWhileVisible } from "@/components/landing/fish";

export interface SchoolFish { name: string; count?: number; color: string }

interface Swimmer extends SchoolFish { x: number; y: number; vx: number; len: number; phase: number; share: number }

/**
 * A slow school of fish on a transparent canvas. Bigger fish = more individuals.
 * Hovering one boxes and labels it the way the detector does (unless `quiet`).
 * `faint` keeps it in the background; `excited` brightens it and speeds it up.
 */
export default function FishSchool({ fish, faint = false, excited = false, quiet = false, className = "" }: {
  fish: SchoolFish[]; faint?: boolean; excited?: boolean; quiet?: boolean; className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const excitedRef = useRef(excited);
  excitedRef.current = excited;

  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, school: Swimmer[] = [], hover: Swimmer | null = null, energy = 0, last = 0;
    const mouse = { x: -1e4, y: -1e4 };
    const total = fish.reduce((s, f) => s + (f.count ?? 1), 0) || 1;

    const build = () => {
      [w, h] = fitCanvas(canvas, ctx);
      const base = Math.min(46, Math.max(18, w / 14));
      school = fish.map((f, i) => {
        const share = (f.count ?? 1) / total;
        const dir = i % 2 ? -1 : 1;
        return {
          ...f, share, phase: Math.random() * 6.28,
          len: base * (0.55 + Math.min(1.1, Math.sqrt(share * fish.length) * 0.5)),
          x: Math.random() * w, y: h * (0.18 + Math.random() * 0.64),
          vx: dir * (0.12 + Math.random() * 0.18),
        };
      }).sort((a, b) => a.len - b.len); // small ones behind
    };

    const draw = (t: number) => {
      const dt = last ? Math.min(50, t - last) / 16.7 : 1;
      last = t;
      energy += ((excitedRef.current ? 1 : 0) - energy) * 0.06;
      ctx.clearRect(0, 0, w, h);
      const alpha = faint ? 0.22 + energy * 0.4 : 0.9;
      hover = null;
      for (const f of school) {
        f.x += f.vx * (1 + energy * 2.5) * dt;
        const pad = f.len;
        if (f.x > w + pad) f.x = -pad;
        if (f.x < -pad) f.x = w + pad;
        const y = f.y + Math.sin(t * 0.0009 + f.phase) * 5;
        if (!quiet && Math.abs(mouse.x - f.x) < f.len * 0.55 && Math.abs(mouse.y - y) < f.len * 0.3) hover = f;
        ctx.globalAlpha = alpha * (hover && hover !== f ? 0.45 : 1);
        drawFish(ctx, f.x, y, f.len, Math.sign(f.vx), Math.sin(t * 0.006 * (1 + energy) + f.phase) * 0.28, f.color, `${f.color}88`, 0.6);
      }
      ctx.globalAlpha = 1;
      if (hover) {
        const y = hover.y + Math.sin(t * 0.0009 + hover.phase) * 5;
        const bw = hover.len * 1.3, bh = hover.len * 0.66;
        drawBrackets(ctx, hover.x - bw / 2, y - bh / 2, bw, bh, "hsl(174, 80%, 62%)");
        const label = hover.count != null ? `${hover.name} · ${hover.count}` : hover.name;
        drawTag(ctx, hover.x - bw / 2, Math.max(2, y - bh / 2 - 22), label, "hsl(174, 80%, 62%)", true);
      }
      canvas.style.cursor = hover ? "default" : "";
    };

    build();
    const still = reducedMotion();
    if (still) draw(0);
    const unresize = onResize(canvas, () => { build(); if (still) draw(0); });
    const unrun = still ? () => {} : runWhileVisible(canvas, draw);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = mouse.y = -1e4; };
    if (!quiet) { canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerleave", onLeave); }
    return () => {
      unresize(); unrun();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [fish, faint, quiet]);

  // fish swim in and out through soft edges, not a hard cut at the canvas border
  const fade = "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)";
  return <canvas ref={ref} className={className} style={{ maskImage: fade, WebkitMaskImage: fade }} aria-hidden="true" />;
}
