import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { RunInfo } from "@/data/monitorDatasets";

/**
 * Shown in place of the player while the worker analyses a video. The stages are the
 * worker's real ones: queued (pending), analysing frames (progress 0-0.95, every frame
 * goes through detect -> track -> identify), then encoding + upload (0.95 until done).
 */

const ENCODE_AT = 0.95;

const STEPS = [
  { title: "Uploaded", line: "Your video is saved." },
  { title: "Waiting for the server", line: "Next in line for analysis." },
  { title: "Analysing frames", line: "Finding, tracking and naming every fish." },
  { title: "Preparing the result", line: "Drawing boxes and labels on your video." },
];

function stepOf(run: RunInfo): number {
  if (run.status === "pending") return 1;
  return run.progress >= ENCODE_AT ? 3 : 2;
}

/** Time left from how fast progress has moved since this page first saw the run. */
function useEta(run: RunInfo): string | null {
  const first = useRef<{ t: number; p: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (run.status !== "processing") return null;
  if (!first.current) first.current = { t: Date.now(), p: run.progress };
  const dt = (now - first.current.t) / 1000, dp = run.progress - first.current.p;
  if (dt < 10 || dp <= 0.01) return null;          // not enough movement to trust a rate yet
  const left = Math.max(0, (ENCODE_AT - run.progress) / (dp / dt)) + 15;   // + encode/upload
  if (left < 60) return "Less than a minute left";
  return `About ${Math.round(left / 60)} min left`;
}

function useSecondsSince(active: boolean): number {
  const start = useRef(Date.now());
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!active) return;
    start.current = Date.now();
    const id = setInterval(() => setS(Math.floor((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);
  return s;
}

export default function ProcessingView({ run, videoUrl, name }: { run: RunInfo; videoUrl?: string; name: string }) {
  const step = stepOf(run);
  const pct = run.status === "pending" ? 0 : Math.round(Math.min(run.progress, 1) * 100);
  const eta = useEta(run);
  const waited = useSecondsSince(run.status === "pending");

  return (
    <div className="panel overflow-hidden" aria-live="polite">
      {/* their footage, dimmed, with a scan line sweeping over it */}
      <div className="relative aspect-video overflow-hidden bg-ocean-deep">
        {videoUrl && (
          <video src={videoUrl} autoPlay muted loop playsInline
                 className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-[2px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background/70" />
        {run.status === "processing" && <div className="scan-line" aria-hidden="true" />}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          {run.status === "pending" ? (
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
          ) : (
            <span className="font-mono text-5xl font-semibold tabular-nums md:text-6xl">{pct}%</span>
          )}
          <p className="font-display text-xl md:text-2xl">{STEPS[step].title}</p>
          <p className="max-w-sm truncate text-xs text-muted-foreground">{name}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-border/60">
          <div className="h-full bg-primary transition-[width] duration-1000 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-5 p-5">
        <ol className="grid gap-4 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className={`flex gap-3 transition-opacity ${i > step ? "opacity-40" : ""}`}>
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                i < step ? "border-primary bg-primary text-primary-foreground"
                  : i === step ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i === step ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
              </span>
              <span>
                <span className="block text-sm font-medium">{s.title}</span>
                <span className="block text-xs text-muted-foreground">{s.line}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          {eta ? `${eta}. ` : ""}
          {run.status === "pending" && waited > 60
            ? "This is taking longer than usual; the analysis server may be busy or offline. "
            : ""}
          You can leave this page; the result will be here when you come back.
        </p>
      </div>
    </div>
  );
}
