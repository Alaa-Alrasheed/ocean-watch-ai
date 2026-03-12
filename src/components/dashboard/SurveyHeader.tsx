import { MapPin, Thermometer, Eye, Clock, Calendar, Waves } from "lucide-react";
import { ecosystemSummary } from "@/data/marineData";

const stats = [
  { icon: MapPin, label: "Location", value: ecosystemSummary.location },
  { icon: Calendar, label: "Survey Date", value: ecosystemSummary.date },
  { icon: Clock, label: "Duration", value: ecosystemSummary.surveyDuration },
  { icon: Waves, label: "Depth Range", value: ecosystemSummary.depth },
  { icon: Thermometer, label: "Water Temp", value: ecosystemSummary.waterTemp },
  { icon: Eye, label: "Visibility", value: ecosystemSummary.visibility },
];

export function SurveyHeader() {
  return (
    <header className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary font-mono text-sm mb-2 animate-pulse-slow">
          <Waves className="w-4 h-4" />
          <span>MARINE BIODIVERSITY MONITOR</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight glow-text">
          Fujairah Ecosystem Analysis
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          AI-powered fish species detection, classification, and biodiversity assessment from underwater video surveillance
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-lg px-3.5 py-2 flex items-center gap-2 text-sm">
            <s.icon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">{s.label}:</span>
            <span className="font-medium text-foreground">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Species Detected", value: ecosystemSummary.totalSpecies, color: "text-primary" },
          { label: "Total Individuals", value: ecosystemSummary.totalIndividuals, color: "text-foreground" },
          { label: "Ecosystem Status", value: "Moderate", color: "text-sand" },
          { label: "AI Confidence", value: "94.2%", color: "text-bioluminescent-glow" },
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
