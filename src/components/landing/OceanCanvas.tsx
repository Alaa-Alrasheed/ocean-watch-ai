import { useEffect, useRef } from "react";
import { SPECIES, drawBrackets, drawFish, drawTag, fitCanvas, reducedMotion, runWhileVisible, onResize } from "./fish";
import { createWaterLight } from "./waterLight";
import { ambience } from "./sound";

/**
 * Animated underwater hero, on three stacked canvases:
 *   scene (2D)  water, marine snow, fish at three depths, bubbles
 *   light (GL)  caustics + god rays + torch + sonar ring, screen-blended over the scene
 *   hud (2D)    detections, sonar blips, lens reticle, intro flash
 * It opens with a descent from the bright surface. Near fish get detected the
 * way the pipeline reports them: tracked box, ID, trail, and a label that
 * narrows family -> genus -> species. The cursor is a lens (fish under it are
 * identified faster) and a click sends a sonar ping that identifies every fish
 * the ring passes.
 */

export interface SceneStats {
  inView: number;
  tracked: number;
  species: number;
  frame: number;
}

interface Fish {
  x: number; y: number; vx: number; len: number; depth: number; // depth 0 near .. 1 far
  phase: number; wobble: number; sp: number;
  id?: number; seenAt?: number; conf: number; trail: { x: number; y: number }[];
  boxW: number; boxH: number; vis: number; hit: number; flash: number;
}

interface Bubble { x: number; y: number; r: number; vy: number; wob: number }

interface Props {
  onStats?: (s: SceneStats) => void;
  /** container whose [data-avoid] children (the hero text) boxes and labels fade out behind */
  avoidRef?: React.RefObject<HTMLElement>;
}

const ACCENT = "hsl(174, 80%, 62%)";
const LENS_R = 150;
const PING_SPEED = 0.85; // ring radius per second, in screen heights (matches the shader)

export default function OceanCanvas({ onStats, avoidRef }: Props) {
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = sceneRef.current!, hud = hudRef.current!;
    const sc = scene.getContext("2d")!, hc = hud.getContext("2d")!;
    const light = createWaterLight(lightRef.current!);
    if (!light) lightRef.current!.style.display = "none";
    const reduced = reducedMotion();
    let w = 0, h = 0, frame = 0, nextId = 1, t0 = -1, pingId = 0;
    const mouse = { x: -9999, y: -9999, nx: 0, active: false };
    let fish: Fish[] = [];
    let snow: { x: number; y: number; r: number; s: number; d: number }[] = [];
    let bubbles: Bubble[] = [];
    const blips: { x: number; y: number; life: number }[] = [];
    let avoid: { l: number; t: number; r: number; b: number }[] = [];
    let ping: { x: number; y: number; t0: number; id: number } | null = null;

    const spawn = (anywhere: boolean): Fish => {
      const depth = Math.random() < 0.45 ? Math.random() * 0.25 : 0.3 + Math.random() * 0.7;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const len = (120 - depth * 85) * (0.8 + Math.random() * 0.5) * Math.min(1, w / 1100 + 0.3);
      return {
        x: anywhere ? Math.random() * w : dir > 0 ? -len * 2 : w + len * 2,
        y: h * (0.15 + Math.random() * 0.72),
        vx: dir * (0.45 + Math.random() * 0.6) * (1 - depth * 0.55),
        len, depth, phase: Math.random() * 6.28, wobble: Math.random() * 6.28,
        sp: Math.floor(Math.random() * SPECIES.length), conf: 0, trail: [], boxW: 0, boxH: 0, vis: 0, hit: 0, flash: 0,
      };
    };

    const bubble = (x: number, y: number, fast: boolean): Bubble => ({
      x, y, r: fast ? 1.5 + Math.random() * 6 : 1 + Math.random() * 2.5,
      vy: fast ? -(5 + Math.random() * 9) : -(0.6 + Math.random() * 1.2), wob: Math.random() * 6.28,
    });

    const resize = () => {
      [w, h] = fitCanvas(scene, sc);
      fitCanvas(hud, hc);
      light?.resize();
      const n = Math.round(Math.min(14, Math.max(6, w / 120)));
      fish = Array.from({ length: n }, () => spawn(true)).sort((a, b) => b.depth - a.depth);
      snow = Array.from({ length: Math.round((w * h) / 9000) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.3,
        s: Math.random() * 0.25 + 0.05, d: Math.random(),
      }));
    };

    // fallback god rays when WebGL is unavailable
    const rays2d = (t: number) => {
      sc.save();
      sc.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const top = (i / 7) * w * 1.3 - w * 0.15 + mouse.nx * 40 * (i % 3 + 1) + Math.sin(t * 0.0003 + i * 1.7) * 60;
        const spread = 50 + (i % 3) * 40;
        const g = sc.createLinearGradient(0, 0, 0, h * 0.85);
        g.addColorStop(0, `hsla(185, 90%, 75%, ${0.05 + 0.035 * Math.sin(t * 0.0006 + i * 2.1)})`);
        g.addColorStop(1, "hsla(185, 90%, 75%, 0)");
        sc.fillStyle = g;
        sc.beginPath();
        sc.moveTo(top - spread * 0.3, 0);
        sc.lineTo(top + spread * 0.3, 0);
        sc.lineTo(top + spread * 2.4 + 120, h * 0.85);
        sc.lineTo(top - spread * 0.6 + 120, h * 0.85);
        sc.fill();
      }
      sc.restore();
    };

    const drawDetection = (f: Fish) => {
      const sp = SPECIES[f.sp];
      f.boxW += (f.len * 1.25 - f.boxW) * 0.12;
      f.boxH += (f.len * 0.62 - f.boxH) * 0.12;
      const x = f.x - f.boxW / 2, y = f.y - f.boxH / 2 - f.len * 0.05;
      const appear = Math.min(1, (frame - (f.seenAt ?? frame)) / 20) * f.vis;

      hc.fillStyle = ACCENT;
      f.trail.forEach((p, i) => {
        hc.globalAlpha = (i / f.trail.length) * 0.6 * appear;
        hc.beginPath();
        hc.arc(p.x, p.y, 1.6, 0, 6.28);
        hc.fill();
      });
      hc.globalAlpha = appear;
      if (f.flash > 0.02) { // just hit by the sonar ring
        hc.fillStyle = `hsla(174, 90%, 65%, ${0.22 * f.flash})`;
        hc.fillRect(x, y, f.boxW, f.boxH);
        f.flash *= 0.95;
      }
      drawBrackets(hc, x, y, f.boxW, f.boxH, ACCENT);
      hc.strokeStyle = "hsla(174, 80%, 62%, 0.18)";
      hc.lineWidth = 1;
      hc.strokeRect(x, y, f.boxW, f.boxH);

      const name = f.conf < 0.3 ? "fish" : f.conf < 0.5 ? sp.family : f.conf < 0.68 ? `${sp.genus} sp.` : `${sp.genus} ${sp.species}`;
      drawTag(hc, x, y - 22, `#${f.id}  ${name}  ${Math.round(f.conf * 100)}%`, ACCENT, f.conf >= 0.68);
      hc.fillStyle = "hsla(174, 80%, 62%, 0.25)";
      hc.fillRect(x, y + f.boxH + 4, f.boxW, 2);
      hc.fillStyle = ACCENT;
      hc.fillRect(x, y + f.boxH + 4, f.boxW * f.conf, 2);
      hc.globalAlpha = 1;
    };

    const drawBubbles = () => {
      sc.lineWidth = 1;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (!reduced) {
          b.y += b.vy;
          b.vy *= b.vy < -2 ? 0.985 : 1;
          b.wob += 0.08;
          b.x += Math.sin(b.wob) * 0.6;
        }
        if (b.y < -20) { bubbles.splice(i, 1); continue; }
        sc.strokeStyle = "rgba(220,245,255,0.45)";
        sc.beginPath();
        sc.arc(b.x, b.y, b.r, 0, 6.28);
        sc.stroke();
        sc.fillStyle = "rgba(255,255,255,0.55)";
        sc.beginPath();
        sc.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, 6.28);
        sc.fill();
      }
    };

    const drawLens = (t: number) => {
      if (!mouse.active || mouse.y < 0 || mouse.y > h) return;
      if (!light) {
        const g = hc.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, LENS_R * 1.6);
        g.addColorStop(0, "hsla(180, 90%, 70%, 0.12)");
        g.addColorStop(1, "hsla(180, 90%, 70%, 0)");
        hc.fillStyle = g;
        hc.fillRect(mouse.x - LENS_R * 2, mouse.y - LENS_R * 2, LENS_R * 4, LENS_R * 4);
      }
      hc.save();
      hc.translate(mouse.x, mouse.y);
      hc.rotate(t * 0.0006);
      hc.strokeStyle = "hsla(174, 80%, 62%, 0.45)";
      hc.lineWidth = 1.5;
      hc.setLineDash([10, 14]);
      hc.beginPath();
      hc.arc(0, 0, LENS_R * 0.55, 0, 6.28);
      hc.stroke();
      hc.setLineDash([]);
      for (let k = 0; k < 4; k++) {
        hc.rotate(Math.PI / 2);
        hc.beginPath();
        hc.moveTo(LENS_R * 0.62, 0);
        hc.lineTo(LENS_R * 0.72, 0);
        hc.stroke();
      }
      hc.restore();
    };

    const step = (t: number) => {
      if (t0 < 0) {
        t0 = t;
        if (!reduced) bubbles = Array.from({ length: Math.round(w / 8) }, () => bubble(Math.random() * w, h * (0.4 + Math.random()), true));
      }
      const since = reduced ? 1e9 : t - t0;
      frame++;
      if (avoidRef?.current && frame % 30 === 1) {
        const c = hud.getBoundingClientRect(), k = w / c.width; // k undoes the parallax scale
        avoid = [...avoidRef.current.querySelectorAll("[data-avoid]")].map((el) => {
          const a = el.getBoundingClientRect();
          return { l: (a.left - c.left) * k, t: (a.top - c.top) * k, r: (a.right - c.left) * k, b: (a.bottom - c.top) * k };
        });
      }

      // descent: from the surface to ~half depth on load, deeper as the page scrolls
      const intro = Math.min(1, since / 2600);
      const depth = Math.min(1, 0.5 * (1 - Math.pow(1 - intro, 3)) + Math.min(1, window.scrollY / window.innerHeight) * 0.45);

      const g = sc.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `hsl(190 70% ${34 - 16 * depth}%)`);
      g.addColorStop(0.45, `hsl(203 65% ${19 - 9 * depth}%)`);
      g.addColorStop(1, `hsl(216 55% ${9 - 4 * depth}%)`);
      sc.fillStyle = g;
      sc.fillRect(0, 0, w, h);
      if (!light) rays2d(t);

      sc.fillStyle = "rgba(200,235,245,0.35)";
      for (const p of snow) {
        if (!reduced) {
          p.y -= p.s;
          p.x += Math.sin(t * 0.0005 + p.d * 10) * 0.15;
        }
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.d < 0.6) { sc.globalAlpha = 0.25 + p.d * 0.5; sc.beginPath(); sc.arc(p.x, p.y, p.r, 0, 6.28); sc.fill(); }
      }
      sc.globalAlpha = 1;

      // the click can land a hair after this frame's timestamp; a negative radius would throw in arc()
      const age = ping ? Math.max(0, (t - ping.t0) / 1000) : -1;
      if (ping && age > 2.6) ping = null;
      const pingR = ping ? age * PING_SPEED * h : 0;

      hc.clearRect(0, 0, w, h);
      const fishIn = Math.min(1, Math.max(0, (since - 500) / 1200));
      let inView = 0;
      fish.forEach((f, i) => {
        if (!reduced) {
          f.x += f.vx;
          f.wobble += 0.01;
          f.y += Math.sin(f.wobble) * 0.25;
        }
        const dx = f.x - mouse.x, dy = f.y - mouse.y;
        const inLens = mouse.active && dx * dx + dy * dy < LENS_R * LENS_R && f.depth < 0.3;
        const visible = f.x > f.len * 0.3 && f.x < w - f.len * 0.3;
        if (visible) inView++;
        if (ping && f.hit !== ping.id && visible && Math.hypot(f.x - ping.x, f.y - ping.y) < pingR) {
          f.hit = ping.id;
          if (f.depth < 0.3) {
            if (f.id === undefined) { f.id = nextId++; f.seenAt = frame; f.boxW = f.len * 2; f.boxH = f.len * 1.2; }
            f.conf = Math.max(f.conf, 0.7);
            f.flash = 1;
          } else {
            blips.push({ x: f.x, y: f.y, life: 1 });
          }
        }
        if (f.depth < 0.3 && visible && f.id === undefined && (since > 1400 || inLens)) {
          f.id = nextId++; f.seenAt = frame; f.boxW = f.len * 2; f.boxH = f.len * 1.2;
        }
        if (f.id !== undefined) f.conf = Math.min(0.97, f.conf + (inLens ? 0.02 : 0.006));
        if (f.id !== undefined && frame % 4 === 0) { f.trail.push({ x: f.x, y: f.y }); if (f.trail.length > 28) f.trail.shift(); }

        const bl = f.x - f.len * 0.65, br = f.x + f.len * 0.65 + 120, bt = f.y - f.len * 0.4 - 26, bb = f.y + f.len * 0.35;
        const behind = !inLens && f.flash < 0.3 && avoid.some((a) => bl < a.r && br > a.l && bt < a.b && bb > a.t);
        f.vis += ((behind ? 0 : 1) - f.vis) * 0.08;

        const sp = SPECIES[f.sp], fog = f.depth;
        sc.globalAlpha = (1 - fog * 0.65) * fishIn;
        drawFish(sc, f.x, f.y, f.len, Math.sign(f.vx), Math.sin(t * 0.008 * (1 + Math.abs(f.vx)) + f.phase) * 0.35,
          `hsl(${sp.hue} ${45 - fog * 30}% ${58 - fog * 34}%)`, `hsl(${sp.hue} ${30 - fog * 20}% ${30 - fog * 18}%)`, 0.7 - fog * 0.6);
        sc.globalAlpha = 1;
        if (f.id !== undefined && visible && f.vis > 0.02) drawDetection(f);
        if (f.vx > 0 ? f.x > w + f.len * 2 : f.x < -f.len * 2) fish[i] = spawn(false);
      });
      fish.sort((a, b) => b.depth - a.depth);

      if (!reduced && frame % 50 === 0) bubbles.push(bubble(Math.random() * w, h + 10, false));
      drawBubbles();
      sc.fillStyle = "rgba(220,245,255,0.6)";
      for (const p of snow) if (p.d >= 0.6) { sc.globalAlpha = p.d * 0.7; sc.beginPath(); sc.arc(p.x, p.y, p.r * 1.4, 0, 6.28); sc.fill(); }
      sc.globalAlpha = 1;

      light?.render(reduced ? 0 : t, depth, mouse.active ? [mouse.x, mouse.y] : null, ping ? [ping.x, ping.y, age] : null);

      // sonar: crisp rings + blips for the distant fish it found
      if (ping) {
        const a = Math.exp(-age * 1.3);
        hc.strokeStyle = `hsla(174, 90%, 70%, ${0.75 * a})`;
        hc.lineWidth = 2;
        hc.beginPath(); hc.arc(ping.x, ping.y, pingR, 0, 6.28); hc.stroke();
        hc.lineWidth = 1;
        hc.strokeStyle = `hsla(174, 90%, 70%, ${0.35 * a})`;
        hc.beginPath(); hc.arc(ping.x, ping.y, pingR * 0.82, 0, 6.28); hc.stroke();
      }
      for (let i = blips.length - 1; i >= 0; i--) {
        const b = blips[i];
        b.life -= 0.012;
        if (b.life <= 0) { blips.splice(i, 1); continue; }
        hc.strokeStyle = `hsla(174, 90%, 70%, ${b.life})`;
        hc.fillStyle = `hsla(174, 90%, 70%, ${b.life})`;
        hc.beginPath(); hc.arc(b.x, b.y, 3, 0, 6.28); hc.fill();
        hc.beginPath(); hc.arc(b.x, b.y, 6 + (1 - b.life) * 22, 0, 6.28); hc.stroke();
      }
      drawLens(t);
      if (since < 1400) { // the bright surface we just left
        hc.fillStyle = `hsla(188, 80%, 82%, ${0.6 * (1 - since / 1400) ** 2})`;
        hc.fillRect(0, 0, w, h);
      }

      if (onStats && frame % 15 === 0) {
        const tracked = fish.filter((f) => f.id !== undefined && f.x > 0 && f.x < w);
        onStats({
          inView, tracked: tracked.length,
          species: new Set(tracked.filter((f) => f.conf >= 0.68).map((f) => f.sp)).size,
          frame: 4800 + frame,
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = hud.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (w / r.width); mouse.y = (e.clientY - r.top) * (h / r.height);
      mouse.nx = mouse.x / w - 0.5;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button, input, select, textarea, nav")) return;
      const r = hud.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      ping = { x: x * (w / r.width), y: y * (h / r.height), t0: performance.now(), id: ++pingId };
      ambience.ping();
    };

    resize();
    const unobserve = onResize(scene, resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerleave", onLeave);
    const stop = runWhileVisible(hud, step);
    return () => {
      stop();
      light?.dispose();
      unobserve();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [onStats, avoidRef]);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <canvas ref={sceneRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={lightRef} className="absolute inset-0 h-full w-full" style={{ mixBlendMode: "screen" }} />
      <canvas ref={hudRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
