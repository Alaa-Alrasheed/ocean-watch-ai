import type { CompositeStatus } from "@/lib/ruleEngine";
import { useTween } from "@/hooks/use-tween";

interface BiodiversityScoreProps {
  score: number;
  status: CompositeStatus;
}

const statusStyle: Record<CompositeStatus, { label: string; color: string; bg: string; stroke: string }> = {
  HEALTHY: { label: "Healthy", color: "text-bioluminescent", bg: "bg-bioluminescent/10", stroke: "hsl(var(--bioluminescent))" },
  MODERATELY_HEALTHY: { label: "Moderately healthy", color: "text-sand", bg: "bg-sand/10", stroke: "hsl(var(--sand))" },
  STRESSED: { label: "Stressed", color: "text-coral-soft", bg: "bg-coral-soft/10", stroke: "hsl(var(--coral-soft))" },
  CRITICAL: { label: "Critical", color: "text-destructive", bg: "bg-destructive/10", stroke: "hsl(var(--destructive))" },
};

export function BiodiversityScore({ score, status }: BiodiversityScoreProps) {
  const displayStatus = statusStyle[status];
  const shown = useTween(score);

  // Circumference for the ring (radius = 54)
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (shown / 100) * circumference;

  return (
    <div className="panel flex flex-col items-center justify-center gap-4 p-6">
      <h3 className="eyebrow text-center">Composite score</h3>

      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={displayStatus.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl tabular-nums text-foreground">{Math.round(shown)}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <span className={`rounded-full px-3 py-1 text-xs font-medium ${displayStatus.color} ${displayStatus.bg}`}>
        {displayStatus.label}
      </span>

      <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
        Combines species richness, Shannon, Simpson and Pielou
      </p>
    </div>
  );
}
