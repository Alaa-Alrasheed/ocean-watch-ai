import { BarChart3, Percent } from "lucide-react";
import type { FishSpecies } from "@/data/marineData";

interface AbundanceProfileProps {
  species: FishSpecies[];
}

function dominanceBand(percentage: number): {
  label: string;
  color: string;
  fill: string;
} {
  if (percentage >= 65) {
    return {
      label: "High dominance",
      color: "text-red-400",
      fill: "bg-red-500",
    };
  }

  if (percentage >= 40) {
    return {
      label: "Elevated dominance",
      color: "text-orange-400",
      fill: "bg-orange-400",
    };
  }

  return {
    label: "No single-species dominance",
    color: "text-emerald-400",
    fill: "bg-emerald-400",
  };
}

export function AbundanceProfile({ species }: AbundanceProfileProps) {
  const sortedSpecies = [...species].sort((a, b) => b.count - a.count);
  const dominant = sortedSpecies[0];
  const band = dominanceBand(dominant?.percentage ?? 0);
  const shouldScroll = sortedSpecies.length > 5;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Ranked Abundance Profile</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Count-derived dominance and species contribution.
          </p>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full bg-secondary/40 px-2.5 py-1 text-xs font-semibold ring-1 ring-border/50 ${band.color}`}>
          <Percent className="h-3.5 w-3.5" aria-hidden="true" />
          {band.label}
        </span>
      </div>

      {sortedSpecies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No positive species counts are available for ranking.
        </div>
      ) : (
        <div
          className={`space-y-3 ${
            shouldScroll
              ? "max-h-[22rem] overflow-y-auto overscroll-contain pr-2"
              : ""
          }`}
        >
          {sortedSpecies.map((item, index) => {
            const isDominant = index === 0;
            const fill = isDominant ? band.fill : "bg-primary";

            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium italic text-foreground">
                      {item.scientificName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Rank {index + 1}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm text-foreground">{item.count}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {item.percentage}%
                    </p>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${fill}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 border-t border-border/40 pt-3 text-xs leading-relaxed text-muted-foreground">
        Dominance is evaluated from the relative share of each species in this dataset.
        It does not identify why a taxon is abundant; replicate count datasets are needed
        before treating dominance as a persistent ecological pattern.
      </p>
    </div>
  );
}
