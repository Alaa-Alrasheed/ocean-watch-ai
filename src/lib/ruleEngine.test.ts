import { describe, expect, it } from "vitest";
import dummySpeciesCountsFixture from "@/data/dummySpeciesCounts.json";
import healthySpeciesCountsFixture from "@/data/dummySpeciesCounts.healthy.json";
import largeSpeciesCountsFixture from "@/data/dummySpeciesCounts.large.json";
import largeDominanceSpeciesCountsFixture from "@/data/dummySpeciesCounts.largeDominance.json";
import moderateSpeciesCountsFixture from "@/data/dummySpeciesCounts.moderate.json";
import singleSpeciesCountsFixture from "@/data/dummySpeciesCounts.singleSpecies.json";
import smallSpeciesCountsFixture from "@/data/dummySpeciesCounts.small.json";
import stressedSpeciesCountsFixture from "@/data/dummySpeciesCounts.stressed.json";
import { computeIndices, runRuleEngine } from "@/lib/ruleEngine";
import type { CompositeStatus, SampleBand, SpeciesCounts } from "@/lib/ruleEngine";

interface SpeciesCountsFixture {
  totalFishCount: number;
  expectedCompositeStatus?: string;
  species: Array<{
    speciesName: string;
    speciesCount: number;
  }>;
}

function toSpeciesCounts(fixture: SpeciesCountsFixture): SpeciesCounts {
  return fixture.species.reduce<SpeciesCounts>((counts, species) => {
    counts[species.speciesName] = species.speciesCount;
    return counts;
  }, {});
}

const speciesCounts = toSpeciesCounts(dummySpeciesCountsFixture);

describe("ruleEngine", () => {
  it("matches the dummy fixture totals", () => {
    const totalFromSpecies = Object.values(speciesCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    expect(totalFromSpecies).toBe(dummySpeciesCountsFixture.totalFishCount);
  });

  it("computes biodiversity indices for the dummy fixture", () => {
    const indices = computeIndices(speciesCounts);
    const sortedSpecies = dummySpeciesCountsFixture.species
      .filter((species) => species.speciesCount > 0)
      .sort((a, b) => b.speciesCount - a.speciesCount);

    expect(indices).not.toBeNull();
    expect(indices?.S).toBe(sortedSpecies.length);
    expect(indices?.totalCount).toBe(dummySpeciesCountsFixture.totalFishCount);
    expect(indices?.dominantSpecies).toBe(sortedSpecies[0]?.speciesName);
    expect(indices?.dominantCount).toBe(sortedSpecies[0]?.speciesCount);
    expect(indices?.H).toBeGreaterThanOrEqual(0);
    expect(indices?.D).toBeGreaterThanOrEqual(0);
    expect(indices?.J).toBeGreaterThanOrEqual(0);
    expect(indices?.compositeScore).toBeGreaterThanOrEqual(0);
    expect(indices?.compositeScore).toBeLessThanOrEqual(100);
  });

  it("produces a deterministic report for the active dummy fixture", () => {
    const result = runRuleEngine(speciesCounts);

    expect(result).not.toBeNull();
    if (dummySpeciesCountsFixture.expectedCompositeStatus) {
      expect(result?.compositeStatus).toBe(
        dummySpeciesCountsFixture.expectedCompositeStatus
      );
    }
    expect(result?.paragraphs[0]?.type).toBe("opening");
    expect(result?.indices.totalCount).toBe(dummySpeciesCountsFixture.totalFishCount);
    expect(result?.paragraphs.length).toBeGreaterThan(0);
  });

  it("adds a data-quality caveat when detections are below the reliable sample threshold", () => {
    const result = runRuleEngine({
      "Pomacanthus asfur": 8,
      "Scarus ghobban": 3,
    });

    expect(result).not.toBeNull();
    expect(result?.bands.sampleSize).toBe("INSUFFICIENT");
    expect(result?.paragraphs.some((paragraph) => paragraph.type === "quality_caveat")).toBe(true);
    expect(
      result?.paragraphs.some((paragraph) =>
        paragraph.text.includes("Sample size warning")
      )
    ).toBe(true);
  });

  it("adds a taxonomic-breadth warning when three or fewer species are detected", () => {
    const result = runRuleEngine({
      "Pomacanthus asfur": 80,
      "Scarus ghobban": 45,
      "Rastrelliger kanagurta": 30,
    });

    expect(result).not.toBeNull();
    expect(result?.bands.sampleSize).toBe("ADEQUATE");
    expect(result?.indices.S).toBe(3);
    expect(result?.hasWarnings).toBe(true);
    expect(
      result?.paragraphs.some((paragraph) =>
        paragraph.text.includes("Taxonomic breadth warning")
      )
    ).toBe(true);
  });

  it.each([
    ["healthy", healthySpeciesCountsFixture, "HEALTHY", "ADEQUATE", 87.8],
    ["moderate", moderateSpeciesCountsFixture, "MODERATELY_HEALTHY", "ADEQUATE", 67.3],
    ["stressed", stressedSpeciesCountsFixture, "STRESSED", "ADEQUATE", 53.3],
    ["small", smallSpeciesCountsFixture, "CRITICAL", "INSUFFICIENT", 39.5],
    ["large", largeSpeciesCountsFixture, "HEALTHY", "ADEQUATE", 99.5],
    [
      "large dominance",
      largeDominanceSpeciesCountsFixture,
      "STRESSED",
      "ADEQUATE",
      54.9,
    ],
    ["single species", singleSpeciesCountsFixture, "CRITICAL", "ADEQUATE", 0.3],
  ] as const)(
    "keeps the %s fixture in its expected composite band",
    (
      _label,
      fixture,
      expectedStatus: CompositeStatus,
      expectedSampleBand: SampleBand,
      expectedScore
    ) => {
      const counts = toSpeciesCounts(fixture);
      const totalFromSpecies = Object.values(counts).reduce(
        (sum, count) => sum + count,
        0
      );
      const result = runRuleEngine(counts);

      expect(totalFromSpecies).toBe(fixture.totalFishCount);
      expect(result).not.toBeNull();
      expect(result?.compositeStatus).toBe(expectedStatus);
      expect(result?.bands.sampleSize).toBe(expectedSampleBand);
      expect(result?.indices.compositeScore).toBe(expectedScore);
    }
  );

  it("retains valid raw high-richness and Shannon values while capping the composite score", () => {
    const counts = toSpeciesCounts(largeSpeciesCountsFixture);
    const result = runRuleEngine(counts);

    expect(result).not.toBeNull();
    expect(result?.indices.S).toBeGreaterThan(50);
    expect(result?.indices.H).toBeGreaterThan(4);
    expect(result?.indices.compositeScore).toBeLessThanOrEqual(100);
    expect(result?.compositeStatus).toBe("HEALTHY");
  });
});
