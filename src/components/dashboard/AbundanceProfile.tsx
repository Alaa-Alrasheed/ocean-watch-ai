import { Percent } from "lucide-react";
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
      color: "text-coral-soft",
      fill: "bg-coral-soft",
    };
  }

  if (percentage >= 40) {
    return {
      label: "Elevated dominance",
      color: "text-sand",
      fill: "bg-sand",
    };
  }

  return {
    label: "No single-species dominance",
    color: "text-bioluminescent",
    fill: "bg-bioluminescent",
  };
}

export function AbundanceProfile({ species }: AbundanceProfileProps) {
  const sortedSpecies = [...species].sort((a, b) => b.count - a.count);
  const dominant = sortedSpecies[0];
  const band = dominanceBand(dominant?.percentage ?? 0);
  const shouldScroll = sortedSpecies.length > 6;

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">Abundance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every species, ranked by count, with its share of the total.
          </p>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold ring-1 ring-border ${band.color}`}>
          <Percent className="h-3.5 w-3.5" aria-hidden="true" />
          {band.label}
        </span>
      </div>

      {sortedSpecies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No positive species counts are available for ranking.
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-background/15">
          <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto_auto] gap-3 border-b border-border/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Rank</span>
            <span>Species</span>
            <span className="text-right">Count</span>
            <span className="text-right">Share</span>
          </div>
          <div
            className={`divide-y divide-border/30 ${
            shouldScroll
              ? "max-h-[22rem] overflow-y-auto overscroll-contain"
              : ""
          }`}
          >
            {sortedSpecies.map((item, index) => {
              const isDominant = index === 0;
              const fill = isDominant ? band.fill : "bg-primary";

              return (
                <div key={item.id} className="group relative overflow-hidden px-3 py-2.5 hover:bg-secondary/20">
                  <div
                    className={`absolute inset-x-0 bottom-0 h-0.5 opacity-70 ${fill}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                  <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto_auto] items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{index + 1}</span>
                    <p className="truncate text-sm font-medium italic text-foreground">
                      {item.scientificName}
                    </p>
                    <span className="font-mono text-sm text-foreground">{item.count}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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
