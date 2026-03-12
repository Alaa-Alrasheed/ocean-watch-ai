import { BiodiversityIndex } from "@/data/marineData";

const statusColors = {
  healthy: "text-bioluminescent",
  moderate: "text-sand",
  stressed: "text-accent",
};

const statusBg = {
  healthy: "bg-bioluminescent/10",
  moderate: "bg-sand/10",
  stressed: "bg-accent/10",
};

export function HealthIndicator({ index }: { index: BiodiversityIndex }) {
  const pct = (index.value / index.maxValue) * 100;

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
          className="h-full rounded-full bg-primary transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{index.description}</p>
    </div>
  );
}
