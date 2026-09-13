import { AlertTriangle, Database, Fish, Hash, Percent } from "lucide-react";
import type { FishSpecies } from "@/data/marineData";
import type { ComputedIndices, SampleBand } from "@/lib/ruleEngine";

interface DatasetSummaryProps {
  species: FishSpecies[];
  indices: ComputedIndices;
  sampleSize: SampleBand;
  patternCount: number;
}

const sampleSizeLabel: Record<SampleBand, string> = {
  ADEQUATE: "Adequate",
  MARGINAL: "Marginal",
  INSUFFICIENT: "Insufficient",
};

const sampleSizeStyle: Record<SampleBand, string> = {
  ADEQUATE: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/30",
  MARGINAL: "text-orange-400 bg-orange-500/10 ring-orange-500/30",
  INSUFFICIENT: "text-red-400 bg-red-500/10 ring-red-500/30",
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function DatasetSummary({
  species,
  indices,
  sampleSize,
  patternCount,
}: DatasetSummaryProps) {
  const sortedSpecies = [...species].sort((a, b) => b.count - a.count);
  const dominant = sortedSpecies[0];
  const rarest = sortedSpecies[sortedSpecies.length - 1];
  const singletonCount = species.filter((item) => item.count === 1).length;
  const lowCountThreshold = 5;
  const lowCountSpecies = species.filter((item) => item.count <= lowCountThreshold).length;
  const topThreeShare = sortedSpecies
    .slice(0, 3)
    .reduce((sum, item) => sum + item.percentage, 0);

  const metrics = [
    {
      icon: Fish,
      label: "Dominant taxon",
      value: dominant?.scientificName ?? "None",
      detail: dominant
        ? `${dominant.count} of ${indices.totalCount} individuals`
        : "No dominant taxon",
      valueClass: "text-lg italic leading-tight",
    },
    {
      icon: Percent,
      label: "Dominant share",
      value: dominant ? formatPercent(dominant.percentage) : "0.0%",
      detail: "Percentage held by the single most abundant species",
    },
    {
      icon: Hash,
      label: "Top 3 share",
      value: formatPercent(topThreeShare),
      detail: "Cumulative abundance of the three most common species",
    },
    {
      icon: Percent,
      label: "Low-count taxa",
      value: lowCountSpecies,
      detail: `Species with ${lowCountThreshold} or fewer individuals`,
    },
  ];

  return (
    <section className="glass-card rounded-xl p-5">
      <div className="flex flex-col gap-3 border-b border-border/40 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Database className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Count Dataset Summary</h2>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This dashboard uses species names and individual species counts only. Indices,
            composite score, pattern flags, and recommendations are calculated from that
            count distribution.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${sampleSizeStyle[sampleSize]}`}
          >
            Sample size: {sampleSizeLabel[sampleSize]}
          </span>
          <span className="inline-flex items-center rounded-full bg-secondary/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border/50">
            {patternCount} {patternCount === 1 ? "rule family" : "rule families"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-border/40 bg-secondary/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {metric.label}
              </p>
              <metric.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            </div>
            <p className={`break-words text-2xl font-bold text-foreground ${metric.valueClass ?? ""}`}>
              {metric.value}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {metric.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border/40 bg-background/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Rarest detected taxon
          </p>
          <p className="mt-2 text-sm font-medium italic text-foreground">
            {rarest?.scientificName ?? "No species detected"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {rarest ? `${rarest.count} individuals (${formatPercent(rarest.percentage)})` : "No count"}
          </p>
        </div>

        <div className="rounded-lg border border-border/40 bg-background/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Singleton taxa
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{singletonCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Species represented by exactly one individual.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-3 rounded-lg border border-sand/30 bg-sand/10 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sand" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Because no site, method, date, habitat, or temporal baseline is included in this
          dataset, the dashboard can describe count structure but cannot attribute cause,
          trend, habitat condition, or regional representativeness.
        </p>
      </div>
    </section>
  );
}
