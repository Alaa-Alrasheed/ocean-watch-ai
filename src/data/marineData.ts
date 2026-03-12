// Simulated marine biodiversity data for Fujairah, UAE

export interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  count: number;
  percentage: number;
  trend: "increasing" | "stable" | "decreasing";
  category: "reef" | "pelagic" | "demersal";
}

export interface BiodiversityIndex {
  name: string;
  value: number;
  maxValue: number;
  description: string;
  status: "healthy" | "moderate" | "stressed";
}

export interface DetectionEvent {
  timestamp: string;
  speciesCount: number;
  totalIndividuals: number;
  dominantSpecies: string;
}

export const speciesData: FishSpecies[] = [
  { id: "1", name: "Arabian Angelfish", scientificName: "Pomacanthus asfur", count: 147, percentage: 18.2, trend: "stable", category: "reef" },
  { id: "2", name: "Yellowbar Angelfish", scientificName: "Pomacanthus maculosus", count: 98, percentage: 12.1, trend: "increasing", category: "reef" },
  { id: "3", name: "Blacktip Grouper", scientificName: "Epinephelus fasciatus", count: 73, percentage: 9.0, trend: "decreasing", category: "reef" },
  { id: "4", name: "Honeycomb Grouper", scientificName: "Epinephelus merra", count: 64, percentage: 7.9, trend: "stable", category: "reef" },
  { id: "5", name: "Indian Mackerel", scientificName: "Rastrelliger kanagurta", count: 112, percentage: 13.9, trend: "increasing", category: "pelagic" },
  { id: "6", name: "Kingfish", scientificName: "Scomberomorus commerson", count: 45, percentage: 5.6, trend: "stable", category: "pelagic" },
  { id: "7", name: "Barramundi", scientificName: "Lates calcarifer", count: 38, percentage: 4.7, trend: "decreasing", category: "demersal" },
  { id: "8", name: "Rabbitfish", scientificName: "Siganus canaliculatus", count: 89, percentage: 11.0, trend: "stable", category: "reef" },
  { id: "9", name: "Emperor Fish", scientificName: "Lethrinus nebulosus", count: 56, percentage: 6.9, trend: "stable", category: "demersal" },
  { id: "10", name: "Parrotfish", scientificName: "Scarus ghobban", count: 86, percentage: 10.7, trend: "increasing", category: "reef" },
];

export const biodiversityIndices: BiodiversityIndex[] = [
  { name: "Shannon-Wiener (H')", value: 2.18, maxValue: 3.0, description: "Species diversity combining richness and evenness", status: "healthy" },
  { name: "Simpson's (1-D)", value: 0.87, maxValue: 1.0, description: "Probability two random individuals are different species", status: "healthy" },
  { name: "Pielou's Evenness (J')", value: 0.78, maxValue: 1.0, description: "How equally species are distributed", status: "moderate" },
  { name: "Margalef's Richness", value: 1.35, maxValue: 3.0, description: "Species richness relative to sample size", status: "moderate" },
];

export const temporalData: DetectionEvent[] = [
  { timestamp: "06:00", speciesCount: 4, totalIndividuals: 23, dominantSpecies: "Rabbitfish" },
  { timestamp: "08:00", speciesCount: 6, totalIndividuals: 45, dominantSpecies: "Arabian Angelfish" },
  { timestamp: "10:00", speciesCount: 8, totalIndividuals: 78, dominantSpecies: "Indian Mackerel" },
  { timestamp: "12:00", speciesCount: 10, totalIndividuals: 112, dominantSpecies: "Indian Mackerel" },
  { timestamp: "14:00", speciesCount: 9, totalIndividuals: 95, dominantSpecies: "Arabian Angelfish" },
  { timestamp: "16:00", speciesCount: 7, totalIndividuals: 67, dominantSpecies: "Parrotfish" },
  { timestamp: "18:00", speciesCount: 5, totalIndividuals: 38, dominantSpecies: "Blacktip Grouper" },
];

export const ecosystemSummary = {
  totalSpecies: 10,
  totalIndividuals: 808,
  surveyDuration: "12 hours",
  location: "Fujairah Coast, UAE",
  depth: "5-25m",
  date: "2026-02-15",
  waterTemp: "24.5°C",
  visibility: "12m",
};

export const llmInterpretation = `## Ecosystem Health Assessment — Fujairah Coast

Based on the computed biodiversity indices and species detection data, the marine ecosystem at Fujairah shows **moderately healthy** conditions with some areas of concern.

### Key Findings

**Positive Indicators:**
- The Shannon-Wiener index (H' = 2.18) suggests **good species diversity**, indicating a relatively complex community structure with multiple trophic levels represented.
- Simpson's index (1-D = 0.87) confirms **low dominance** — no single species overwhelmingly dominates the assemblage, which is characteristic of a balanced ecosystem.
- Three species show increasing trends (Yellowbar Angelfish, Indian Mackerel, Parrotfish), suggesting favorable conditions for herbivorous and mid-trophic species.

**Areas of Concern:**
- Pielou's evenness (J' = 0.78) indicates **moderate unevenness** in species distribution. The Indian Mackerel and Arabian Angelfish together represent over 30% of all observations.
- Declining trends in Blacktip Grouper and Barramundi may signal **fishing pressure on predatory species**, a common early warning of trophic cascade risk.
- Margalef's richness (1.35) is moderate, suggesting the area could support higher species diversity if environmental pressures were reduced.

### Ecological Interpretation

The community structure is consistent with a **recovering reef system** that still experiences moderate anthropogenic pressure. The increasing abundance of herbivorous species (Parrotfish, Rabbitfish) is encouraging for coral reef health, as these species play a critical role in algae control. However, the declining predator populations warrant monitoring to prevent trophic imbalance.

### Recommendations

1. **Continue monitoring** predator species (Groupers, Barramundi) for population trends
2. **Investigate** potential causes of predator decline (overfishing, habitat loss)
3. **Establish baseline** surveys at additional sites for spatial comparison
4. **Consider seasonal** surveys to capture migration and spawning patterns`;

// Live Monitor data
export interface MonitorSpecies {
  id: string;
  name: string;
  commonName: string;
  icon: string;
  confidence: number;
  active: boolean;
}

export const monitorSpecies: MonitorSpecies[] = [
  { id: "1", name: "Siganus canaliculatus", commonName: "Rabbitfish", icon: "🐟", confidence: 0, active: false },
  { id: "2", name: "Rastrelliger kanagurta", commonName: "Indian Mackerel", icon: "🐠", confidence: 0, active: false },
  { id: "3", name: "Scarus ghobban", commonName: "Parrotfish", icon: "🦜", confidence: 0, active: false },
  { id: "4", name: "Lethrinus nebulosus", commonName: "Spangled Emperor", icon: "👑", confidence: 0, active: false },
  { id: "5", name: "Lutjanus argentimaculatus", commonName: "Mangrove Jack", icon: "🔴", confidence: 72, active: true },
  { id: "6", name: "Epinephelus coioides", commonName: "Orangespotted Grouper", icon: "🟠", confidence: 0, active: false },
  { id: "7", name: "Cephalopholis hemistiktos", commonName: "Yellowfin Hind", icon: "🟡", confidence: 0, active: false },
  { id: "8", name: "Pomacanthus asfur", commonName: "Arabian Angelfish", icon: "💜", confidence: 0, active: false },
  { id: "9", name: "Scomberomorus commerson", commonName: "Narrow-barred Mackerel", icon: "🌿", confidence: 0, active: false },
  { id: "10", name: "Caranx sexfasciatus", commonName: "Bigeye Trevally", icon: "🔵", confidence: 0, active: false },
  { id: "11", name: "Platax teira", commonName: "Longfin Batfish", icon: "🦇", confidence: 0, active: false },
  { id: "12", name: "Acanthurus sohal", commonName: "Sohal Surgeonfish", icon: "🔷", confidence: 0, active: false },
  { id: "13", name: "Stegostoma tigrinum", commonName: "Zebra Shark", icon: "🦈", confidence: 0, active: false },
];
