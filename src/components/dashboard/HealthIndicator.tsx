import { BiodiversityIndex } from "@/data/marineData";
import { useTween } from "@/hooks/use-tween";

// the one status palette: teal good, sand caution, coral bad
const statusColors = {
  healthy: "text-bioluminescent",
  moderate: "text-sand",
  stressed: "text-coral-soft",
};

const statusBg = {
  healthy: "bg-bioluminescent/10",
  moderate: "bg-sand/10",
  stressed: "bg-coral-soft/10",
};

const progressColors = {
  healthy: "bg-bioluminescent",
  moderate: "bg-sand",
  stressed: "bg-coral-soft",
};

function formatIndexValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function HealthIndicator({ index }: { index: BiodiversityIndex }) {
  const pct = useTween(Math.min((index.value / index.maxValue) * 100, 100));
  const shown = useTween(index.value);
  const isAboveScale = index.value > index.maxValue;
  const scaleLabel = index.scaleLabel ?? `0-${index.maxValue}`;
  // count up in the same precision as the final value
  const decimals = Number.isInteger(index.value) ? 0 : 2;

  return (
    <div className="panel space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm text-muted-foreground">{index.name}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[index.status]} ${statusBg[index.status]}`}>
          {index.status}
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
        <span className="break-all font-display text-4xl tabular-nums text-foreground">
          {shown === index.value ? formatIndexValue(index.value) : shown.toFixed(decimals)}
        </span>
        <span className="mb-1.5 text-xs text-muted-foreground">{scaleLabel}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${progressColors[index.status]}`} style={{ width: `${pct}%` }} />
      </div>
      {isAboveScale && (
        <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
          Scoring cap reached; raw value retained
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">{index.description}</p>
    </div>
  );
}
