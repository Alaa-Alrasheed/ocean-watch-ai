import { FishSpecies } from "@/data/marineData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const trendIcons = {
  increasing: <TrendingUp className="w-4 h-4 text-bioluminescent" />,
  stable: <Minus className="w-4 h-4 text-muted-foreground" />,
  decreasing: <TrendingDown className="w-4 h-4 text-accent" />,
};

const categoryBadge = {
  reef: "bg-bioluminescent/10 text-bioluminescent",
  pelagic: "bg-sand/10 text-sand",
  demersal: "bg-coral-soft/10 text-coral-soft",
};

export function SpeciesTable({ species }: { species: FishSpecies[] }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <h2 className="text-lg font-semibold">Species Detection Results</h2>
        <p className="text-sm text-muted-foreground mt-1">AI-classified fish species from underwater video analysis</p>
      </div>
      <div className="overflow-auto max-h-96">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground uppercase tracking-wider">Species</th>
              <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="text-right px-5 py-3 text-xs font-mono text-muted-foreground uppercase tracking-wider">Count</th>
              <th className="text-right px-5 py-3 text-xs font-mono text-muted-foreground uppercase tracking-wider">Abundance</th>
              <th className="text-center px-5 py-3 text-xs font-mono text-muted-foreground uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody>
            {species.map((s) => (
              <tr key={s.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground italic">{s.scientificName}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${categoryBadge[s.category]}`}>{s.category}</span>
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm">{s.count}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${s.percentage * 5}%` }} />
                    </div>
                    <span className="font-mono text-sm text-muted-foreground w-12 text-right">{s.percentage}%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center flex justify-center">{trendIcons[s.trend]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
