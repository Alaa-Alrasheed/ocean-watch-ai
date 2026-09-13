import { useMemo, useState } from "react";
import { SurveyHeader } from "@/components/dashboard/SurveyHeader";
import { HealthIndicator } from "@/components/dashboard/HealthIndicator";
import { BiodiversityScore } from "@/components/dashboard/BiodiversityScore";
import { SpeciesChart } from "@/components/dashboard/SpeciesChart";
import { DatasetSummary } from "@/components/dashboard/DatasetSummary";
import { AbundanceProfile } from "@/components/dashboard/AbundanceProfile";
import BiodiversityInsight from "@/components/dashboard/BiodiversityInsight";
import { DownloadReport } from "@/components/dashboard/DownloadReport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dummySpeciesCountsFixture from "@/data/dummySpeciesCounts.json";
import healthySpeciesCountsFixture from "@/data/dummySpeciesCounts.healthy.json";
import largeSpeciesCountsFixture from "@/data/dummySpeciesCounts.large.json";
import largeDominanceSpeciesCountsFixture from "@/data/dummySpeciesCounts.largeDominance.json";
import moderateSpeciesCountsFixture from "@/data/dummySpeciesCounts.moderate.json";
import singleSpeciesCountsFixture from "@/data/dummySpeciesCounts.singleSpecies.json";
import smallSpeciesCountsFixture from "@/data/dummySpeciesCounts.small.json";
import stressedSpeciesCountsFixture from "@/data/dummySpeciesCounts.stressed.json";
import {
  RICHNESS_SCORE_CAP,
  SHANNON_SCORE_CAP,
  runRuleEngine,
} from "@/lib/ruleEngine";
import type {
  Bands,
  ComputedIndices,
  CompositeStatus,
  SpeciesCounts,
} from "@/lib/ruleEngine";
import type {
  BiodiversityIndex as DashboardBiodiversityIndex,
  FishSpecies,
} from "@/data/marineData";

interface SpeciesCountsFixture {
  surveyName: string;
  totalFishCount: number;
  expectedCompositeStatus?: string;
  species: Array<{
    speciesName: string;
    speciesCount: number;
  }>;
}

interface TestFixtureOption {
  label: string;
  fileName: string;
  note: string;
  data: SpeciesCountsFixture;
}

const testFixtures: TestFixtureOption[] = [
  {
    label: "Active file",
    fileName: "dummySpeciesCounts.json",
    note: "Current dummySpeciesCounts.json",
    data: dummySpeciesCountsFixture,
  },
  {
    label: "Healthy",
    fileName: "dummySpeciesCounts.healthy.json",
    note: "Balanced 30-species sample",
    data: healthySpeciesCountsFixture,
  },
  {
    label: "Moderate",
    fileName: "dummySpeciesCounts.moderate.json",
    note: "Moderately healthy uneven sample",
    data: moderateSpeciesCountsFixture,
  },
  {
    label: "Stressed",
    fileName: "dummySpeciesCounts.stressed.json",
    note: "Stressed low-richness sample",
    data: stressedSpeciesCountsFixture,
  },
  {
    label: "Small dataset",
    fileName: "dummySpeciesCounts.small.json",
    note: "Insufficient sample-size warning",
    data: smallSpeciesCountsFixture,
  },
  {
    label: "Large dataset",
    fileName: "dummySpeciesCounts.large.json",
    note: "Large balanced 60-species sample",
    data: largeSpeciesCountsFixture,
  },
  {
    label: "Large dominance",
    fileName: "dummySpeciesCounts.largeDominance.json",
    note: "Large sample with bad distribution",
    data: largeDominanceSpeciesCountsFixture,
  },
  {
    label: "Single species",
    fileName: "dummySpeciesCounts.singleSpecies.json",
    note: "Single-taxon edge case",
    data: singleSpeciesCountsFixture,
  },
];

function toSpeciesCounts(fixture: SpeciesCountsFixture): SpeciesCounts {
  return fixture.species.reduce<SpeciesCounts>((counts, species) => {
    const count = Number(species.speciesCount);

    if (species.speciesName && Number.isFinite(count) && count > 0) {
      counts[species.speciesName] = count;
    }

    return counts;
  }, {});
}

function toDashboardSpeciesData(
  fixture: SpeciesCountsFixture,
  totalCount: number
): FishSpecies[] {
  return fixture.species
    .filter((species) => {
      const count = Number(species.speciesCount);
      return species.speciesName && Number.isFinite(count) && count > 0;
    })
    .sort((a, b) => b.speciesCount - a.speciesCount)
    .map((species, index) => {
      const percentage = totalCount
        ? Math.round((species.speciesCount / totalCount) * 1000) / 10
        : 0;

      return {
        id: String(index + 1),
        name: species.speciesName,
        scientificName: species.speciesName,
        count: species.speciesCount,
        percentage,
        trend: "stable",
        category: "reef",
      };
    });
}

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
      maxValue: RICHNESS_SCORE_CAP,
      scaleLabel: `score cap S >= ${RICHNESS_SCORE_CAP}`,
      description: "Distinct taxa detected; composite contribution is capped after the threshold",
      status: bandStatus(bands.richness),
    },
    {
      name: "Shannon Index (H')",
      value: indices.H,
      maxValue: SHANNON_SCORE_CAP,
      scaleLabel: `score cap H' >= ${SHANNON_SCORE_CAP}`,
      description: "Richness-evenness diversity; raw H' can exceed the scoring cap",
      status: bandStatus(bands.shannon),
    },
    {
      name: "Simpson Index (1-D)",
      value: indices.D,
      maxValue: 1,
      scaleLabel: "0-1 range",
      description: "Gini-Simpson diversity: probability two individuals differ",
      status: bandStatus(bands.simpson),
    },
    {
      name: "Pielou Evenness (J')",
      value: indices.J,
      maxValue: 1,
      scaleLabel: "0-1 range",
      description: "Evenness normalized to the observed richness",
      status: bandStatus(bands.evenness),
    },
  ];
}

const Dashboard = () => {
  const [fixtureIndex, setFixtureIndex] = useState(0);
  const selectedFixture = testFixtures[fixtureIndex];
  const activeDataset = selectedFixture.data;

  const dashboardSpeciesCounts = useMemo(
    () => toSpeciesCounts(activeDataset),
    [activeDataset]
  );
  const computedFixtureTotal = useMemo(
    () =>
      Object.values(dashboardSpeciesCounts).reduce(
        (sum, count) => sum + count,
        0
      ),
    [dashboardSpeciesCounts]
  );
  const hasFixtureTotalMismatch =
    computedFixtureTotal !== activeDataset.totalFishCount;
  const ruleEngineOutput = useMemo(
    () => runRuleEngine(dashboardSpeciesCounts),
    [dashboardSpeciesCounts]
  );
  const dashboardSpeciesData = useMemo(
    () => toDashboardSpeciesData(activeDataset, computedFixtureTotal),
    [activeDataset, computedFixtureTotal]
  );
  const dashboardIndices = ruleEngineOutput
    ? buildDashboardIndices(ruleEngineOutput.indices, ruleEngineOutput.bands)
    : [];
  const dashboardCompositeScore = ruleEngineOutput?.indices.compositeScore ?? 0;
  const dashboardCompositeStatus: CompositeStatus =
    ruleEngineOutput?.compositeStatus ?? "CRITICAL";

  return (
    <div className="min-h-screen gradient-ocean pt-20">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <SurveyHeader
          totalSpecies={ruleEngineOutput?.indices.S}
          totalIndividuals={ruleEngineOutput?.indices.totalCount}
          ecosystemStatus={dashboardCompositeStatus}
        />

        <section className="glass-card rounded-xl p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-sand">
                Temporary test JSON selector
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                {selectedFixture.label}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedFixture.note}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono text-foreground/80">
                  {selectedFixture.fileName}
                </span>
                <span>{activeDataset.surveyName}</span>
              </div>
            </div>

            <div className="w-full md:w-80">
              <label
                htmlFor="fixture-select"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Display dataset
              </label>
              <Select
                value={String(fixtureIndex)}
                onValueChange={(value) => setFixtureIndex(Number(value))}
              >
                <SelectTrigger
                  id="fixture-select"
                  className="border-border/60 bg-background/70"
                >
                  <SelectValue placeholder="Choose test JSON" />
                </SelectTrigger>
                <SelectContent>
                  {testFixtures.map((fixture, index) => (
                    <SelectItem key={fixture.fileName} value={String(index)}>
                      {fixture.label} - {fixture.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

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

        {ruleEngineOutput && (
          <DatasetSummary
            species={dashboardSpeciesData}
            indices={ruleEngineOutput.indices}
            sampleSize={ruleEngineOutput.bands.sampleSize}
            patternCount={ruleEngineOutput.patterns.length}
          />
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <SpeciesChart species={dashboardSpeciesData} />
          <AbundanceProfile species={dashboardSpeciesData} />
        </section>

        <section>
          <BiodiversityInsight speciesCounts={dashboardSpeciesCounts} />
          {hasFixtureTotalMismatch && (
            <p className="mt-2 text-xs text-destructive">
              Dummy fixture total mismatch: declared {activeDataset.totalFishCount},
              computed {computedFixtureTotal}.
            </p>
          )}
        </section>

        <section>
          <DownloadReport />
        </section>

        <footer className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground">
          Marine Biodiversity Count Analysis Framework - Count-derived indices
          & deterministic rule interpretation
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
