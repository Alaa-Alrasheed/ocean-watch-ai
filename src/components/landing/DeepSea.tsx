import { useEffect, useRef } from "react";
import { fitCanvas, reducedMotion, onResize } from "./fish";

/**
 * Fixed background behind the sections below the hero. Scrolling = sinking:
 * the water darkens, marine snow streams upward with parallax, bioluminescent
 * plankton light up deeper down and flare where the cursor passes (as real
 * plankton do when disturbed), and jellyfish drift through the deep end.
 */

interface Mote { x: number; y: number; z: number; r: number; tw: number; glow: number; hue: number }
interface Jelly { x: number; y: number; z: number; size: number; hue: number; phase: number }

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function drawJelly(ctx: CanvasRenderingContext2D, j: Jelly, t: number, alpha: number) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.0018 + j.phase); // 1 = contracted
  const s = j.size, R = s * (1 - 0.14 * pulse), H = s * (0.7 + 0.18 * pulse);
  ctx.save();
  ctx.translate(j.x, j.y);
  const halo = ctx.createRadialGradient(0, -H * 0.4, 0, 0, -H * 0.4, s * 2.6);
  halo.addColorStop(0, `hsla(${j.hue}, 90%, 60%, ${0.1 * alpha})`);
  halo.addColorStop(1, `hsla(${j.hue}, 90%, 60%, 0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(-s * 2.6, -H * 0.4 - s * 2.6, s * 5.2, s * 5.2);

  ctx.lineWidth = 1;
  ctx.strokeStyle = `hsla(${j.hue}, 90%, 72%, ${0.22 * alpha})`;
  for (let k = 0; k < 9; k++) { // tentacles
    const x0 = -R * 0.85 + (k / 8) * R * 1.7;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    for (let n = 1; n <= 16; n++) ctx.lineTo(x0 * (1 - n * 0.02) + Math.sin(t * 0.0024 + n * 0.45 + k * 1.3 + j.phase) * n * 0.9, n * s * 0.16);
    ctx.stroke();
  }
  ctx.lineWidth = 4;
  ctx.strokeStyle = `hsla(${j.hue + 20}, 90%, 75%, ${0.16 * alpha})`;
  for (let k = 0; k < 3; k++) { // frilly oral arms
    const x0 = (k - 1) * R * 0.25;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    for (let n = 1; n <= 8; n++) ctx.lineTo(x0 + Math.sin(t * 0.002 + n * 0.7 + k * 2 + j.phase) * n * 1.6, n * s * 0.17);
    ctx.stroke();
  }

  const g = ctx.createRadialGradient(0, -H * 0.55, s * 0.05, 0, -H * 0.3, s * 1.1);
  g.addColorStop(0, `hsla(${j.hue}, 95%, 85%, ${0.55 * alpha})`);
  g.addColorStop(0.5, `hsla(${j.hue}, 90%, 65%, ${0.22 * alpha})`);
  g.addColorStop(1, `hsla(${j.hue}, 90%, 55%, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); // bell with a scalloped rim
  ctx.moveTo(-R, 0);
  ctx.bezierCurveTo(-R, -H * 1.25, R, -H * 1.25, R, 0);
  const seg = (2 * R) / 8;
  for (let k = 8; k > 0; k--) ctx.quadraticCurveTo(-R + (k - 0.5) * seg, H * 0.12, -R + (k - 1) * seg, 0);
  ctx.fill();
  ctx.strokeStyle = `hsla(${j.hue}, 95%, 80%, ${0.5 * alpha})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = `hsla(${j.hue + 30}, 95%, 80%, ${0.3 * alpha})`;
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse((k - 1.5) * R * 0.28, -H * 0.45, R * 0.1, H * 0.12, 0, 0, 6.28); ctx.fill(); }
  ctx.restore();
}

export default function DeepSea() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reducedMotion()) return; // the plain CSS gradient stays
    const canvas = ref.current!, ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, lastY = window.scrollY, raf = 0;
    let snow: Mote[] = [], plankton: Mote[] = [], jellies: Jelly[] = [];
    const mouse = { x: -1e4, y: -1e4 };

    const mote = (hue: number): Mote => ({ x: Math.random() * w, y: Math.random() * h, z: 0.2 + Math.random() * 0.8, r: 0.4 + Math.random() * 1.4, tw: Math.random() * 6.28, glow: 0, hue });
    const resize = () => {
      [w, h] = fitCanvas(canvas, ctx);
      snow = Array.from({ length: Math.round((w * h) / 11000) }, () => mote(0));
      plankton = Array.from({ length: Math.round((w * h) / 20000) }, () => mote(170 + Math.random() * 40));
      const narrow = w < 700; // phones: fewer, smaller jellies so they don't crowd the text
      jellies = (narrow ? [280, 190] : [280, 320, 190, 300]).map((hue, i, all) => ({
        x: w * (0.12 + (0.76 / all.length) * i + Math.random() * 0.08), y: h * (0.3 + Math.random() * 0.6),
        z: 0.35 + Math.random() * 0.4, size: (narrow ? 18 : 28) + Math.random() * (narrow ? 12 : 26), hue, phase: Math.random() * 6.28,
      }));
    };

    // scrolling moves everything up (we are sinking); z = parallax depth
    const drift = (m: { x: number; y: number; z: number }, dy: number, rise: number, pad: number) => {
      m.y -= rise * m.z + dy * m.z * 0.5;
      if (m.y < -pad) { m.y += h + pad * 2; m.x = Math.random() * w; }
      if (m.y > h + pad) { m.y -= h + pad * 2; m.x = Math.random() * w; }
    };

    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      const sy = window.scrollY, dy = sy - lastY;
      lastY = sy;
      if (sy < 1) return; // the hero covers the whole screen
      const p = sy / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `hsl(${212 + 8 * p} 52% ${8 - 4.5 * p}%)`);
      g.addColorStop(1, `hsl(${218 + 6 * p} 58% ${5 - 3 * p}%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(200,230,245,1)";
      for (const m of snow) {
        drift(m, dy, 0.12, 4);
        m.x += Math.sin(t * 0.0004 + m.tw) * 0.08;
        ctx.globalAlpha = 0.1 + m.z * 0.28;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * m.z + 0.3, 0, 6.28); ctx.fill();
      }

      ctx.globalCompositeOperation = "lighter";
      const bio = smooth(0.12, 0.55, p);
      for (const m of plankton) {
        drift(m, dy, 0.05, 10);
        const d2 = (m.x - mouse.x) ** 2 + (m.y - mouse.y) ** 2;
        m.glow = d2 < 130 * 130 ? Math.min(1, m.glow + 0.12) : m.glow * 0.985;
        const a = (0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.002 + m.tw))) * bio + m.glow * 0.9;
        if (a < 0.02) continue;
        ctx.globalAlpha = Math.min(1, a) * 0.25;
        ctx.fillStyle = `hsl(${m.hue}, 95%, 65%)`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 5, 0, 6.28); ctx.fill();
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillStyle = `hsl(${m.hue}, 95%, 80%)`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;

      const ja = smooth(0.22, 0.5, p);
      if (ja > 0.01) for (const j of jellies) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.0018 + j.phase);
        j.y -= (0.15 + 0.35 * pulse) * j.z + dy * j.z * 0.6;
        if (j.y < -j.size * 4) { j.y = h + j.size * 2; j.x = Math.random() * w; }
        if (j.y > h + j.size * 4) { j.y = -j.size * 2; j.x = Math.random() * w; }
        drawJelly(ctx, j, t, ja * (0.3 + j.z * 0.35));
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
    };

    resize();
    const unobserve = onResize(canvas, resize);
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      unobserve();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen" aria-hidden="true" />;
}
