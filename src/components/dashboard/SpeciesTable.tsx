import { ChevronDown, Table2 } from "lucide-react";
import { FishSpecies } from "@/data/marineData";

export function SpeciesTable({ species }: { species: FishSpecies[] }) {
  const sortedSpecies = [...species].sort((a, b) => b.count - a.count);

  return (
    <details className="group glass-card overflow-hidden rounded-xl">
      <summary className="flex cursor-pointer list-none flex-col gap-3 p-5 transition-colors hover:bg-secondary/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Table2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">Raw Species Count Records</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Collapsed to avoid duplicating the ranked abundance profile.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{sortedSpecies.length} taxa</span>
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </div>
      </summary>

      <div className="border-t border-border/50">
        {sortedSpecies.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No positive species counts are available for this dataset.
          </p>
        ) : (
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border/30">
                  <th className="px-5 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Rank
                  </th>
                  <th className="px-5 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Species
                  </th>
                  <th className="px-5 py-3 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Count
                  </th>
                  <th className="px-5 py-3 text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSpecies.map((s, index) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/20 transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3.5 font-mono text-sm text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="min-w-56 px-5 py-3.5">
                      <div className="max-w-xl">
                        <p className="text-sm font-medium italic">
                          {s.scientificName}
                        </p>
                        {s.name !== s.scientificName && (
                          <p className="text-xs text-muted-foreground">{s.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm">
                      {s.count}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm text-muted-foreground">
                      {s.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  );
}
