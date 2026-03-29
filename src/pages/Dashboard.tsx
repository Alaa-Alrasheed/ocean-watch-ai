import { SurveyHeader } from "@/components/dashboard/SurveyHeader";
import { HealthIndicator } from "@/components/dashboard/HealthIndicator";
import { BiodiversityScore } from "@/components/dashboard/BiodiversityScore";
import { SpeciesTable } from "@/components/dashboard/SpeciesTable";
import { SpeciesChart } from "@/components/dashboard/SpeciesChart";
import { TemporalChart } from "@/components/dashboard/TemporalChart";
import { LLMInterpretation } from "@/components/dashboard/LLMInterpretation";
import { DownloadReport } from "@/components/dashboard/DownloadReport";
import { speciesData, biodiversityIndices, temporalData, llmInterpretation } from "@/data/marineData";

const Dashboard = () => {
  return (
    <div className="min-h-screen gradient-ocean pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SurveyHeader />

        {/* Biodiversity Indices + Composite Score */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Biodiversity Indices</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {biodiversityIndices.map((idx) => (
              <HealthIndicator key={idx.name} index={idx} />
            ))}
            <BiodiversityScore />
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SpeciesChart species={speciesData} />
          <TemporalChart data={temporalData} />
        </section>

        {/* Species Table */}
        <section>
          <SpeciesTable species={speciesData} />
        </section>

        {/* LLM Interpretation */}
        <section>
          <LLMInterpretation text={llmInterpretation} />
        </section>

        {/* Download Report */}
        <section>
          <DownloadReport />
        </section>

        <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border/30">
          Marine Biodiversity Analysis Framework — Fujairah, UAE · Powered by Deep Learning & LLM Interpretation
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
