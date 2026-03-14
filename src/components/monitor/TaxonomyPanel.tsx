import { Cpu } from "lucide-react";

interface Detection {
  name: string;
  commonName: string;
  confidence: number;
}

const families: Record<string, string> = {
  Siganus: "Siganidae",
  Rastrelliger: "Scombridae",
  Scarus: "Scaridae",
  Lethrinus: "Lethrinidae",
  Lutjanus: "Lutjanidae",
  Epinephelus: "Serranidae",
  Cephalopholis: "Serranidae",
  Pomacanthus: "Pomacanthidae",
  Scomberomorus: "Scombridae",
  Caranx: "Carangidae",
  Platax: "Ephippidae",
  Acanthurus: "Acanthuridae",
  Stegostoma: "Stegostomatidae",
};

interface Props {
  detection: Detection | null;
}

const TaxonomyPanel = ({ detection }: Props) => {
  const genus = detection?.name.split(" ")[0] || "";
  const family = families[genus] || "Unknown";

  const rows = detection
    ? [
        { label: "FAMILY", value: family },
        { label: "GENUS", value: genus },
        { label: "SPECIES", value: detection.name },
        { label: "COMMON", value: detection.commonName },
        { label: "CONFIDENCE", value: `${detection.confidence}%` },
      ]
    : null;

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 uppercase tracking-wider text-muted-foreground">
        <Cpu className="w-4 h-4" /> Taxonomic Intelligence
      </h3>
      {rows ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs font-mono">{row.label}</span>
              <span className="text-primary font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No active detection</p>
      )}
    </div>
  );
};

export default TaxonomyPanel;
