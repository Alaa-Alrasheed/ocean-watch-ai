/** Shared bits for the landing-page canvases. */

// Real classes the classifier knows.
export const SPECIES = [
  { family: "Lethrinidae", genus: "Lethrinus", species: "nebulosus", hue: 42 },
  { family: "Labridae", genus: "Thalassoma", species: "lunare", hue: 150 },
  { family: "Scaridae", genus: "Scarus", species: "ghobban", hue: 190 },
  { family: "Serranidae", genus: "Epinephelus", species: "coioides", hue: 28 },
  { family: "Carangidae", genus: "Carangoides", species: "fulvoguttatus", hue: 205 },
  { family: "Siganidae", genus: "Siganus", species: "fuscescens", hue: 60 },
  { family: "Lutjanidae", genus: "Lutjanus", species: "russellii", hue: 8 },
  { family: "Pomacanthidae", genus: "Pomacanthus", species: "sexstriatus", hue: 48 },
];

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Side-view fish centred on (x, y), facing +x when dir = 1. `wag` = tail angle (rad). */
export function drawFish(
  ctx: CanvasRenderingContext2D, x: number, y: number, len: number, dir: number, wag: number,
  top: string, bottom: string, eyeAlpha = 0.7,
) {
  const L = len, H = L * 0.36;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  const g = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.save();
  ctx.translate(-L * 0.42, 0);
  ctx.rotate(wag);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-L * 0.18, -H * 0.2, -L * 0.3, -H * 0.62);
  ctx.quadraticCurveTo(-L * 0.22, 0, -L * 0.3, H * 0.62);
  ctx.quadraticCurveTo(-L * 0.18, H * 0.2, 0, 0);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(L * 0.5, 0);
  ctx.bezierCurveTo(L * 0.35, -H * 0.62, -L * 0.2, -H * 0.66, -L * 0.45, 0);
  ctx.bezierCurveTo(-L * 0.2, H * 0.6, L * 0.35, H * 0.56, L * 0.5, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(L * 0.12, -H * 0.45);
  ctx.quadraticCurveTo(-L * 0.08, -H * 0.95, -L * 0.28, -H * 0.3);
  ctx.fill();
  if (eyeAlpha > 0) {
    ctx.fillStyle = `rgba(230,250,255,${eyeAlpha})`;
    ctx.beginPath();
    ctx.arc(L * 0.33, -H * 0.08, Math.max(1, L * 0.028), 0, 6.28);
    ctx.fill();
  }
  ctx.restore();
}

/** Corner-bracket detection box. */
export function drawBrackets(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  const c = Math.min(16, w * 0.22);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.moveTo(cx + sx * c, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * c);
  }
  ctx.stroke();
}

/** Label tag above a box. */
export function drawTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, accent: string, bright: boolean) {
  ctx.font = "600 12px 'JetBrains Mono', monospace";
  const pad = 6, lw = ctx.measureText(text).width + pad * 2;
  x = Math.max(4, Math.min(x, ctx.canvas.clientWidth - lw - 4)); // keep inside the canvas
  ctx.fillStyle = "hsla(216, 50%, 6%, 0.8)";
  ctx.beginPath();
  ctx.roundRect(x, y, lw, 18, 4);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 3, 18);
  ctx.fillStyle = bright ? "hsl(195, 60%, 94%)" : "hsl(195, 30%, 75%)";
  ctx.fillText(text, x + pad + 1, y + 13);
}

/** Sizes a canvas to its CSS box (DPR-aware). Returns [w, h]. */
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): [number, number] {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [w, h];
}

/**
 * Calls `fn` whenever `el`'s rendered size changes. Watches the element itself, not the
 * window: on iOS Safari a box can change size (toolbar, fonts, layout) without a window
 * resize, which left the canvas bitmap stretched to the new box. Returns a cleanup.
 */
export function onResize(el: Element, fn: () => void): () => void {
  let w = el.clientWidth, h = el.clientHeight;
  const ro = new ResizeObserver(() => {
    if (el.clientWidth === w && el.clientHeight === h) return;
    w = el.clientWidth; h = el.clientHeight;
    fn();
  });
  ro.observe(el);
  return () => ro.disconnect();
}

/** Runs `step` every frame only while `el` is on screen and the tab is visible. */
export function runWhileVisible(el: Element, step: (t: number) => void): () => void {
  let raf = 0, onScreen = false;
  const loop = (t: number) => { step(t); raf = requestAnimationFrame(loop); };
  const sync = () => {
    cancelAnimationFrame(raf);
    if (onScreen && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
  io.observe(el);
  document.addEventListener("visibilitychange", sync);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    document.removeEventListener("visibilitychange", sync);
  };
}
