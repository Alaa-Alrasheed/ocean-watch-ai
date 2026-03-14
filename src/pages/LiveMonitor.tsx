import { useState, useMemo } from "react";
import { Database, ChevronLeft, ChevronRight, Play, Pause, Cpu, Eye, MapPin, Calendar, Ruler, Clock } from "lucide-react";
import { sampleDatasets, Dataset, DatasetFrame } from "@/data/monitorDatasets";
import { monitorSpecies } from "@/data/marineData";
import DatasetFrameView from "@/components/monitor/DatasetFrameView";
import TelemetryPanel from "@/components/monitor/TelemetryPanel";
import TaxonomyPanel from "@/components/monitor/TaxonomyPanel";
import SpeciesHUD from "@/components/monitor/SpeciesHUD";

const LiveMonitor = () => {
  const [selectedDatasetId, setSelectedDatasetId] = useState(sampleDatasets[0].id);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const dataset = sampleDatasets.find((d) => d.id === selectedDatasetId)!;
  const frame = dataset.frames[currentFrameIdx];

  // Auto-play through frames
  useState(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => {
        if (prev >= dataset.frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  });

  // Track which species are detected in current frame
  const activeSpeciesIds = useMemo(
    () => new Set(frame.detections.map((d) => d.speciesId)),
    [frame]
  );

  const speciesWithState = monitorSpecies.map((s) => {
    const detection = frame.detections.find((d) => d.speciesId === s.id);
    return {
      ...s,
      active: !!detection,
      confidence: detection?.confidence || 0,
    };
  });

  const primaryDetection = frame.detections.length > 0
    ? frame.detections.reduce((a, b) => (a.confidence > b.confidence ? a : b))
    : null;

  const handleDatasetChange = (id: string) => {
    setSelectedDatasetId(id);
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  };

  const handlePrev = () => setCurrentFrameIdx((i) => Math.max(0, i - 1));
  const handleNext = () => setCurrentFrameIdx((i) => Math.min(dataset.frames.length - 1, i + 1));

  return (
    <div className="min-h-screen gradient-ocean pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold glow-text flex items-center gap-3">
              Dataset Monitor <span className="text-2xl">🔬</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse AI detection results across uploaded datasets
            </p>
          </div>

          {/* Dataset Selector */}
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-primary" />
            <select
              value={selectedDatasetId}
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="bg-secondary/30 border border-border/30 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {sampleDatasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dataset Info Bar */}
        <div className="glass-card rounded-xl px-5 py-3 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {dataset.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> {dataset.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" /> {dataset.depth}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {dataset.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> {dataset.totalFrames} frames
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Frame Viewer */}
          <div className="lg:col-span-2">
            <DatasetFrameView
              frame={frame}
              currentIndex={currentFrameIdx}
              totalFrames={dataset.frames.length}
              isPlaying={isPlaying}
              onPrev={handlePrev}
              onNext={handleNext}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <TelemetryPanel
              fps={frame.frameStats.fps}
              inferenceMs={frame.frameStats.inferenceMs}
              vram={frame.frameStats.vram}
              detectionCount={frame.detections.length}
            />
            <TaxonomyPanel detection={primaryDetection} />
          </div>
        </div>

        {/* Species HUD */}
        <SpeciesHUD species={speciesWithState} />
      </div>
    </div>
  );
};

export default LiveMonitor;
