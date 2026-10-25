import { useState } from "react";
import { jsPDF } from "jspdf";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { FishSpecies } from "@/data/marineData";
import type { RuleEngineOutput } from "@/lib/ruleEngine";

interface DownloadReportProps {
  surveyName: string;
  species: FishSpecies[];
  output: RuleEngineOutput | null;
}

function fileNameFromSurvey(surveyName: string): string {
  const normalized = surveyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${normalized || "biodiversity"}-report.pdf`;
}

export function DownloadReport({ surveyName, species, output }: DownloadReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = () => {
    if (!output) {
      toast({
        title: "No report to export",
        description: "Select a dataset with positive species counts first.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const report = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 16;
      const contentWidth = 210 - margin * 2;
      const pageBottom = 280;
      let y = 18;

      const addPageIfNeeded = (height: number) => {
        if (y + height <= pageBottom) return;
        report.addPage();
        y = 18;
      };

      const addHeading = (text: string, level: 1 | 2 = 2) => {
        const size = level === 1 ? 18 : 12;
        addPageIfNeeded(size / 2 + 8);
        report.setFont("helvetica", "bold");
        report.setFontSize(size);
        report.setTextColor(12, 83, 105);
        report.text(text, margin, y);
        y += level === 1 ? 10 : 7;
      };

      const addText = (text: string, emphasis = false, size = 9.5) => {
        report.setFont("helvetica", emphasis ? "bold" : "normal");
        report.setFontSize(size);
        report.setTextColor(48, 70, 82);
        const lines = report.splitTextToSize(text, contentWidth) as string[];
        const lineHeight = size * 0.48;
        addPageIfNeeded(lines.length * lineHeight + 3);
        report.text(lines, margin, y);
        y += lines.length * lineHeight + 3;
      };

      const addRule = () => {
        addPageIfNeeded(4);
        report.setDrawColor(185, 207, 214);
        report.line(margin, y, margin + contentWidth, y);
        y += 5;
      };

      addHeading("Marine Biodiversity Count Analysis", 1);
      addText(`Dataset: ${surveyName}`, true);
      addText(`Generated: ${new Date().toLocaleString()}`);
      addRule();

      addHeading("Assessment summary");
      addText(
        `Composite status: ${output.compositeStatus.replace(/_/g, " ")} | Score: ${output.indices.compositeScore}/100 | ${output.indices.S} taxa | ${output.indices.totalCount} individuals`,
        true
      );
      addText(
        `Dominant taxon: ${output.indices.dominantSpecies} (${output.indices.dominantCount} individuals; ${(output.indices.dominantProportion * 100).toFixed(1)}%).`
      );
      addText(`Sample-size adequacy: ${output.bands.sampleSize.toLowerCase()}.`);
      addRule();

      addHeading("Calculated biodiversity indices");
      addText(`Species richness (S): ${output.indices.S} — ${output.bands.richness}`);
      addText(`Shannon diversity (H'): ${output.indices.H} — ${output.bands.shannon}`);
      addText(`Gini-Simpson diversity (1-D): ${output.indices.D} — ${output.bands.simpson}`);
      addText(`Pielou evenness (J'): ${output.indices.J} — ${output.bands.evenness}`);
      addRule();

      addHeading("Rule-engine findings");
      if (output.patterns.length === 0) {
        addText("No rule-based pattern families were triggered for this count distribution.");
      } else {
        output.patterns.forEach((pattern) => {
          addText(
            `${pattern.label} — ${pattern.severity} severity; ${pattern.confidence}% rule confidence.`,
            true
          );
          addText(pattern.findingParagraph);
          addText(`Interpretive note: ${pattern.limitation}`);
          addText(`Recommended follow-up: ${pattern.nextStep}`);
        });
      }
      addRule();

      addHeading("Ranked species count records");
      const sortedSpecies = [...species].sort((a, b) => b.count - a.count);
      sortedSpecies.forEach((item, index) => {
        addText(
          `${index + 1}. ${item.scientificName} — ${item.count} individuals (${item.percentage}%)`,
          false,
          9
        );
      });
      addRule();

      addHeading("Scientific use note");
      addText(
        "This report is decision support only. Its thresholds and rule families are project heuristics, not ground truth. Validate findings against replicate count datasets, species-identification quality, local baselines when available, and expert marine review before use in conservation, fisheries, policy, or operations."
      );
      addText(
        "Rule confidence is deterministic: it reflects agreement among count-derived indices and sample-size adequacy. It is not a probability of ecological truth."
      );

      report.save(fileNameFromSurvey(surveyName));
      toast({
        title: "PDF downloaded",
        description: "The biodiversity analysis report has been saved to your device.",
      });
    } catch (error) {
      console.error("Failed to export biodiversity report", error);
      toast({
        title: "PDF export failed",
        description: "The report could not be generated. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-display text-2xl">Report</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The selected survey's indices, rule findings and ranked counts, as a PDF.
        </p>
      </div>
      <Button onClick={handleDownload} disabled={!output || isExporting} className="gap-2">
        {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isExporting ? "Generating…" : "Export PDF"}
      </Button>
    </div>
  );
}
