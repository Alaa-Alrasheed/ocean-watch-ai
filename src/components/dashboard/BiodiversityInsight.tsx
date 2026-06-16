import { useMemo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { runRuleEngine, SAMPLE_ADEQUATE, SAMPLE_MARGINAL } from "@/lib/ruleEngine";
import type {
  CompositeStatus,
  ReportParagraph,
  SampleBand,
  Severity,
  SpeciesCounts,
} from "@/lib/ruleEngine";

interface BiodiversityInsightProps {
  speciesCounts: SpeciesCounts;
  className?: string;
}

const compositeStyle: Record<
  CompositeStatus,
  { badge: string; headerBg: string; headerBorder: string; dot: string; label: string }
> = {
  HEALTHY: {
    badge: "bg-bioluminescent/10 text-bioluminescent ring-1 ring-bioluminescent/30",
    headerBg: "bg-bioluminescent/5",
    headerBorder: "border-bioluminescent/20",
    dot: "bg-bioluminescent",
    label: "Healthy",
  },
  MODERATELY_HEALTHY: {
    badge: "bg-sand/10 text-sand ring-1 ring-sand/30",
    headerBg: "bg-sand/5",
    headerBorder: "border-sand/20",
    dot: "bg-sand",
    label: "Moderately Healthy",
  },
  STRESSED: {
    badge: "bg-coral-soft/10 text-coral-soft ring-1 ring-coral-soft/30",
    headerBg: "bg-coral-soft/5",
    headerBorder: "border-coral-soft/20",
    dot: "bg-coral-soft",
    label: "Stressed",
  },
  CRITICAL: {
    badge: "bg-destructive/10 text-destructive ring-1 ring-destructive/30",
    headerBg: "bg-destructive/5",
    headerBorder: "border-destructive/20",
    dot: "bg-destructive",
    label: "Critical",
  },
};

const severityStyle: Record<
  Severity,
  { border: string; bg: string; label: string; labelColor: string }
> = {
  LOW: {
    border: "border-l-bioluminescent",
    bg: "bg-bioluminescent/5",
    label: "Low Severity",
    labelColor: "text-bioluminescent",
  },
  MODERATE: {
    border: "border-l-sand",
    bg: "bg-sand/5",
    label: "Moderate Severity",
    labelColor: "text-sand",
  },
  HIGH: {
    border: "border-l-coral-soft",
    bg: "bg-coral-soft/5",
    label: "High Severity",
    labelColor: "text-coral-soft",
  },
  CRITICAL: {
    border: "border-l-destructive",
    bg: "bg-destructive/5",
    label: "Critical Severity",
    labelColor: "text-destructive",
  },
};

function splitFinding(text: string): [string, string | null] {
  const marker = " Interpretive note:";
  const idx = text.indexOf(marker);

  if (idx === -1) {
    return [text, null];
  }

  return [text.slice(0, idx).trim(), text.slice(idx + marker.length).trim()];
}

function renderWithItalics(text: string, speciesNames: string[]): ReactNode[] {
  if (speciesNames.length === 0) {
    return [text];
  }

  const sorted = [...speciesNames].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((species) => species.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(pattern);
  const nameSet = new Set(speciesNames);

  return parts.map((part, i) =>
    nameSet.has(part) ? (
      <em key={`${part}-${i}`} className="font-medium italic text-foreground">
        {part}
      </em>
    ) : (
      part
    )
  );
}

function OpeningParagraph({
  text,
  speciesNames,
}: {
  text: string;
  speciesNames: string[];
}) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {renderWithItalics(text, speciesNames)}
    </p>
  );
}

function FindingParagraph({
  text,
  severity,
  speciesNames,
}: {
  text: string;
  severity: Severity;
  speciesNames: string[];
}) {
  const style = severityStyle[severity];
  const [finding, limitation] = splitFinding(text);

  return (
    <div className={`space-y-2 rounded-r-md border-l-2 px-4 py-3 ${style.border} ${style.bg}`}>
      <span className={`text-[11px] font-semibold uppercase tracking-wide ${style.labelColor}`}>
        {style.label}
      </span>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {renderWithItalics(finding, speciesNames)}
      </p>
      {limitation && (
        <p className="border-t border-border/40 pt-2 text-xs italic leading-relaxed text-muted-foreground">
          <span className="not-italic font-medium text-foreground/70">Note: </span>
          {renderWithItalics(limitation, speciesNames)}
        </p>
      )}
    </div>
  );
}

function SynthesisParagraph({
  text,
  speciesNames,
}: {
  text: string;
  speciesNames: string[];
}) {
  return (
    <div className="rounded-md border border-border/50 bg-secondary/20 px-4 py-3">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {renderWithItalics(text, speciesNames)}
      </p>
    </div>
  );
}

function RecommendationParagraph({
  text,
  speciesNames,
}: {
  text: string;
  speciesNames: string[];
}) {
  return (
    <div className="rounded-r-md border-l-2 border-l-accent bg-accent/5 px-4 py-3">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {renderWithItalics(text, speciesNames)}
      </p>
    </div>
  );
}

function QualityCaveat({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-sand/30 bg-sand/10 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sand" aria-hidden="true" />
      <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function ScientificUseDisclaimer() {
  return (
    <div className="flex gap-3 border-b border-border/40 bg-destructive/5 px-5 py-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral-soft" aria-hidden="true" />
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-coral-soft">
          Scientific review required
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Decision support only. Thresholds and pattern families are project heuristics,
          not ground truth; validate against local baselines, survey design, CV error, and
          expert review before use in conservation, fisheries, policy, or operations.
        </p>
      </div>
    </div>
  );
}

function DatasetSizeLimitation({
  sampleSize,
  totalCount,
}: {
  sampleSize: SampleBand;
  totalCount: number;
}) {
  if (sampleSize === "ADEQUATE") {
    return null;
  }

  const isInsufficient = sampleSize === "INSUFFICIENT";

  return (
    <div className="flex gap-3 border-b border-border/40 bg-red-500/5 px-5 py-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
          Dataset size limitation
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          n={totalCount}:{" "}
          {isInsufficient
            ? `below minimum n=${SAMPLE_MARGINAL}`
            : `below recommended n=${SAMPLE_ADEQUATE}`}{" "}
          for this rule set. Treat flags as high-uncertainty until sampling is expanded.
        </p>
      </div>
    </div>
  );
}

export default function BiodiversityInsight({
  speciesCounts,
  className = "",
}: BiodiversityInsightProps) {
  const output = useMemo(() => runRuleEngine(speciesCounts), [speciesCounts]);

  if (!output) {
    return (
      <div className={`glass-card rounded-xl border-dashed px-6 py-8 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">
          No species data available. Upload a dataset to generate an ecological assessment.
        </p>
      </div>
    );
  }

  const { paragraphs, compositeStatus, patterns, indices, bands } = output;
  const allSpeciesNames = Object.keys(speciesCounts).filter((species) => speciesCounts[species] > 0);
  const status = compositeStyle[compositeStatus];
  const topSeverity = patterns.length > 0 ? patterns[0].severity : null;

  return (
    <div className={`glass-card overflow-hidden rounded-xl ${className}`}>
      <div
        className={`flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${status.headerBorder} ${status.headerBg}`}
      >
        <div>
          <h2 className="text-lg font-semibold">Ecological Insight Report</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Deterministic rule-engine output from species counts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {topSeverity && (
            <span className={`text-xs font-medium ${severityStyle[topSeverity].labelColor}`}>
              {severityStyle[topSeverity].label}
            </span>
          )}
          <span className="font-mono text-xs text-muted-foreground">
            Score {indices.compositeScore}/100
          </span>
        </div>
      </div>

      <ScientificUseDisclaimer />
      <DatasetSizeLimitation sampleSize={bands.sampleSize} totalCount={indices.totalCount} />

      <div className="space-y-3 px-5 py-4">
        {paragraphs.map((paragraph: ReportParagraph, i: number) => {
          switch (paragraph.type) {
            case "opening":
              return (
                <OpeningParagraph
                  key={i}
                  text={paragraph.text}
                  speciesNames={allSpeciesNames}
                />
              );
            case "finding":
              return (
                <FindingParagraph
                  key={i}
                  text={paragraph.text}
                  severity={paragraph.severity!}
                  speciesNames={allSpeciesNames}
                />
              );
            case "synthesis":
              return (
                <SynthesisParagraph
                  key={i}
                  text={paragraph.text}
                  speciesNames={allSpeciesNames}
                />
              );
            case "recommendation":
              return (
                <RecommendationParagraph
                  key={i}
                  text={paragraph.text}
                  speciesNames={allSpeciesNames}
                />
              );
            case "quality_caveat":
              return <QualityCaveat key={i} text={paragraph.text} />;
            default:
              return null;
          }
        })}
      </div>

      <div className="flex flex-col gap-1 border-t border-border/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[11px] text-muted-foreground">
          Generated by deterministic rule engine - {patterns.length}{" "}
          {patterns.length === 1 ? "pattern" : "patterns"} detected - {indices.S}{" "}
          species - {indices.totalCount} individuals
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          H={indices.H} - D={indices.D} - J={indices.J}
        </span>
      </div>
    </div>
  );
}
