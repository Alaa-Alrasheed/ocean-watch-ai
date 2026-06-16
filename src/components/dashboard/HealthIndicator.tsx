import { BiodiversityIndex } from "@/data/marineData";

const statusColors = {
  healthy: "text-emerald-400",
  moderate: "text-orange-400",
  stressed: "text-red-400",
};

const statusBg = {
  healthy: "bg-emerald-500/10",
  moderate: "bg-orange-500/10",
  stressed: "bg-red-500/10",
};

const progressColors = {
  healthy: "bg-emerald-400",
  moderate: "bg-orange-400",
  stressed: "bg-red-500",
};

export function HealthIndicator({ index }: { index: BiodiversityIndex }) {
  const pct = Math.min((index.value / index.maxValue) * 100, 100);

  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm text-muted-foreground">{index.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[index.status]} ${statusBg[index.status]}`}>
          {index.status}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground">{index.value}</span>
        <span className="text-sm text-muted-foreground mb-1">/ {index.maxValue}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${progressColors[index.status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{index.description}</p>
    </div>
  );
}
