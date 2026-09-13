import { Database, Waves } from "lucide-react";
import type { CompositeStatus } from "@/lib/ruleEngine";

interface SurveyHeaderProps {
  totalSpecies?: number;
  totalIndividuals?: number;
  ecosystemStatus?: CompositeStatus;
}

const statusDisplay: Record<CompositeStatus, { label: string; color: string }> = {
  HEALTHY: { label: "Healthy", color: "text-bioluminescent" },
  MODERATELY_HEALTHY: { label: "Moderately Healthy", color: "text-sand" },
  STRESSED: { label: "Stressed", color: "text-coral-soft" },
  CRITICAL: { label: "Critical", color: "text-destructive" },
};

export function SurveyHeader({
  totalSpecies = 0,
  totalIndividuals = 0,
  ecosystemStatus = "MODERATELY_HEALTHY",
}: SurveyHeaderProps) {
  const status = statusDisplay[ecosystemStatus];

  return (
    <header className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary font-mono text-sm mb-2 animate-pulse-slow">
          <Waves className="w-4 h-4" />
          <span>MARINE BIODIVERSITY MONITOR</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight glow-text">
          Biodiversity Count Analysis
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Species-count input, biodiversity indices, composite score, and rule-based
          ecological flags.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="glass-card rounded-lg px-3.5 py-2 flex items-center gap-2 text-sm">
          <Database className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">Input basis:</span>
          <span className="font-medium text-foreground">species names + counts</span>
        </div>
        <div className="glass-card rounded-lg px-3.5 py-2 text-sm text-muted-foreground">
          No site, time, method, habitat, or baseline metadata supplied
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Species Detected", value: totalSpecies, color: "text-primary" },
          { label: "Total Individuals", value: totalIndividuals, color: "text-foreground" },
          { label: "Ecosystem Status", value: status.label, color: status.color },
        ].map((m) => (
          <div key={m.label} className="glass-card rounded-xl p-4 text-center">
            <p className={`text-2xl md:text-3xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </header>
  );
}
