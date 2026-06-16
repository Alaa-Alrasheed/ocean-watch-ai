import type { CompositeStatus } from "@/lib/ruleEngine";

interface BiodiversityScoreProps {
  score: number;
  status: CompositeStatus;
}

const statusStyle: Record<
  CompositeStatus,
  { label: string; color: string; bg: string; ring: string; stroke: string }
> = {
  HEALTHY: {
    label: "Healthy",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
    stroke: "rgb(52 211 153)",
  },
  MODERATELY_HEALTHY: {
    label: "Moderately Healthy",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
    stroke: "rgb(110 231 183)",
  },
  STRESSED: {
    label: "Stressed",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/30",
    stroke: "rgb(251 146 60)",
  },
  CRITICAL: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/30",
    stroke: "rgb(248 113 113)",
  },
};

export function BiodiversityScore({ score, status }: BiodiversityScoreProps) {
  const displayStatus = statusStyle[status];

  // Circumference for the ring (radius = 54)
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center gap-4">
      <h3 className="font-mono text-sm text-muted-foreground tracking-wide uppercase">
        Composite Biodiversity Score
      </h3>

      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={displayStatus.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <span className={`text-xs px-3 py-1 rounded-full font-medium ${displayStatus.color} ${displayStatus.bg} ring-1 ${displayStatus.ring}`}>
        {displayStatus.label}
      </span>

      <p className="text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
        Rule-engine composite of Species Richness, Shannon, Simpson &amp; Pielou indices
      </p>
    </div>
  );
}
