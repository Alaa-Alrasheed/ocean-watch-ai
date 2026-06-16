/**
 * ruleEngine.ts
 *
 * Deterministic biodiversity insight generator.
 * Implements the index thresholds and interpretation tables from the BioReef.ai
 * project report (Tables 2, 3, 4, 5, 6 — Section 5) and produces a fully
 * reproducible text report from raw species count data.
 *
 * Drop this file into: src/lib/ruleEngine.ts
 *
 * No external dependencies. Pure TypeScript.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpeciesCounts {
  [species: string]: number;
}

/** Qualitative bands for each index, derived from report Tables 2, 3, 4. */
export type RichnessBand  = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
export type ShannonBand   = "VERY_LOW" | "LOW" | "MODERATE" | "HIGH";
export type SimpsonBand   = "LOW" | "MODERATE" | "HIGH";
export type EvennessBand  = "LOW" | "MODERATE" | "HIGH";
export type SampleBand    = "INSUFFICIENT" | "MARGINAL" | "ADEQUATE";
export type CompositeStatus = "CRITICAL" | "STRESSED" | "MODERATELY_HEALTHY" | "HEALTHY";
export type Severity       = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ParagraphType  =
  | "opening"
  | "finding"
  | "synthesis"
  | "recommendation"
  | "quality_caveat";

export interface ComputedIndices {
  S: number;                   // Species richness (integer)
  H: number;                   // Shannon diversity (2 dp)
  D: number;                   // Simpson diversity (2 dp)
  J: number;                   // Pielou evenness (2 dp)
  totalCount: number;          // Total individual detections
  dominantSpecies: string;     // Name of most abundant species
  dominantCount: number;       // Count of dominant species
  dominantProportion: number;  // Proportion of dominant species (0–1)
  compositeScore: number;      // Weighted composite score (1 dp, 0–100)
}

export interface Bands {
  richness:   RichnessBand;
  shannon:    ShannonBand;
  simpson:    SimpsonBand;
  evenness:   EvennessBand;
  sampleSize: SampleBand;
  composite:  CompositeStatus;
}

export interface PatternFamily {
  id:               string;
  label:            string;
  severity:         Severity;
  confidence:       number;   // 0–100
  findingParagraph: string;
  limitation:       string;
  nextStep:         string;
}

export interface ReportParagraph {
  type: ParagraphType;
  text: string;
  severity?: Severity;        // Present on "finding" paragraphs for colour coding
}

export interface RuleEngineOutput {
  indices:         ComputedIndices;
  bands:           Bands;
  patterns:        PatternFamily[];
  paragraphs:      ReportParagraph[];
  compositeStatus: CompositeStatus;
  hasWarnings:     boolean;
  dominantSpecies: string;    // Exposed so the component can italicise it
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Richness normalisation cap used in composite score calculation.
 * Matches the ">50 = Very High" upper boundary in report Table 2.
 * Values above S_MAX are capped at 100 in the normalised score.
 */
const S_MAX = 50;

/**
 * Shannon normalisation divisor. The report specifies: Shannon score = (H'/4) × 100.
 * In practice H' rarely exceeds 4 for finite species counts in survey data.
 */
const H_NORM = 4;

/** Detection count thresholds for sample size adequacy. */
export const SAMPLE_ADEQUATE  = 30;
export const SAMPLE_MARGINAL  = 15;

// ─── Utility ──────────────────────────────────────────────────────────────────

function r(value: number, dp: number): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

function pct(proportion: number): string {
  return (proportion * 100).toFixed(1);
}

// ─── Step 1 — Index Computation ───────────────────────────────────────────────

/**
 * Computes all four biodiversity indices and the composite biodiversity score
 * from raw species counts, using the exact formulas defined in report Section 5.
 *
 * Returns null if counts are empty or sum to zero.
 */
export function computeIndices(counts: SpeciesCounts): ComputedIndices | null {
  const species = Object.keys(counts).filter((s) => counts[s] > 0);
  const S = species.length;

  if (S === 0) return null;

  const totalCount = species.reduce((sum, s) => sum + counts[s], 0);
  if (totalCount === 0) return null;

  const proportions = species.map((s) => counts[s] / totalCount);

  // Shannon Diversity: H' = −Σ pi × ln(pi)
  const H = -proportions.reduce(
    (sum, p) => (p > 0 ? sum + p * Math.log(p) : sum),
    0
  );

  // Simpson Diversity: D = 1 − Σ pi²
  const D = 1 - proportions.reduce((sum, p) => sum + p * p, 0);

  // Pielou Evenness: J = H' / ln(S)
  // When S = 1, ln(S) = 0; J is defined as 0 by convention (no evenness with one species).
  const J = S > 1 ? H / Math.log(S) : 0;

  // Dominant species by count
  const sorted = species
    .map((s) => ({ name: s, count: counts[s] }))
    .sort((a, b) => b.count - a.count);
  const dominantSpecies   = sorted[0].name;
  const dominantCount     = sorted[0].count;
  const dominantProportion = dominantCount / totalCount;

  // Normalised scores for composite calculation (report Section 5.2)
  const shannonNorm  = Math.min((H / H_NORM) * 100, 100);
  const simpsonNorm  = D * 100;
  const evennessNorm = J * 100;
  const richnessNorm = Math.min((S / S_MAX) * 100, 100);

  // Composite score with report Table 5 weights
  const compositeScore =
    0.35 * shannonNorm +
    0.30 * simpsonNorm +
    0.20 * evennessNorm +
    0.15 * richnessNorm;

  return {
    S,
    H:                  r(H, 2),
    D:                  r(D, 2),
    J:                  r(J, 2),
    totalCount,
    dominantSpecies,
    dominantCount,
    dominantProportion,
    compositeScore:     r(compositeScore, 1),
  };
}

// ─── Step 2 — Band Mapping ────────────────────────────────────────────────────

/**
 * Maps computed index values to qualitative bands using thresholds from the report.
 *
 * Sources:
 *   Richness  → Table 2  (report Section 5.1)
 *   Shannon   → Table 3  (report Section 5.1)
 *   Pielou    → Table 4  (report Section 5.1)
 *   Composite → Table 6  (report Section 5.2)
 *   Simpson   → Derived from the 0–1 range description in Section 5.1.
 *               The report defines 0 = maximum dominance, 1 = even distribution.
 *               Bands: LOW < 0.3 ≤ MODERATE < 0.6 ≤ HIGH.
 */
export function mapBands(indices: ComputedIndices): Bands {
  const { S, H, D, J, totalCount, compositeScore } = indices;

  // Table 2: Species Richness
  const richness: RichnessBand =
    S >= 50 ? "VERY_HIGH" :
    S >= 25 ? "HIGH"       :
    S >= 10 ? "MODERATE"   :
              "LOW";

  // Table 3: Shannon Diversity
  const shannon: ShannonBand =
    H >= 3 ? "HIGH"     :
    H >= 2 ? "MODERATE" :
    H >= 1 ? "LOW"      :
             "VERY_LOW";

  // Simpson (derived; see JSDoc above)
  const simpson: SimpsonBand =
    D >= 0.6 ? "HIGH"     :
    D >= 0.3 ? "MODERATE" :
               "LOW";

  // Table 4: Pielou Evenness
  const evenness: EvennessBand =
    J >= 0.7 ? "HIGH"     :
    J >= 0.4 ? "MODERATE" :
               "LOW";

  // Sample size adequacy
  const sampleSize: SampleBand =
    totalCount >= SAMPLE_ADEQUATE ? "ADEQUATE"    :
    totalCount >= SAMPLE_MARGINAL ? "MARGINAL"    :
                                    "INSUFFICIENT";

  // Table 6: Composite Biodiversity Score
  const composite: CompositeStatus =
    compositeScore >= 80 ? "HEALTHY"            :
    compositeScore >= 60 ? "MODERATELY_HEALTHY" :
    compositeScore >= 40 ? "STRESSED"           :
                           "CRITICAL";

  return { richness, shannon, simpson, evenness, sampleSize, composite };
}

// ─── Step 3 — Pattern Detection ───────────────────────────────────────────────

/**
 * Evaluates all six pattern families defined in the rule engine and returns
 * those that fire for the given index values and bands.
 *
 * Pattern families (from report Section 8.2):
 *   A. Broad Biodiversity Concern     — 3+ index dimensions are concerning
 *   B. Reduced Species Variety        — richness LOW
 *   C. Uneven Distribution            — evenness LOW, Shannon not low (evenness-specific signal)
 *   D. Reduced Community Balance      — Shannon LOW/VERY_LOW AND evenness LOW (both confirm)
 *   E. Dominance-Supported Concern    — Simpson LOW or dominant species > 65%
 *   F. Composite Biodiversity Concern — composite score CRITICAL or STRESSED
 *
 * Suppression logic:
 *   When A fires (broad concern), B/C/D are suppressed to avoid redundancy.
 *   E and F are always evaluated independently.
 *   When A fires and E fires on the same dominance signal, E is suppressed
 *   (already captured in A's narrative).
 *
 * Output is sorted by severity: CRITICAL → HIGH → MODERATE → LOW.
 */
export function detectPatterns(
  indices: ComputedIndices,
  bands: Bands
): PatternFamily[] {
  const { S, H, D, J, totalCount, dominantSpecies, dominantCount, dominantProportion, compositeScore } =
    indices;

  const dominantPct = pct(dominantProportion);

  // Count how many index dimensions are in a concerning band
  const concerningDims = [
    bands.richness === "LOW",
    bands.shannon  === "VERY_LOW" || bands.shannon === "LOW",
    bands.simpson  === "LOW",
    bands.evenness === "LOW",
  ].filter(Boolean).length;

  const broadFires     = concerningDims >= 3;
  const dominanceFires = bands.simpson === "LOW" || dominantProportion >= 0.65;

  const patterns: PatternFamily[] = [];

  // ── A: Broad Biodiversity Concern ────────────────────────────────────────
  if (broadFires) {
    const conf     = confidence(bands.sampleSize, concerningDims);
    const severity: Severity = concerningDims === 4 ? "CRITICAL" : "HIGH";

    patterns.push({
      id:    "broad_concern",
      label: "Broad Biodiversity Concern",
      severity,
      confidence: conf,
      findingParagraph:
        `Multiple biodiversity dimensions simultaneously indicate ecological concern. ` +
        `Species richness is low (S = ${S}), Shannon diversity is ` +
        `${shannonLabel(bands.shannon)} (H = ${H}), Pielou evenness is low (J = ${J}), ` +
        `and Simpson diversity is low (D = ${D}). ${dominantSpecies} accounts for ` +
        `${dominantPct}% of all detections (${dominantCount} of ${totalCount} individuals). ` +
        `These four indices collectively characterise a community structure that is compromised ` +
        `across species variety, distributional balance, and dominance — a multi-dimensional ` +
        `signal that is more ecologically reliable than any single index considered in isolation.`,
      limitation:
        `When multiple indices are simultaneously depressed, individual index limitations ` +
        `compound. This assessment should be treated as directionally consistent rather than ` +
        `precisely quantified${sampleNote(bands.sampleSize, totalCount)}.`,
      nextStep:
        `Prioritise a comprehensive follow-up survey with expanded spatial and temporal ` +
        `coverage to determine whether this pattern is spatially localised or indicative ` +
        `of a broader ecosystem-level trend.`,
    });
  }

  // ── B: Reduced Species Variety ────────────────────────────────────────────
  if (!broadFires && bands.richness === "LOW") {
    const agr  = 1 + [
      bands.shannon === "VERY_LOW" || bands.shannon === "LOW",
      bands.evenness === "LOW",
    ].filter(Boolean).length;
    const conf = confidence(bands.sampleSize, agr);
    const severity: Severity =
      bands.shannon === "VERY_LOW" ? "HIGH" : "MODERATE";

    const shannonNote =
      bands.shannon === "VERY_LOW" || bands.shannon === "LOW"
        ? ` Shannon diversity is correspondingly ${shannonLabel(bands.shannon)} ` +
          `(H = ${H}), reflecting the limited number of contributing taxa.`
        : "";

    patterns.push({
      id:    "reduced_variety",
      label: "Reduced Species Variety",
      severity,
      confidence: conf,
      findingParagraph:
        `Species richness is low at S = ${S}, with only ${S} distinct ` +
        `${S === 1 ? "species" : "species"} detected across ${totalCount} total ` +
        `observations. This falls below the minimum threshold of 10 species considered ` +
        `indicative of adequate ecological variety.${shannonNote}`,
      limitation:
        `Species richness estimates are sensitive to sampling effort; limited survey ` +
        `duration or a restricted survey area may underestimate true local diversity` +
        `${sampleNote(bands.sampleSize, totalCount)}.`,
      nextStep:
        `Expand the survey area and duration, and cross-reference with regional species ` +
        `inventories to determine whether low richness reflects genuine ecosystem stress ` +
        `or insufficient sampling coverage.`,
    });
  }

  // ── C: Uneven Distribution ────────────────────────────────────────────────
  // Evenness is LOW but Shannon is not — evenness-specific signal.
  if (
    !broadFires &&
    bands.evenness === "LOW" &&
    bands.richness !== "LOW" &&
    !(bands.shannon === "VERY_LOW" || bands.shannon === "LOW")
  ) {
    const agr  = 1 + [bands.simpson === "LOW"].filter(Boolean).length;
    const conf = confidence(bands.sampleSize, agr);
    const severity: Severity = dominantProportion >= 0.75 ? "HIGH" : "MODERATE";

    patterns.push({
      id:    "uneven_distribution",
      label: "Uneven Species Distribution",
      severity,
      confidence: conf,
      findingParagraph:
        `Despite ${richnessLabel(bands.richness)} species richness (S = ${S}), ` +
        `community abundance is severely skewed. ${dominantSpecies} accounts for ` +
        `${dominantPct}% of all detections, compressing Pielou evenness to J = ${J} — ` +
        `below the 0.4 threshold for balanced community structure. Shannon diversity ` +
        `(H = ${H}) reflects this distributional imbalance.`,
      limitation:
        `Evenness indices are sensitive to rare species detection; brief survey windows ` +
        `may inflate dominance estimates if transient or schooling behaviour is captured ` +
        `disproportionately${sampleNote(bands.sampleSize, totalCount)}.`,
      nextStep:
        `Conduct temporally replicated surveys to determine whether the observed dominance ` +
        `pattern is persistent or reflects a transient snapshot of normal schooling behaviour.`,
    });
  }

  // ── D: Reduced Community Balance ─────────────────────────────────────────
  // Shannon LOW/VERY_LOW AND evenness LOW — both dimensions confirm reduced balance.
  if (
    !broadFires &&
    (bands.shannon === "VERY_LOW" || bands.shannon === "LOW") &&
    bands.evenness === "LOW" &&
    bands.richness !== "LOW"
  ) {
    const agr  = 1 + [bands.simpson === "LOW"].filter(Boolean).length;
    const conf = confidence(bands.sampleSize, agr);
    const severity: Severity = bands.shannon === "VERY_LOW" ? "HIGH" : "MODERATE";

    patterns.push({
      id:    "reduced_balance",
      label: "Reduced Community Balance",
      severity,
      confidence: conf,
      findingParagraph:
        `Overall community diversity is below expected levels. Shannon diversity is ` +
        `${shannonLabel(bands.shannon)} at H = ${H}, indicating that effective diversity ` +
        `is reduced relative to the number of species present (S = ${S}). Pielou evenness ` +
        `(J = ${J}) confirms that abundance distribution is ` +
        `${J < 0.2 ? "highly" : "moderately"} uneven across detected taxa, with ` +
        `${dominantSpecies} accounting for ${dominantPct}% of all individuals.`,
      limitation:
        `Shannon diversity integrates both richness and evenness; a low value may be ` +
        `disproportionately driven by one or two highly abundant species rather than a ` +
        `uniform decline across all taxa${sampleNote(bands.sampleSize, totalCount)}.`,
      nextStep:
        `Investigate the abundance distribution of individual species to identify whether ` +
        `a specific taxon is driving the observed reduction in Shannon diversity.`,
    });
  }

  // ── E: Dominance-Supported Concern ───────────────────────────────────────
  // Evaluated independently. Suppressed only if Broad Concern already
  // covers the same dominance signal (i.e., broadFires AND simpson LOW).
  if (dominanceFires && !(broadFires && bands.simpson === "LOW")) {
    const agr  = 1 + [
      bands.evenness === "LOW",
      bands.shannon === "VERY_LOW" || bands.shannon === "LOW",
    ].filter(Boolean).length;
    const conf = confidence(bands.sampleSize, agr);
    const severity: Severity = dominantProportion >= 0.80 ? "HIGH" : "MODERATE";

    patterns.push({
      id:    "dominance_concern",
      label: "Dominance-Supported Concern",
      severity,
      confidence: conf,
      findingParagraph:
        `${dominantSpecies} represents ${dominantPct}% of all individual detections ` +
        `(${dominantCount} of ${totalCount} individuals). The Simpson diversity index ` +
        `of D = ${D} reflects a correspondingly low probability that two randomly selected ` +
        `individuals from this dataset belong to different species. This statistical ` +
        `signature is consistent with a community structure disproportionately influenced ` +
        `by a small number of highly abundant taxa.`,
      limitation:
        `Simpson diversity is particularly sensitive to the most abundant species in the ` +
        `sample; a single highly represented taxon can substantially suppress the index ` +
        `value even when other species are present in adequate numbers` +
        `${sampleNote(bands.sampleSize, totalCount)}.`,
      nextStep:
        `Assess whether the abundance of ${dominantSpecies} is typical for this survey ` +
        `location and season by comparing against historical baseline data or adjacent ` +
        `survey sites.`,
    });
  }

  // ── F: Composite Biodiversity Concern ────────────────────────────────────
  if (bands.composite === "CRITICAL" || bands.composite === "STRESSED") {
    const isCritical = bands.composite === "CRITICAL";
    const conf       = confidence(bands.sampleSize, concerningDims);
    const severity: Severity = isCritical ? "CRITICAL" : "HIGH";

    patterns.push({
      id:    "composite_concern",
      label: "Composite Biodiversity Concern",
      severity,
      confidence: conf,
      findingParagraph:
        `The composite biodiversity score of ${compositeScore}/100 places the ecosystem ` +
        `in ${compositeStatusLabel(bands.composite)} status. This score integrates Shannon ` +
        `diversity (weighted 35%), Simpson diversity (30%), Pielou evenness (20%), and ` +
        `species richness (15%), reflecting the relative ecological significance of each ` +
        `indicator as established in the project's biodiversity framework. A ` +
        `${compositeStatusLabel(bands.composite)} composite rating indicates that the ` +
        `weighted combination of all four indices reflects a state of ` +
        `${isCritical ? "serious" : "significant"} biodiversity ` +
        `${isCritical ? "collapse" : "stress"} across the assessed dimensions.`,
      limitation:
        `The composite score is sensitive to the chosen weighting scheme and normalisation ` +
        `bounds; its absolute value should be interpreted alongside the individual index ` +
        `values rather than in isolation.`,
      nextStep:
        isCritical
          ? `Immediate expanded survey and expert consultation are strongly recommended. ` +
            `Current findings indicate a state requiring urgent ecological assessment.`
          : `Schedule a follow-up survey within the next assessment cycle to determine ` +
            `whether this trend is worsening or showing signs of recovery.`,
    });
  }

  // Sort by severity: CRITICAL → HIGH → MODERATE → LOW
  const severityOrder: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH:     1,
    MODERATE: 2,
    LOW:      3,
  };
  patterns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return patterns;
}

// ─── Step 4 — Report Rendering ────────────────────────────────────────────────

/**
 * Renders the final report as an ordered array of typed paragraphs.
 * Each paragraph carries a type so the component can apply appropriate styling.
 *
 * Structure:
 *   1. Opening summary (always present)
 *   2. One finding paragraph per detected pattern (finding + confidence + limitation)
 *   3. Synthesis paragraph (only when 2+ patterns fire)
 *   4. Recommendation (from highest-severity pattern)
 *   5. Data quality caveat (only when sample size is MARGINAL or INSUFFICIENT)
 */
export function renderReport(
  indices: ComputedIndices,
  bands: Bands,
  patterns: PatternFamily[]
): ReportParagraph[] {
  const { S, H, D, J, totalCount, compositeScore } = indices;
  const paragraphs: ReportParagraph[] = [];

  // ── Opening ───────────────────────────────────────────────────────────────
  if (patterns.length === 0) {
    paragraphs.push({
      type: "opening",
      text:
        `No rule-based flags were triggered for this dataset. The index profile is ` +
        `S=${S}, H'=${H}, 1-D=${D}, and J'=${J}, with a composite score of ` +
        `${compositeScore}/100 (${compositeStatusLabel(bands.composite)}) across n=${totalCount} detections. ` +
        `Confidence values reflect rule agreement and sample adequacy, not absolute ecological certainty.`,
    });
  } else {
    paragraphs.push({
      type: "opening",
      text:
        `${patterns.length} rule-based ${patterns.length === 1 ? "flag was" : "flags were"} triggered. ` +
        `The profile shows S=${S}, H'=${H}, 1-D=${D}, and J'=${J}, with a composite score of ` +
        `${compositeScore}/100 (${compositeStatusLabel(bands.composite)}) across n=${totalCount} detections. ` +
        `Confidence values reflect rule agreement and sample adequacy, not absolute ecological certainty.`,
    });
  }

  // ── Findings ──────────────────────────────────────────────────────────────
  for (const pattern of patterns) {
    paragraphs.push({
      type: "finding",
      severity: pattern.severity,
      text:
        `${pattern.label}: ${concisePatternSummary(pattern, indices, bands)} ` +
        `Severity: ${severityLabel(pattern.severity)}. Rule confidence: ${pattern.confidence}%. ` +
        `Interpretive note: ${conciseLimitation(pattern)}.`,
    });
  }

  // ── Synthesis ─────────────────────────────────────────────────────────────
  if (patterns.length > 1) {
    const labels = patterns.map((p) => p.label);
    paragraphs.push({
      type: "synthesis",
      text:
        `Taken together, ${formatList(labels)} indicate a low-richness, dominance-weighted ` +
        `assemblage in this sample rather than a balanced community profile. The signal is ` +
        `strong enough to prioritise follow-up, but should be checked against site history, ` +
        `seasonality, and survey design before being treated as a management conclusion. ` +
        `Priority: ${conciseNextStep(patterns[0])}.`,
    });
  } else if (patterns.length === 1) {
    paragraphs.push({
      type: "recommendation",
      text:
        `Priority: ${conciseNextStep(patterns[0])}. Treat the flag as a screening result ` +
        `until it is compared with local baselines and survey replication.`,
    });
  }

  // ── Data quality caveat ───────────────────────────────────────────────────
  if (bands.sampleSize !== "ADEQUATE") {
    paragraphs.push({
      type: "quality_caveat",
      text:
        bands.sampleSize === "MARGINAL"
          ? `Sample size note: n=${totalCount}; below recommended n=${SAMPLE_ADEQUATE}. Interpret pattern flags as provisional until additional detections are available.`
          : `Sample size warning: n=${totalCount}; below minimum n=${SAMPLE_MARGINAL}. Collect more data before ecological inference or comparisons across sites.`,
    });
  }

  return paragraphs;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Primary entry point for the rule engine.
 *
 * Accepts raw species counts and returns the complete output object containing
 * computed indices, qualitative bands, detected patterns, and the final rendered
 * report paragraphs ready for display.
 *
 * Returns null if counts are empty or all zero.
 *
 * Usage:
 *   const result = runRuleEngine({ "Lethrinus punctulatus": 45, "Lutjanus sebae": 3 });
 *   if (result) renderReport(result.indices, result.bands, result.patterns);
 */
export function runRuleEngine(counts: SpeciesCounts): RuleEngineOutput | null {
  const indices = computeIndices(counts);
  if (!indices) return null;

  const bands    = mapBands(indices);
  const patterns = detectPatterns(indices, bands);
  const paragraphs = renderReport(indices, bands, patterns);

  return {
    indices,
    bands,
    patterns,
    paragraphs,
    compositeStatus: bands.composite,
    hasWarnings:     bands.sampleSize !== "ADEQUATE" || patterns.length > 0,
    dominantSpecies: indices.dominantSpecies,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function confidence(sampleBand: SampleBand, agreeingIndices: number): number {
  const base = Math.min(60 + agreeingIndices * 10, 90);
  const modifier =
    sampleBand === "ADEQUATE"     ? 1.00 :
    sampleBand === "MARGINAL"     ? 0.75 :
    /* INSUFFICIENT */              0.50;
  return Math.round(base * modifier);
}

function sampleNote(band: SampleBand, count: number): string {
  if (band === "ADEQUATE")     return "";
  if (band === "MARGINAL")     return `, noting that the sample size of ${count} is marginal`;
  return `, noting that the sample size of ${count} is insufficient`;
}

function richnessLabel(b: RichnessBand): string {
  return { LOW: "low", MODERATE: "moderate", HIGH: "high", VERY_HIGH: "very high" }[b];
}

function shannonLabel(b: ShannonBand): string {
  return { VERY_LOW: "very low", LOW: "low", MODERATE: "moderate", HIGH: "high" }[b];
}

function simpsonLabel(b: SimpsonBand): string {
  return { LOW: "low", MODERATE: "moderate", HIGH: "high" }[b];
}

function evennessLabel(b: EvennessBand): string {
  return { LOW: "low", MODERATE: "moderate", HIGH: "high" }[b];
}

function compositeStatusLabel(s: CompositeStatus): string {
  return {
    CRITICAL:           "Critical",
    STRESSED:           "Stressed",
    MODERATELY_HEALTHY: "Moderately Healthy",
    HEALTHY:            "Healthy",
  }[s];
}

function severityLabel(s: Severity): string {
  return { LOW: "Low", MODERATE: "Moderate", HIGH: "High", CRITICAL: "Critical" }[s];
}

function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function concisePatternSummary(
  pattern: PatternFamily,
  indices: ComputedIndices,
  bands: Bands
): string {
  const dominantPct = pct(indices.dominantProportion);

  switch (pattern.id) {
    case "broad_concern":
      return `Several index dimensions are simultaneously depressed: S=${indices.S}, H'=${indices.H}, 1-D=${indices.D}, and J'=${indices.J}. The dominant taxon accounts for ${dominantPct}% of detections.`;
    case "reduced_variety":
      return `Only ${indices.S} taxa were detected across n=${indices.totalCount}, placing richness in the ${richnessLabel(bands.richness)} band. Shannon diversity is also ${shannonLabel(bands.shannon)}.`;
    case "uneven_distribution":
      return `Abundance is concentrated in ${indices.dominantSpecies}, which accounts for ${dominantPct}% of detections; J'=${indices.J}.`;
    case "reduced_balance":
      return `The combination of H'=${indices.H} and J'=${indices.J} indicates reduced community balance, with the dominant taxon representing ${dominantPct}% of detections.`;
    case "dominance_concern":
      return `${indices.dominantSpecies} dominates the sample at ${dominantPct}% (${indices.dominantCount}/${indices.totalCount}), with 1-D=${indices.D}.`;
    case "composite_concern":
      return `The composite score is ${indices.compositeScore}/100, placing the sample in ${compositeStatusLabel(bands.composite)} status under the current rule set.`;
    default:
      return pattern.findingParagraph;
  }
}

function conciseLimitation(pattern: PatternFamily): string {
  switch (pattern.id) {
    case "broad_concern":
      return "Multiple depressed dimensions strengthen the screening signal, but do not identify mechanism or cause";
    case "reduced_variety":
      return "Richness remains sensitive to survey effort, habitat coverage, and detection probability";
    case "uneven_distribution":
      return "Dominance may reflect seasonal aggregation, schooling behaviour, or the timing of the survey window";
    case "reduced_balance":
      return "Low H' and J' can be driven by a few abundant taxa rather than broad decline across all taxa";
    case "dominance_concern":
      return "Compare temporal and adjacent-site baselines before interpreting dominance as ecological stress";
    case "composite_concern":
      return "Composite score depends on project-specific weights and thresholds, so read it alongside the raw indices";
    default:
      return pattern.limitation;
  }
}

function conciseNextStep(pattern: PatternFamily): string {
  switch (pattern.id) {
    case "composite_concern":
      return "review the index profile with a marine ecologist and expand sampling before drawing management conclusions";
    case "reduced_variety":
      return "verify survey effort and compare richness against local or site-specific species baselines";
    case "dominance_concern":
      return `compare the dominant taxon's abundance against temporal replicates and adjacent-site baselines`;
    case "broad_concern":
      return "expand spatial and temporal sampling to test whether the signal persists";
    case "uneven_distribution":
    case "reduced_balance":
      return "replicate sampling across time windows and habitat strata";
    default:
      return pattern.nextStep;
  }
}

/**
 * Builds the synthesis sentence that bridges multiple concurrent patterns
 * into a coherent ecological narrative, based on which patterns co-fire.
 */
function buildSynthesis(
  patterns: PatternFamily[],
  _indices: ComputedIndices,
  _bands: Bands
): string {
  const ids = new Set(patterns.map((p) => p.id));

  if (ids.has("broad_concern") && ids.has("dominance_concern")) {
    return (
      `The statistical dominance signal independently corroborates the multi-dimensional ` +
      `biodiversity depression detected across all index dimensions, confirming that ` +
      `community skew is the primary structural feature of this dataset.`
    );
  }
  if (ids.has("uneven_distribution") && ids.has("dominance_concern")) {
    return (
      `The dominance signal detected by the Simpson index corroborates the distributional ` +
      `imbalance detected by Pielou evenness, providing consistent evidence of community ` +
      `skew from two independent measurements.`
    );
  }
  if (ids.has("reduced_balance") && ids.has("dominance_concern")) {
    return (
      `The Simpson dominance signal reinforces the reduced balance finding: both metrics ` +
      `independently indicate that the community is disproportionately structured around ` +
      `a small number of highly abundant taxa.`
    );
  }
  if (ids.has("reduced_variety") && ids.has("composite_concern")) {
    return (
      `The low species count and the depressed composite score converge on the same ` +
      `conclusion: the assessed community represents a substantially impoverished ` +
      `biodiversity state across multiple measurement frameworks.`
    );
  }
  if (ids.has("broad_concern") && ids.has("composite_concern")) {
    return (
      `The composite score independently corroborates the multi-index finding, ` +
      `confirming that the aggregated weighted signal aligns with the individual ` +
      `pattern-level findings across all four index dimensions.`
    );
  }
  // Generic fallback
  return (
    `These concurrent patterns indicate that the ecosystem exhibits biodiversity stress ` +
    `across multiple measurable dimensions simultaneously, strengthening the overall ` +
    `ecological interpretation beyond what any single index could establish alone.`
  );
}
