import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Fish, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestEntry } from "@/hooks/use-guest-entry";
import OceanCanvas, { type SceneStats } from "@/components/landing/OceanCanvas";
import SpeciesMorph from "@/components/landing/SpeciesMorph";
import PipelineStage from "@/components/landing/PipelineStage";
import DeepSea from "@/components/landing/DeepSea";
import UaeMap from "@/components/landing/UaeMap";
import { AccuracyRings, FishGrid } from "@/components/landing/Figures";
import { Count, Scene, Words, seg, useScene } from "@/components/landing/scene";
import { reducedMotion } from "@/components/landing/fish";
import { ambience } from "@/components/landing/sound";

function DepthGauge() {
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      setDepth(progress * 40);
      ambience.setDepth(progress);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 lg:flex" aria-hidden="true">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">depth</span>
      <div className="relative h-48 w-px bg-border">
        <div className="absolute left-0 top-0 w-px bg-foreground/70" style={{ height: `${(depth / 40) * 100}%` }} />
        <div className="absolute -left-[4px] h-[9px] w-[9px] rounded-full border border-foreground/80 bg-background" style={{ top: `calc(${(depth / 40) * 100}% - 4px)` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-foreground/80">−{depth.toFixed(1)} m</span>
    </div>
  );
}

function SoundToggle() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOn(ambience.toggle())}
      aria-pressed={on}
      aria-label="Underwater sound"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-md border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
    >
      {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      <span className="hidden sm:inline">{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}

/** Signed in: go upload. Signed out: one click starts a guest session, no sign-up. */
function TryItButton() {
  const { user } = useAuth();
  const { enter, busy } = useGuestEntry();
  const inner = (
    <>
      {user ? "Upload a video" : "Try it on a video"}
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
    </>
  );
  return user ? (
    <Button asChild size="lg" className="h-12 gap-2 px-7 text-base">
      <Link to="/data-explorer">{inner}</Link>
    </Button>
  ) : (
    <Button size="lg" className="h-12 gap-2 px-7 text-base" onClick={enter} disabled={busy}>
      {inner}
    </Button>
  );
}

function Hero() {
  const [stats, setStats] = useState<SceneStats>({ inView: 0, tracked: 0, species: 0, frame: 4800 });
  const onStats = useCallback((s: SceneStats) => setStats(s), []);
  const textRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  // scrolling sinks the title and pushes the camera in
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, window.scrollY / window.innerHeight);
        if (textRef.current) {
          textRef.current.style.transform = `translateY(${p * 120}px)`;
          textRef.current.style.opacity = String(1 - p * 1.4);
        }
        if (sceneRef.current) sceneRef.current.style.transform = `scale(${1 + p * 0.2})`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div ref={sceneRef} className="absolute inset-0 will-change-transform">
        <OceanCanvas onStats={onStats} avoidRef={textRef} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,transparent_30%,hsl(216_55%_6%/0.65)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[hsl(212_52%_8%)]" />

      <div ref={textRef} className="pointer-events-none absolute inset-x-0 bottom-[13%] mx-auto max-w-7xl px-6 will-change-transform md:px-10">
        <h1 className="hero-in font-display text-[3.4rem] leading-[0.98] tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-7xl md:text-[6.2rem]" style={{ animationDelay: "1300ms" }}>
          <span data-avoid className="block w-fit">Which fish are</span>
          <span data-avoid className="block w-fit">in your footage?</span>
        </h1>
        <p className="hero-in mt-5 text-sm text-foreground/70 md:hidden" style={{ animationDelay: "2200ms" }}>Tap the water to send a sonar ping.</p>
        <div data-avoid className="hero-in pointer-events-auto mt-8 w-fit md:mt-10" style={{ animationDelay: "1800ms" }}>
          <TryItButton />
        </div>
      </div>

      <div className="hero-in pointer-events-none absolute bottom-6 right-4 z-10 hidden text-right md:block lg:right-16" style={{ animationDelay: "2300ms" }}>
        <div className="inline-block rounded-md border border-border/60 bg-background/45 px-4 py-3 text-left font-mono text-xs backdrop-blur">
          <div className="mb-2 text-muted-foreground">simulated feed · frame {String(stats.frame).padStart(6, "0")}</div>
          <div className="grid grid-cols-3 gap-5 text-muted-foreground">
            <div><div className="text-lg tabular-nums text-foreground">{stats.inView}</div>in view</div>
            <div><div className="text-lg tabular-nums text-foreground">{stats.tracked}</div>tracked</div>
            <div><div className="text-lg tabular-nums text-foreground">{stats.species}</div>species</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Click the water to send a sonar ping.</p>
      </div>
    </section>
  );
}

/**
 * One unit-chart statistic, animated while the scene scrolls through `range`.
 * Side by side on wide screens (both shown from `showAt`); on phones they share
 * one spot, each appearing just before its range and the first leaving at `hideAt`.
 */
function Stat({ value, from, to, prefix, text, source, mode, range, showAt = range[0], hideAt }: {
  value: number; from: number; to: number; prefix: string; text: string; source: string;
  mode: "vanish" | "turn"; range: [number, number]; showAt?: number; hideAt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useScene(({ p }) => {
    const narrow = window.innerWidth < 768, at = narrow ? range[0] : showAt;
    const hide = narrow && hideAt !== undefined ? seg(p, hideAt - 0.05, hideAt) : 0;
    ref.current!.style.opacity = String(seg(p, at - 0.06, at) * (1 - hide));
  });
  return (
    <div ref={ref} className="opacity-0 [grid-area:1/1] md:[grid-area:auto]">
      <FishGrid mode={mode} from={from} to={to} range={range} />
      <div className="mt-5 font-display text-5xl tabular-nums text-[hsl(var(--coral))] sm:text-6xl md:mt-8 lg:text-7xl [@media(min-height:860px)]:lg:text-8xl">
        <Count from={from} to={value} range={range} prefix={prefix} suffix="%" />
      </div>
      <p className="mt-3 max-w-sm leading-snug text-foreground/85 md:text-lg">{text}</p>
      <p className="mt-2 text-xs text-muted-foreground">{source}</p>
    </div>
  );
}

const Index = () => {
  return (
    <div className="landing relative isolate min-h-screen overflow-x-clip">
      <DeepSea />
      <DepthGauge />
      <SoundToggle />
      <Hero />

      <SpeciesMorph />

      <Scene height="240vh" className="flex items-center">
        <div className="scene-recede mx-auto w-full max-w-6xl px-6 md:px-10">
          <h2 className="scene-rise text-balance font-display text-4xl leading-tight md:text-6xl">How often the name is right</h2>
          <div className="scene-rise mt-6 grid items-center gap-8 md:mt-14 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-16">
            <p className="max-w-md leading-relaxed text-muted-foreground">
              Top-1 accuracy on OzFish test sites the model never saw in training. When it isn't sure of the
              species, it says so and reports the genus or family instead.
            </p>
            <AccuracyRings range={[0.04, 0.72]} />
          </div>
        </div>
      </Scene>

      <PipelineStage />

      <Scene height="300vh" className="flex items-center">
        <div className="scene-recede mx-auto w-full max-w-6xl px-6 md:px-10">
          <div className="scene-rise">
            <Words range={[0, 0.26]} className="max-w-3xl text-balance font-display text-[1.75rem] leading-tight sm:text-[2rem] md:text-5xl [@media(min-height:860px)]:md:text-6xl"
              text="Fish populations are falling, and most surveys are still counted by hand." />
          </div>
          <div className="mt-8 grid md:mt-12 md:grid-cols-2 md:gap-20">
            <Stat mode="vanish" value={49} from={0} to={49} prefix="−" range={[0.3, 0.6]} hideAt={0.62}
              text="Marine vertebrate populations between 1970 and 2012."
              source="WWF, Living Blue Planet Report (2015)" />
            <Stat mode="turn" value={38} from={10} to={38} prefix="" range={[0.66, 0.94]} showAt={0.3}
              text="Share of assessed fish stocks that were overfished in 2021, up from 10% in 1974."
              source="FAO, The State of World Fisheries and Aquaculture (2024)" />
          </div>
        </div>
      </Scene>

      <Scene height="260vh" className="flex items-center">
        <div className="scene-recede mx-auto grid w-full max-w-6xl items-center gap-6 px-6 md:grid-cols-[1fr_1.7fr] md:gap-12 md:px-10">
          <div className="scene-rise">
            <h2 className="text-balance font-display text-4xl leading-tight md:text-6xl">Tested on UAE footage</h2>
            <div className="mt-5 font-display text-6xl tabular-nums md:mt-10 md:text-8xl">
              <Count to={90.6} decimals={1} suffix="%" range={[0.3, 0.75]} />
            </div>
            <p className="mt-2 max-w-xs leading-relaxed text-muted-foreground">
              of the fish in survey video from Khor Fakkan were found by the detector.
            </p>
            <p className="mt-6 hidden max-w-sm text-sm text-muted-foreground sm:block">
              In collaboration with Fujairah Research Centre and the University of Khorfakkan.
            </p>
          </div>
          <UaeMap />
        </div>
      </Scene>

      <Scene pin={false} className="reveal-up mx-auto max-w-6xl px-6 pb-40 pt-24 md:px-10">
        <h2 className="max-w-4xl text-balance font-display text-5xl leading-[1.05] md:text-7xl">Have footage from a dive or a BRUV?</h2>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Upload it and get back species counts, MaxN and diversity indices for the whole video.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <TryItButton />
          <Button asChild size="lg" variant="outline" className="h-12 gap-2 px-7 text-base">
            <a href="/bioreef-sample.mp4" download>
              <Download className="h-4 w-4" /> Sample video (45 s, 15 MB)
            </a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No footage? Download the sample, then upload it. Sample from the OzFish dataset (AIMS, CC BY 3.0 AU).</p>
      </Scene>

      <footer className="border-t border-border/50 px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2 text-foreground">
            <Fish className="h-4 w-4" /> BioReef.ai
          </div>
          <p className="max-w-xl md:text-right">
            University of Sharjah, College of Computing and Informatics. In collaboration with Fujairah Research
            Centre and the University of Khorfakkan.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
