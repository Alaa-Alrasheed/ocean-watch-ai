import { SurveyHeader } from "@/components/dashboard/SurveyHeader";
import { HealthIndicator } from "@/components/dashboard/HealthIndicator";
import { BiodiversityScore } from "@/components/dashboard/BiodiversityScore";
import { SpeciesTable } from "@/components/dashboard/SpeciesTable";
import { SpeciesChart } from "@/components/dashboard/SpeciesChart";
import { TemporalChart } from "@/components/dashboard/TemporalChart";
import BiodiversityInsight from "@/components/dashboard/BiodiversityInsight";
import { DownloadReport } from "@/components/dashboard/DownloadReport";
import { speciesData as baseSpeciesData } from "@/data/marineData";
import dummySpeciesCountsFixture from "@/data/dummySpeciesCounts.json";
import { runRuleEngine } from "@/lib/ruleEngine";
import type {
  Bands,
  ComputedIndices,
  CompositeStatus,
  SpeciesCounts,
} from "@/lib/ruleEngine";
import type {
  BiodiversityIndex as DashboardBiodiversityIndex,
  DetectionEvent,
  FishSpecies,
} from "@/data/marineData";

const dashboardSpeciesCounts = dummySpeciesCountsFixture.species.reduce<SpeciesCounts>(
  (counts, species) => {
    counts[species.speciesName] = species.speciesCount;
    return counts;
  },
  {}
);

const computedFixtureTotal = Object.values(dashboardSpeciesCounts).reduce(
  (sum, count) => sum + count,
  0
);

const hasFixtureTotalMismatch =
  computedFixtureTotal !== dummySpeciesCountsFixture.totalFishCount;

const ruleEngineOutput = runRuleEngine(dashboardSpeciesCounts);
const baseSpeciesByScientificName = new Map(
  baseSpeciesData.map((species) => [species.scientificName, species])
);

const dashboardSpeciesData: FishSpecies[] = dummySpeciesCountsFixture.species.map(
  (species, index) => {
    const baseSpecies = baseSpeciesByScientificName.get(species.speciesName);
    const percentage = computedFixtureTotal
      ? Math.round((species.speciesCount / computedFixtureTotal) * 1000) / 10
      : 0;

    return {
      id: baseSpecies?.id ?? String(index + 1),
      name: baseSpecies?.name ?? species.speciesName,
      scientificName: species.speciesName,
      count: species.speciesCount,
      percentage,
      trend: baseSpecies?.trend ?? "stable",
      category: baseSpecies?.category ?? "reef",
    };
  }
);

const dashboardTemporalData: DetectionEvent[] = [
  { timestamp: "06:00", speciesCount: 2, totalIndividuals: 12, dominantSpecies: "Arabian Angelfish" },
  { timestamp: "08:00", speciesCount: 3, totalIndividuals: 26, dominantSpecies: "Arabian Angelfish" },
  { timestamp: "10:00", speciesCount: 4, totalIndividuals: 38, dominantSpecies: "Arabian Angelfish" },
  { timestamp: "12:00", speciesCount: 5, totalIndividuals: 54, dominantSpecies: "Arabian Angelfish" },
  { timestamp: "14:00", speciesCount: 5, totalIndividuals: 42, dominantSpecies: "Arabian Angelfish" },
  { timestamp: "16:00", speciesCount: 4, totalIndividuals: 20, dominantSpecies: "Arabian Angelfish" },
  { timestamp: "18:00", speciesCount: 3, totalIndividuals: 8, dominantSpecies: "Indian Mackerel" },
];

function bandStatus(
  band: Bands["richness"] | Bands["shannon"] | Bands["simpson"] | Bands["evenness"]
): DashboardBiodiversityIndex["status"] {
  if (band === "HIGH" || band === "VERY_HIGH") {
    return "healthy";
  }

  if (band === "MODERATE") {
    return "moderate";
  }

  return "stressed";
}

function buildDashboardIndices(
  indices: ComputedIndices,
  bands: Bands
): DashboardBiodiversityIndex[] {
  return [
    {
      name: "Species Richness",
      value: indices.S,
      maxValue: 50,
      description: "Total number of distinct species detected in the survey area",
      status: bandStatus(bands.richness),
    },
    {
      name: "Shannon Index (H')",
      value: indices.H,
      maxValue: 4,
      description: "Species diversity combining richness and evenness",
      status: bandStatus(bands.shannon),
    },
    {
      name: "Simpson Index (1-D)",
      value: indices.D,
      maxValue: 1,
      description: "Probability two random individuals are different species",
      status: bandStatus(bands.simpson),
    },
    {
      name: "Pielou Evenness (J')",
      value: indices.J,
      maxValue: 1,
      description: "How equally species are distributed",
      status: bandStatus(bands.evenness),
    },
  ];
}

const dashboardIndices = ruleEngineOutput
  ? buildDashboardIndices(ruleEngineOutput.indices, ruleEngineOutput.bands)
  : [];

const dashboardCompositeScore = ruleEngineOutput?.indices.compositeScore ?? 0;
const dashboardCompositeStatus: CompositeStatus =
  ruleEngineOutput?.compositeStatus ?? "CRITICAL";

const Dashboard = () => {
  return (
    <div className="min-h-screen gradient-ocean pt-20">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <SurveyHeader
          totalSpecies={ruleEngineOutput?.indices.S}
          totalIndividuals={ruleEngineOutput?.indices.totalCount}
          ecosystemStatus={dashboardCompositeStatus}
        />

        <section>
          <h2 className="mb-4 text-lg font-semibold">Biodiversity Indices</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {dashboardIndices.map((idx) => (
              <HealthIndicator key={idx.name} index={idx} />
            ))}
            <BiodiversityScore
              score={dashboardCompositeScore}
              status={dashboardCompositeStatus}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SpeciesChart species={dashboardSpeciesData} />
          <TemporalChart data={dashboardTemporalData} />
        </section>

        <section>
          <SpeciesTable species={dashboardSpeciesData} />
        </section>

        <section>
          <BiodiversityInsight speciesCounts={dashboardSpeciesCounts} />
          {hasFixtureTotalMismatch && (
            <p className="mt-2 text-xs text-destructive">
              Dummy fixture total mismatch: declared {dummySpeciesCountsFixture.totalFishCount},
              computed {computedFixtureTotal}.
            </p>
          )}
        </section>

        <section>
          <DownloadReport />
        </section>

        <footer className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground">
          Marine Biodiversity Analysis Framework - Fujairah, UAE - Powered by Deep Learning
          & Deterministic Rule Interpretation
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
