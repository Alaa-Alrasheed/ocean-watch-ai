import { useState, useEffect, useCallback } from "react";
import { Video, Zap, Cpu, HardDrive, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { monitorSpecies, MonitorSpecies } from "@/data/marineData";

const LiveMonitor = () => {
  const [demoMode, setDemoMode] = useState(true);
  const [rawFeed, setRawFeed] = useState(true);
  const [fps, setFps] = useState(19.8);
  const [vram, setVram] = useState(2.42);
  const [totalDetections, setTotalDetections] = useState(1);
  const [species, setSpecies] = useState<MonitorSpecies[]>(monitorSpecies);
  const [activeSpecies, setActiveSpecies] = useState<MonitorSpecies | null>(
    monitorSpecies.find((s) => s.active) || null
  );

  // Simulate live detection updates in demo mode
  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(() => {
      setFps(parseFloat((18 + Math.random() * 4).toFixed(1)));
      setVram(parseFloat((2.3 + Math.random() * 0.3).toFixed(2)));

      // Randomly activate a species
      const randomIdx = Math.floor(Math.random() * species.length);
      const newSpecies = species.map((s, i) => ({
        ...s,
        active: i === randomIdx,
        confidence: i === randomIdx ? Math.floor(60 + Math.random() * 35) : 0,
      }));
      setSpecies(newSpecies);
      setActiveSpecies(newSpecies[randomIdx]);
      setTotalDetections((d) => d + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [demoMode, species.length]);

  const taxonomy = activeSpecies
    ? {
        family: getFamilyFromName(activeSpecies.name),
        genus: activeSpecies.name.split(" ")[0],
        species: activeSpecies.name,
        order: "Eupercaria incertae sedis",
        class: "Teleostei",
      }
    : null;

  return (
    <div className="min-h-screen gradient-ocean pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold glow-text flex items-center gap-3">
              Live Monitor <span className="text-2xl">🔬</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-Powered Underwater Species Detection · Gulf of Oman
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Demo Mode Toggle */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm"
            >
              {demoMode ? (
                <ToggleRight className="w-5 h-5 text-primary" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`font-mono text-xs ${demoMode ? "text-primary" : "text-muted-foreground"}`}>
                DEMO MODE
              </span>
            </button>

            {/* Feed Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <span className={rawFeed ? "text-primary" : "text-muted-foreground"}>Raw Feed</span>
              <button
                onClick={() => setRawFeed(!rawFeed)}
                className={`w-10 h-5 rounded-full transition-colors ${rawFeed ? "bg-primary/30" : "bg-muted"} relative`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-primary absolute top-0.5 transition-transform ${
                    rawFeed ? "left-0.5" : "left-5"
                  }`}
                />
              </button>
              <span className={!rawFeed ? "text-primary" : "text-muted-foreground"}>Water-Net Restored</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="font-medium">Live Camera Feed</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-mono text-primary">LIVE</span>
                </div>
              </div>

              {/* Video placeholder */}
              <div className="relative bg-ocean-deep aspect-video flex items-center justify-center">
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-coral text-xs font-bold text-white uppercase">
                  {rawFeed ? "Raw Underwater Feed" : "Water-Net Enhanced"}
                </div>

                {/* Simulated underwater scene */}
                <div className="w-full h-full bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface/30 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-6xl animate-float">🐟</div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {demoMode ? "Demo mode active — simulating detections" : "Waiting for camera feed..."}
                    </p>
                  </div>
                </div>

                {/* Detection overlay */}
                {activeSpecies && demoMode && (
                  <div className="absolute bottom-3 right-3 glass-card rounded-lg px-3 py-2 text-xs">
                    <span className="text-primary font-mono">{activeSpecies.name}</span>
                    <span className="text-muted-foreground ml-2">{activeSpecies.confidence}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Telemetry */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 uppercase tracking-wider text-muted-foreground">
                <Zap className="w-4 h-4" /> Telemetry
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Inference FPS</span>
                  <span className="text-xl font-bold font-mono text-primary">{fps}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">VRAM Usage</span>
                  <span className="text-xl font-bold font-mono text-primary">
                    {vram} <span className="text-xs text-muted-foreground">GB</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Detections</span>
                  <span className="text-xl font-bold font-mono text-primary">{totalDetections}</span>
                </div>
              </div>
            </div>

            {/* Taxonomic Intelligence */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 uppercase tracking-wider text-muted-foreground">
                <Cpu className="w-4 h-4" /> Taxonomic Intelligence
              </h3>
              {taxonomy ? (
                <div className="space-y-3">
                  {[
                    { label: "FAMILY", value: taxonomy.family },
                    { label: "GENUS", value: taxonomy.genus },
                    { label: "SPECIES", value: taxonomy.species },
                    { label: "ORDER", value: taxonomy.order },
                    { label: "CLASS", value: taxonomy.class },
                  ].map((row) => (
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
          </div>
        </div>

        {/* Species HUD */}
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
      </div>
    </div>
  );
};

function getFamilyFromName(scientificName: string): string {
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
  const genus = scientificName.split(" ")[0];
  return families[genus] || "Unknown";
}

export default LiveMonitor;
