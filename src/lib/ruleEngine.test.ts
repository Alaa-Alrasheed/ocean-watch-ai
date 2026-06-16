import { describe, expect, it } from "vitest";
import dummySpeciesCountsFixture from "@/data/dummySpeciesCounts.json";
import { computeIndices, runRuleEngine } from "@/lib/ruleEngine";
import type { SpeciesCounts } from "@/lib/ruleEngine";

const speciesCounts = dummySpeciesCountsFixture.species.reduce<SpeciesCounts>(
  (counts, species) => {
    counts[species.speciesName] = species.speciesCount;
    return counts;
  },
  {}
);

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

    expect(indices).not.toBeNull();
    expect(indices?.S).toBe(5);
    expect(indices?.totalCount).toBe(200);
    expect(indices?.dominantSpecies).toBe("Pomacanthus asfur");
    expect(indices?.dominantCount).toBe(150);
    expect(indices?.H).toBe(0.9);
    expect(indices?.D).toBe(0.42);
    expect(indices?.J).toBe(0.56);
    expect(indices?.compositeScore).toBe(33.1);
  });

  it("produces a critical deterministic report with multiple pattern families", () => {
    const result = runRuleEngine(speciesCounts);

    expect(result).not.toBeNull();
    expect(result?.compositeStatus).toBe("CRITICAL");
    expect(result?.patterns.map((pattern) => pattern.id)).toEqual([
      "composite_concern",
      "reduced_variety",
      "dominance_concern",
    ]);
    expect(result?.hasWarnings).toBe(true);
    expect(result?.paragraphs[0]?.type).toBe("opening");
    expect(result?.paragraphs.map((paragraph) => paragraph.type)).toEqual([
      "opening",
      "finding",
      "finding",
      "finding",
      "synthesis",
    ]);
    expect(result?.paragraphs[1]?.text).toContain("Rule confidence: 80%");
  });

  it("adds a data-quality caveat when detections are below the reliable sample threshold", () => {
    const result = runRuleEngine({
      "Pomacanthus asfur": 8,
      "Scarus ghobban": 3,
    });

    expect(result).not.toBeNull();
    expect(result?.bands.sampleSize).toBe("INSUFFICIENT");
    expect(result?.paragraphs.some((paragraph) => paragraph.type === "quality_caveat")).toBe(true);
    expect(result?.paragraphs.at(-1)?.text).toContain("Sample size warning");
  });
});
