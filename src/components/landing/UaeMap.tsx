import { useRef } from "react";
import { LAND, PLACES, VIEW } from "./uaeGeo";
import { reducedMotion } from "./fish";
import { ease, lerp, seg, useScene } from "./scene";

/**
 * The UAE coast from Natural Earth data, driven by scroll: the coastline draws
 * itself in, a sonar comes on over Khor Fakkan (where the detector was tested)
 * and the camera closes in on the east coast. Fujairah is the partner site.
 * The zoom is centred on Khor Fakkan, so the sonar and its label never move.
 */

const R = 230; // sonar range, map units
const ZOOM = 1.9;

export default function UaeMap() {
  const [kx, ky] = PLACES.khorFakkan, [fx, fy] = PLACES.fujairah;
  const wrap = useRef<HTMLDivElement>(null);
  const outline = useRef<SVGPathElement>(null);
  const fill = useRef<SVGPathElement>(null);
  const towns = useRef<SVGGElement>(null);
  const fuj = useRef<SVGGElement>(null);

  useScene(({ p }) => {
    const draw = seg(p, 0, 0.35), on = seg(p, 0.25, 0.45);
    const z = reducedMotion() ? 0 : ease(seg(p, 0.5, 0.85)), s = lerp(1, ZOOM, z);
    const el = wrap.current!;
    const zoom = `translate(${kx * (1 - s)} ${ky * (1 - s)}) scale(${s})`;
    el.querySelectorAll("[data-zoom]").forEach((g) => g.setAttribute("transform", zoom));
    el.querySelectorAll<SVGGElement>("[data-on]").forEach((g) => { g.style.opacity = String(on); });
    outline.current!.setAttribute("stroke-dashoffset", String(1 - draw));
    outline.current!.setAttribute("stroke-width", String(1.6 / s));
    fill.current!.setAttribute("fill-opacity", String(0.45 * on));
    towns.current!.style.opacity = String(seg(p, 0.08, 0.3) * (1 - z));
    fuj.current!.setAttribute("transform", `translate(${(fx - kx) * (s - 1)} ${(fy - ky) * (s - 1)})`);
    // the zoom pushes the coast past the top, bottom and left of the frame: fade those edges
    // instead of cutting them (the right edge is open sea, and the Khor Fakkan label sits near it)
    const f = 16 * z;
    const m = z > 0
      ? `linear-gradient(to bottom, transparent, #000 ${f}%, #000 ${100 - f}%, transparent), linear-gradient(to right, transparent, #000 ${f}%)`
      : "none";
    el.style.setProperty("-webkit-mask-image", m);
    el.style.setProperty("-webkit-mask-composite", "source-in");
    el.style.setProperty("mask-image", m);
    el.style.setProperty("mask-composite", "intersect");
  });

  return (
    <div ref={wrap} className="relative">
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="h-auto w-full" role="img"
        aria-label="Map of the UAE with Khor Fakkan and Fujairah marked on the east coast">
        <defs>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="hsl(174 80% 60%)" stopOpacity="0" />
            <stop offset="1" stopColor="hsl(174 80% 60%)" stopOpacity="0.14" />
          </linearGradient>
          <clipPath id="sea-r"><circle cx={kx} cy={ky} r={R} /></clipPath>
          {/* neighbouring land fades out before it reaches the frame: a radial fade, then the edges darkened to nothing */}
          <radialGradient id="fade-g" cx="0.6" cy="0.42" r="0.6">
            <stop offset="0.45" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          {[["r", 0, 0, 1, 0], ["b", 0, 0, 0, 1], ["t", 0, 1, 0, 0]].map(([id, x1, y1, x2, y2]) => (
            <linearGradient key={id} id={`edge-${id}`} x1={x1} y1={y1} x2={x2} y2={y2}>
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
          ))}
          <mask id="fade">
            <rect width={VIEW.w} height={VIEW.h} fill="url(#fade-g)" />
            <rect x={VIEW.w * 0.8} width={VIEW.w * 0.2} height={VIEW.h} fill="url(#edge-r)" />
            <rect y={VIEW.h * 0.78} width={VIEW.w} height={VIEW.h * 0.22} fill="url(#edge-b)" />
            <rect width={VIEW.w} height={VIEW.h * 0.12} fill="url(#edge-t)" />
          </mask>
        </defs>

        <g mask="url(#fade)">
          <g data-zoom="">
            {/* shallow water along the coasts */}
            {[46, 26, 12].map((sw) => (
              <path key={sw} d={LAND.uae + LAND.oman + LAND.qatar + LAND.saudi} fill="none" stroke="hsl(186 70% 45%)"
                strokeOpacity={0.05} strokeWidth={sw} strokeLinejoin="round" />
            ))}
            {[LAND.saudi, LAND.qatar, LAND.oman].map((d, i) => (
              <path key={i} d={d} fillRule="evenodd" fill="hsl(212 28% 13%)" stroke="hsl(210 22% 28%)" strokeWidth="1" />
            ))}
          </g>
          {/* sonar sweep over Khor Fakkan */}
          <g data-on="" style={{ opacity: 0 }}>
            <g clipPath="url(#sea-r)" className="map-sweep" style={{ transformOrigin: `${kx}px ${ky}px` }}>
              <path d={`M${kx} ${ky}L${kx + R} ${ky}A${R} ${R} 0 0 1 ${kx + R * Math.cos(0.7)} ${ky + R * Math.sin(0.7)}Z`} fill="url(#sweep)" />
            </g>
          </g>
        </g>

        <g data-zoom="">
          <path ref={fill} d={LAND.uae} fillRule="evenodd" fill="hsl(176 40% 24%)" fillOpacity={0} />
          <path ref={outline} d={LAND.uae} fill="none" stroke="hsl(174 70% 62%)" strokeWidth="1.6" strokeLinejoin="round"
            pathLength={1} strokeDasharray="1" strokeDashoffset={1} />
        </g>

        <g data-on="" style={{ opacity: 0 }}>
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <circle key={k} cx={kx} cy={ky} r={R * k} fill="none" stroke="hsl(174 70% 60%)" strokeOpacity={0.12} strokeDasharray="2 6" />
          ))}
        </g>

        <g ref={towns} data-zoom="" style={{ opacity: 0 }}>
          <g fontFamily="Newsreader, Georgia, serif" fontStyle="italic" fill="hsl(200 25% 62%)" fontSize="19" letterSpacing="5">
            <text x={PLACES.arabianGulf[0]} y={PLACES.arabianGulf[1]} textAnchor="middle">ARABIAN GULF</text>
            <text x={PLACES.gulfOfOman[0]} y={PLACES.gulfOfOman[1]} textAnchor="middle">GULF OF<tspan x={PLACES.gulfOfOman[0]} dy="26">OMAN</tspan></text>
          </g>
          <g fill="hsl(200 20% 60%)" fontSize="15">
            {([["Dubai", PLACES.dubai, 9, 5], ["Abu Dhabi", PLACES.abuDhabi, 6, 22]] as const).map(([name, [x, y], dx, dy]) => (
              <g key={name}>
                <circle cx={x} cy={y} r="3" />
                <text x={x + dx} y={y + dy}>{name}</text>
              </g>
            ))}
          </g>
        </g>

        <g ref={fuj} data-on="" style={{ opacity: 0 }}>
          <circle cx={fx} cy={fy} r="4.5" fill="hsl(var(--sand))" />
          <line x1={fx + 10} y1={fy} x2={fx + 46} y2={fy + 24} stroke="hsl(var(--sand))" strokeWidth="1" />
          <text x={fx + 50} y={fy + 34} fill="hsl(195 60% 92%)" fontSize="18">Fujairah</text>
        </g>
        <g data-on="" style={{ opacity: 0 }}>
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={kx} cy={ky} r="8" fill="none" stroke="hsl(174 80% 62%)" strokeWidth="2" className="map-ping" style={{ animationDelay: `${k * 0.8}s` }} />
          ))}
          <circle cx={kx} cy={ky} r="5" fill="hsl(174 80% 62%)" />
          <line x1={kx + 10} y1={ky} x2={kx + 46} y2={ky - 26} stroke="hsl(174 70% 62%)" strokeWidth="1" />
          <text x={kx + 50} y={ky - 30} fill="hsl(195 60% 92%)" fontSize="18">Khor Fakkan</text>
        </g>
      </svg>
    </div>
  );
}
