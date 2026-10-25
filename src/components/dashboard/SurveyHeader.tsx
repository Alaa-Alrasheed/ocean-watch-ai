import type { CompositeStatus } from "@/lib/ruleEngine";
import { PageHeader } from "@/components/PageHeader";
import { useTween } from "@/hooks/use-tween";

interface SurveyHeaderProps {
  totalSpecies?: number;
  totalIndividuals?: number;
  ecosystemStatus?: CompositeStatus;
}

const statusDisplay: Record<CompositeStatus, { label: string; color: string }> = {
  HEALTHY: { label: "Healthy", color: "text-bioluminescent" },
  MODERATELY_HEALTHY: { label: "Moderately healthy", color: "text-sand" },
  STRESSED: { label: "Stressed", color: "text-coral-soft" },
  CRITICAL: { label: "Critical", color: "text-destructive" },
};

export function SurveyHeader({
  totalSpecies = 0,
  totalIndividuals = 0,
  ecosystemStatus = "MODERATELY_HEALTHY",
}: SurveyHeaderProps) {
  const status = statusDisplay[ecosystemStatus];
  const species = useTween(totalSpecies);
  const individuals = useTween(totalIndividuals);

  return (
    <header className="space-y-8">
      <PageHeader eyebrow="Dashboard" title="Biodiversity count analysis">
        Indices, a composite score and rule-based flags, computed from species names and counts only.
        No site, date, method or baseline data goes in.
      </PageHeader>

      <dl className="panel grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          { label: "Species detected", value: Math.round(species), color: "text-foreground" },
          { label: "Total individuals", value: Math.round(individuals), color: "text-foreground" },
          { label: "Ecosystem status", value: status.label, color: status.color },
        ].map((m) => (
          <div key={m.label} className="px-6 py-5">
            <dt className="eyebrow">{m.label}</dt>
            <dd className={`mt-2 font-display text-4xl tabular-nums ${m.color}`}>{m.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
