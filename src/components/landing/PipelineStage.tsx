import { useEffect, useRef, useState } from "react";
import { SPECIES, drawBrackets, drawFish, drawTag, fitCanvas, reducedMotion, runWhileVisible } from "./fish";
import { createWaterLight } from "./waterLight";
import { Scene, ease, seg, useScene } from "./scene";

/**
 * Scroll-driven walkthrough of the pipeline. A pinned "camera feed" arrives
 * full screen, shrinks into a frame beside the steps, and then scrolling turns
 * on one layer at a time: detect (boxes) -> track (IDs + trails) -> identify
 * (species) -> measure (MaxN bars + indices computed from the fish in the feed).
 */

const SHRINK = 0.16; // share of the pinned scroll spent shrinking the feed into its frame

const STEPS = [
  { title: "Detect", line: "A detector draws a box around each fish, frame by frame." },
  { title: "Track", line: "A tracker follows each fish, so it is counted once." },
  { title: "Identify", line: "It names the species, or stops at genus or family when unsure." },
  { title: "Measure", line: "Counts become MaxN, species richness and Shannon diversity." },
];

const TRACK_HUES = [174, 38, 300, 205, 12, 100, 260];
const CAST = [0, 0, 0, 1, 1, 2, 2]; // indices into SPECIES: a school of 3, then pairs

interface F { x: number; y: number; vx: number; len: number; sp: number; id: number; phase: number; trail: { x: number; y: number }[] }

export default function PipelineStage() {
  return (
    <Scene id="how" height="440vh" className="overflow-hidden">
      <Stage />
    </Scene>
  );
}

function Stage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef(0);
  const [stage, setStage] = useState(0);

  useScene(({ p }) => {
    const reduced = reducedMotion();
    const k = reduced ? 1 : ease(seg(p, 0, SHRINK)), steps = seg(p, SHRINK, 1);
    const s = Math.min(STEPS.length - 1, Math.floor(steps * STEPS.length));
    if (s !== stageRef.current) { stageRef.current = s; setStage(s); }

    // the feed starts covering the whole stage and settles into its frame
    const panel = panelRef.current!;
    panel.style.transform = "";
    if (k < 1) {
      const box = rootRef.current!.getBoundingClientRect(), r = panel.getBoundingClientRect();
      const cover = Math.max(box.width / r.width, box.height / r.height), e = 1 - k;
      const dx = box.left + box.width / 2 - (r.left + r.width / 2), dy = box.top + box.height / 2 - (r.top + r.height / 2);
      panel.style.transform = `translate(${dx * e}px, ${dy * e}px) scale(${1 + (cover - 1) * e})`;
    }
    listRef.current!.style.opacity = String(k);
    listRef.current!.style.transform = reduced ? "" : `translateX(${(1 - k) * -40}px)`;
    barRef.current!.style.width = `${steps * 100}%`;
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const light = createWaterLight(lightRef.current!);
    if (!light) lightRef.current!.style.display = "none";
    const reduced = reducedMotion();
    let w = 0, h = 0, frame = 0;
    let fish: F[] = [];
    const layer = [0, 0, 0, 0];
    const maxn: number[] = SPECIES.map(() => 0);
    const bars: number[] = SPECIES.map(() => 0);

    const resize = () => {
      [w, h] = fitCanvas(canvas, ctx);
      light?.resize();
      const unit = Math.min(w, h * 1.6);
      fish = CAST.slice(0, w < 600 ? 4 : CAST.length).map((sp, i) => {
        const dir = i % 2 ? -1 : 1;
        return {
          x: Math.random() * w, y: h * (0.2 + (i / CAST.length) * 0.6), vx: dir * (0.5 + Math.random() * 0.5),
          len: unit * (0.1 + Math.random() * 0.04), sp, id: i + 1, phase: Math.random() * 6.28, trail: [],
        };
      });
    };

    const step = (t: number) => {
      frame++;
      for (let k = 0; k < 4; k++) layer[k] += ((stageRef.current >= k ? 1 : 0) - layer[k]) * 0.08;

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "hsl(195 60% 20%)");
      g.addColorStop(1, "hsl(212 60% 8%)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      if (!light) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i++) {
        const x = (i / 4) * w + Math.sin(t * 0.0004 + i) * 40;
        const rg = ctx.createLinearGradient(0, 0, 0, h);
        rg.addColorStop(0, "hsla(185, 90%, 75%, 0.07)");
        rg.addColorStop(1, "hsla(185, 90%, 75%, 0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 200, h); ctx.lineTo(x + 40, h);
        ctx.fill();
      }
      ctx.restore();
      }

      const counts = SPECIES.map(() => 0);
      for (const f of fish) {
        if (!reduced) { f.x += f.vx; f.y += Math.sin(t * 0.001 + f.phase) * 0.3; }
        if (f.x > w + f.len) f.x = -f.len;
        if (f.x < -f.len) f.x = w + f.len;
        if (frame % 4 === 0) { f.trail.push({ x: f.x, y: f.y }); if (f.trail.length > 30) f.trail.shift(); }
        const inFrame = f.x > 0 && f.x < w;
        if (inFrame) counts[f.sp]++;
        const sp = SPECIES[f.sp];
        ctx.globalAlpha = 1 - layer[3] * 0.45;
        drawFish(ctx, f.x, f.y, f.len, Math.sign(f.vx), Math.sin(t * 0.009 + f.phase) * 0.35,
          `hsl(${sp.hue} 45% 58%)`, `hsl(${sp.hue} 30% 30%)`);
        ctx.globalAlpha = 1;
        if (!inFrame) continue;

        const hue = TRACK_HUES[(f.id - 1) % TRACK_HUES.length];
        const color = layer[1] > 0.5 ? `hsl(${hue}, 80%, 62%)` : "hsl(174, 80%, 62%)";
        const bw = f.len * 1.25, bh = f.len * 0.62, bx = f.x - bw / 2, by = f.y - bh / 2 - f.len * 0.05;
        if (layer[1] > 0.01) { // trail
          ctx.strokeStyle = `hsla(${hue}, 80%, 62%, ${0.7 * layer[1]})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          f.trail.forEach((p, i) => { if (i === 0 || Math.abs(p.x - f.trail[i - 1].x) > w / 2) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
          ctx.stroke();
        }
        ctx.globalAlpha = layer[0];
        drawBrackets(ctx, bx, by, bw, bh, color);
        const name = layer[2] > 0.5 ? `${sp.genus} ${sp.species}` : "fish";
        const conf = layer[2] > 0.5 ? 0.86 + ((f.id * 37) % 11) / 100 : 0.9;
        const id = layer[1] > 0.5 ? `#${f.id}  ` : "";
        drawTag(ctx, bx, Math.max(4, by - 22), `${id}${name}  ${Math.round(conf * 100)}%`, color, layer[2] > 0.5);
        ctx.globalAlpha = 1;
      }

      // measure panel: MaxN per species from the feed itself, plus indices
      counts.forEach((c, i) => { maxn[i] = Math.max(maxn[i], c); });
      if (layer[3] > 0.01) {
        const present = SPECIES.map((s, i) => ({ s, n: maxn[i], i })).filter((d) => d.n > 0);
        const total = present.reduce((a, d) => a + d.n, 0);
        const H = -present.reduce((a, d) => a + (d.n / total) * Math.log(d.n / total), 0);
        // drawn at a fixed 360px design size, scaled down to fit small feeds
        const pw = 360, ph = 64 + present.length * 34, u = Math.min(1, (w * 0.85) / pw, (h * 0.8) / ph);
        ctx.save();
        ctx.translate(w - (pw + 20) * u, h - (ph + 20) * u);
        ctx.scale(u, u);
        ctx.globalAlpha = layer[3];
        ctx.fillStyle = "hsla(216, 50%, 6%, 0.85)";
        ctx.beginPath(); ctx.roundRect(0, 0, pw, ph, 12); ctx.fill();
        ctx.strokeStyle = "hsla(174, 80%, 62%, 0.35)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = "600 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = "hsl(195, 30%, 70%)";
        ctx.fillText("MAXN PER SPECIES", 16, 24);
        ctx.textAlign = "right";
        ctx.fillStyle = "hsl(174, 80%, 62%)";
        ctx.fillText(`S = ${present.length}   H' = ${H.toFixed(2)}`, pw - 16, 24);
        ctx.textAlign = "left";
        const maxBar = Math.max(1, ...present.map((d) => d.n));
        present.forEach((d, k) => {
          bars[d.i] += ((d.n / maxBar) * layer[3] - bars[d.i]) * 0.08;
          const y = 44 + k * 34;
          ctx.font = "italic 500 12px 'Space Grotesk', sans-serif";
          ctx.fillStyle = "hsl(195, 60%, 92%)";
          ctx.fillText(`${d.s.genus} ${d.s.species}`, 16, y + 4);
          const bwMax = pw - 72;
          ctx.fillStyle = "hsla(174, 80%, 62%, 0.15)";
          ctx.fillRect(16, y + 10, bwMax, 6);
          ctx.fillStyle = `hsl(${d.s.hue + 130}, 70%, 60%)`;
          ctx.fillRect(16, y + 10, bwMax * bars[d.i], 6);
          ctx.font = "600 13px 'JetBrains Mono', monospace";
          ctx.fillStyle = "hsl(195, 60%, 94%)";
          ctx.fillText(String(d.n), pw - 40, y + 17);
        });
        ctx.restore();
      }

      // camera HUD
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "hsl(16, 80%, 62%)";
      ctx.beginPath(); ctx.arc(24, 24, 4, 0, 6.28); if (Math.floor(t / 600) % 2) ctx.fill();
      ctx.fillStyle = "hsla(195, 60%, 92%, 0.8)";
      const s = Math.floor(frame / 60);
      ctx.fillText(`REC  00:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}  ·  BRUV 01`, 36, 28);
      light?.render(reduced ? 0 : t, 0.55, null, null);
    };

    resize();
    window.addEventListener("resize", resize);
    const stop = runWhileVisible(canvas, step);
    return () => { stop(); light?.dispose(); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div ref={rootRef} className="scene-recede flex h-full flex-col items-center justify-center gap-6 px-4 md:flex-row md:gap-12 md:px-10">
      <ol ref={listRef} className="w-full max-w-sm space-y-2 md:space-y-7">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className={`transition-all duration-500 ${i === stage ? "opacity-100" : "hidden opacity-25 md:block"} ${i === stage ? "md:translate-x-0" : "md:-translate-x-2"}`}
          >
            <div className="flex items-baseline gap-4">
              <span className={`font-mono text-sm ${i === stage ? "text-[hsl(var(--bioluminescent))]" : "text-muted-foreground"}`}>0{i + 1}</span>
              <span className="font-display text-4xl md:text-5xl">{s.title}</span>
            </div>
            <p className={`ml-9 mt-2 text-muted-foreground transition-all duration-500 ${i === stage ? "max-h-24 opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}>{s.line}</p>
          </li>
        ))}
      </ol>
      <div ref={panelRef} className="relative h-[52svh] w-full max-w-4xl overflow-hidden rounded-lg border border-border/70 will-change-transform md:aspect-video md:h-auto">
        <canvas ref={canvasRef} className="h-full w-full" aria-label="Pipeline demo: detect, track, identify, measure" role="img" />
        <canvas ref={lightRef} className="pointer-events-none absolute inset-0 h-full w-full" style={{ mixBlendMode: "screen" }} aria-hidden="true" />
        <div ref={barRef} className="absolute bottom-0 left-0 h-1 w-0 bg-[hsl(var(--bioluminescent))]" />
      </div>
    </div>
  );
}
