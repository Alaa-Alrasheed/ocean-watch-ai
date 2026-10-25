import { useEffect, useRef, useState } from "react";
import { drawFish, fitCanvas, reducedMotion, runWhileVisible } from "./fish";
import { Scene, seg, useScene } from "./scene";

/**
 * 321 dots, one per species the classifier knows. A pinned canvas: as you
 * scroll, the dots drift, then swarm into three real classes from the model
 * (an emperor, an angelfish, a trevally), then into the number itself, and
 * finally burst outward as the section hands over to the next one.
 */

const N = 321;
const AT = [0.086, 0.283, 0.471, 0.66]; // scroll progress where each shape forms
const BURST: [number, number] = [0.86, 1];

type Draw = (o: CanvasRenderingContext2D, L: number) => void;

// facing +x, centred on the origin, L = body length
const angelfish: Draw = (o, L) => {
  const H = L * 0.62;
  o.beginPath();
  o.moveTo(L * 0.42, L * 0.02);
  o.bezierCurveTo(L * 0.4, -H * 0.45, L * 0.05, -H * 0.62, -L * 0.22, -H * 0.4);
  o.bezierCurveTo(-L * 0.34, -H * 0.2, -L * 0.34, H * 0.2, -L * 0.22, H * 0.4);
  o.bezierCurveTo(L * 0.05, H * 0.62, L * 0.4, H * 0.45, L * 0.42, L * 0.02);
  o.fill();
  for (const s of [-1, 1]) { // dorsal and anal fins sweeping back
    o.beginPath();
    o.moveTo(L * 0.14, s * H * 0.5);
    o.quadraticCurveTo(-L * 0.15, s * H * 0.78, -L * 0.42, s * H * 0.56);
    o.quadraticCurveTo(-L * 0.28, s * H * 0.36, -L * 0.18, s * H * 0.38);
    o.fill();
  }
  o.beginPath();
  o.moveTo(-L * 0.3, 0);
  o.lineTo(-L * 0.5, -H * 0.22);
  o.quadraticCurveTo(-L * 0.54, 0, -L * 0.5, H * 0.22);
  o.fill();
};

const trevally: Draw = (o, L) => {
  const H = L * 0.42;
  o.beginPath();
  o.moveTo(L * 0.48, H * 0.05);
  o.bezierCurveTo(L * 0.42, -H * 0.58, L * 0.0, -H * 0.62, -L * 0.3, -H * 0.12);
  o.lineTo(-L * 0.37, -H * 0.05);
  o.lineTo(-L * 0.37, H * 0.05);
  o.lineTo(-L * 0.3, H * 0.12);
  o.bezierCurveTo(L * 0.0, H * 0.6, L * 0.42, H * 0.5, L * 0.48, H * 0.05);
  o.fill();
  o.beginPath(); // deeply forked tail
  o.moveTo(-L * 0.36, 0);
  o.quadraticCurveTo(-L * 0.45, -H * 0.25, -L * 0.57, -H * 0.66);
  o.quadraticCurveTo(-L * 0.48, -H * 0.2, -L * 0.47, 0);
  o.quadraticCurveTo(-L * 0.48, H * 0.2, -L * 0.57, H * 0.66);
  o.quadraticCurveTo(-L * 0.45, H * 0.25, -L * 0.36, 0);
  o.fill();
  for (const [s, k] of [[-1, 1], [1, 0.75]]) { // falcate dorsal and anal fins
    o.beginPath();
    o.moveTo(L * 0.02, s * H * 0.55);
    o.lineTo(-L * 0.07, s * H * (0.55 + 0.45 * k));
    o.quadraticCurveTo(-L * 0.12, s * H * 0.5, -L * 0.27, s * H * 0.18);
    o.fill();
  }
};

// scale: shape size relative to the stage; tail: where the tail hinges (fraction of L)
const SHAPES: { label: string; draw: Draw; scale: number; edge: number; tail: number | null; color: (lx: number, L: number) => [number, number, number] }[] = [
  { label: "Lethrinus nebulosus", draw: (o, L) => drawFish(o, 0, 0, L, 1, 0, "#fff", "#fff", 0), scale: 1, edge: 0.62, tail: -0.42, color: () => [44, 75, 64] },
  // six-banded angelfish: dark bands across a yellow body
  { label: "Pomacanthus sexstriatus", draw: angelfish, scale: 0.8, edge: 0.62, tail: -0.3, color: (lx, L) => (Math.sin((lx / L) * 34) > 0.25 ? [218, 40, 52] : [46, 85, 68]) },
  { label: "Carangoides fulvoguttatus", draw: trevally, scale: 0.95, edge: 0.66, tail: -0.36, color: () => [205, 30, 80] },
  { label: "", draw: (o, L) => { o.font = `700 ${L * 0.6}px Newsreader, Georgia, serif`; o.textAlign = "center"; o.textBaseline = "middle"; o.fillText("321", 0, L * 0.04); }, scale: 1, edge: 0.92, tail: null, color: () => [176, 70, 66] },
];

/** Picks n points from c, as evenly spaced as possible (greedy Poisson-disk with a searched radius). */
function spread(c: [number, number][], n: number): [number, number][] {
  if (c.length <= n) return c;
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  let lo = 0.5, hi = 80, best = c.slice(0, n);
  for (let it = 0; it < 12; it++) {
    const r = (lo + hi) / 2, r2 = r * r, grid = new Map<number, [number, number][]>(), out: [number, number][] = [];
    const key = (gx: number, gy: number) => gx * 100003 + gy;
    for (const p of c) {
      const gx = Math.floor(p[0] / r), gy = Math.floor(p[1] / r);
      let ok = true;
      for (let dx = -1; dx <= 1 && ok; dx++) for (let dy = -1; dy <= 1 && ok; dy++) {
        for (const q of grid.get(key(gx + dx, gy + dy)) ?? []) if ((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < r2) { ok = false; break; }
      }
      if (!ok) continue;
      out.push(p);
      const k = key(gx, gy);
      const cell = grid.get(k);
      if (cell) cell.push(p); else grid.set(k, [p]);
    }
    if (out.length >= n) { lo = r; best = out; } else hi = r;
  }
  return best.slice(0, n);
}

/** N points on and inside a shape (most on the outline, so it reads), in shape-local px. */
function sample(draw: Draw, L: number, edgeFrac: number): [number, number][] {
  const W = Math.ceil(L * 1.3), H = Math.ceil(L * 1.0);
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const o = off.getContext("2d")!;
  o.fillStyle = "#fff";
  o.translate(W / 2, H / 2);
  draw(o, L);
  const img = o.getImageData(0, 0, W, H).data;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && img[(y * W + x) * 4 + 3] > 128;
  const edge: [number, number][] = [], fill: [number, number][] = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    if (!on(x, y)) continue;
    const inner = on(x - 3, y) && on(x + 3, y) && on(x, y - 3) && on(x, y + 3);
    (inner ? fill : edge).push([x - W / 2, y - H / 2]);
  }
  const nEdge = Math.round(N * edgeFrac);
  const pts = [...spread(edge, nEdge), ...spread(fill, N - nEdge)];
  while (pts.length < N) pts.push(pts[pts.length % Math.max(1, pts.length)] ?? [0, 0]);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  return pts;
}

interface Dot { x: number; y: number; vx: number; vy: number; hx: number; hy: number; tw: number; delay: number; h: number; s: number; l: number }

export default function SpeciesMorph() {
  return (
    <Scene id="species" height="420vh">
      <Morph />
    </Scene>
  );
}

function Morph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef(-1);
  const burstRef = useRef(0);
  const [shape, setShape] = useState(-1);

  useScene(({ p }) => {
    const s = AT.filter((a) => p >= a).length - 1;
    burstRef.current = seg(p, ...BURST);
    captionRef.current!.style.opacity = String(1 - burstRef.current * 2);
    if (s !== shapeRef.current) { shapeRef.current = s; setShape(s); }
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = reducedMotion();
    let w = 0, h = 0, L = 0, current = -2, changedAt = 0;
    let dots: Dot[] = [];
    let targets: [number, number][][] = [];
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      [w, h] = fitCanvas(canvas, ctx);
      L = Math.min(w * 0.66, h * 1.25, 720); // fish span ~1.25 L incl. tail
      targets = SHAPES.map((s) => sample(s.draw, L * s.scale, s.edge));
      if (dots.length !== N) {
        dots = Array.from({ length: N }, () => {
          const hx = Math.random() * w, hy = Math.random() * h;
          return { x: hx, y: hy, vx: 0, vy: 0, hx, hy, tw: Math.random() * 6.28, delay: Math.random() * 500, h: 185, s: 70, l: 70 };
        });
      }
    };

    const step = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const sh = shapeRef.current;
      if (sh !== current) { current = sh; changedAt = t; }
      const def = sh >= 0 ? SHAPES[sh] : null;
      const cx = w / 2 + Math.sin(t * 0.0004) * w * 0.02, cy = h * 0.46 + Math.sin(t * 0.0009) * 6;
      const wag = Math.sin(t * 0.004) * 0.28;
      const burst = burstRef.current, spread = 1 + burst * burst * 2.6;
      ctx.globalCompositeOperation = "lighter";
      dots.forEach((d, i) => {
        let tx = d.hx + Math.sin(t * 0.0005 + d.tw) * 24, ty = d.hy + Math.cos(t * 0.0004 + d.tw) * 24;
        let col: [number, number, number] = [185 + (i % 20), 70, 70];
        if (def && t - changedAt > d.delay) {
          let [lx, ly] = targets[sh][i];
          const SL = L * def.scale;
          col = def.color(lx, SL);
          if (def.tail !== null && lx < def.tail * SL) { // the tail swings about its base
            const base = def.tail * SL, rx = lx - base, c = Math.cos(wag), s = Math.sin(wag);
            lx = base + rx * c - ly * s; ly = rx * s + ly * c;
          }
          tx = cx + lx * spread; ty = cy + ly * spread;
        }
        const k = reduced ? 1 : 0.032;
        d.vx = (d.vx + (tx - d.x) * k) * 0.84;
        d.vy = (d.vy + (ty - d.y) * k) * 0.84;
        const mx = d.x - mouse.x, my = d.y - mouse.y, m2 = mx * mx + my * my;
        if (m2 < 90 * 90 && m2 > 1) { const f = ((8100 - m2) / 8100) * 6, m = Math.sqrt(m2); d.vx += (mx / m) * f; d.vy += (my / m) * f; }
        d.x += d.vx; d.y += d.vy;
        d.h += (col[0] - d.h) * 0.06; d.s += (col[1] - d.s) * 0.06; d.l += (col[2] - d.l) * 0.06;
        const a = (0.6 + 0.4 * Math.sin(t * 0.003 + d.tw)) * (1 - burst);
        ctx.fillStyle = `hsla(${d.h}, ${d.s}%, ${d.l}%, ${0.11 * a})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, 7, 0, 6.28); ctx.fill();
        ctx.fillStyle = `hsla(${d.h}, ${d.s}%, ${Math.min(92, d.l + 12)}%, ${0.95 * a})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, 1.9, 0, 6.28); ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    };

    build();
    void document.fonts.load("700 100px Newsreader").then(build); // "321" needs the real font
    window.addEventListener("resize", build);
    window.addEventListener("pointermove", onMove);
    const stop = runWhileVisible(canvas, step);
    return () => {
      stop();
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const caption = shape < 0
    ? "One dot for each species the model can tell apart."
    : shape < 3 ? SHAPES[shape].label : "species it can tell apart";

  return (
    <>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      <div ref={captionRef} className="absolute inset-x-0 bottom-[8%] px-4 text-center">
        <p
          key={caption}
          className={`fade-swap ${shape >= 0 && shape < 3 ? "font-display text-2xl italic text-foreground/85 md:text-3xl" : "text-base text-muted-foreground md:text-lg"}`}
        >
          {caption}
        </p>
      </div>
    </>
  );
}
