import { Eye } from "lucide-react";
import { MonitorSpecies } from "@/data/marineData";

interface Props {
  species: MonitorSpecies[];
}

const SpeciesHUD = ({ species }: Props) => {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-primary" /> Species HUD ({species.length} Classes)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {species.map((s) => (
          <div
            key={s.id}
            className={`rounded-xl p-3 text-center transition-all ${
              s.active
                ? "glass-card border-primary/50 ring-1 ring-primary/30"
                : "bg-secondary/20 border border-border/20"
            }`}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className={`text-xs font-medium truncate ${s.active ? "text-primary" : "text-foreground"}`}>
              {s.name.split(" ").slice(-1)[0]}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{s.commonName}</p>
            {s.active && s.confidence > 0 ? (
              <div className="mt-2">
                <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${s.confidence}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-primary mt-0.5">{s.confidence}%</span>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-2">—</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeciesHUD;
