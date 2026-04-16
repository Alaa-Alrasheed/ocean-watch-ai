import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Database, Calendar, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sampleDatasets } from "@/data/monitorDatasets";
import DatasetFrameView from "@/components/monitor/DatasetFrameView";

const LiveMonitor = () => {
  const [selectedDatasetId, setSelectedDatasetId] = useState(sampleDatasets[0].id);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<"raw" | "waternet">("waternet");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const dataset = sampleDatasets.find((d) => d.id === selectedDatasetId)!;
  const frame = dataset.frames[currentFrameIdx];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => {
        if (prev >= dataset.frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, dataset.frames.length, playbackSpeed]);

  const handleDatasetChange = (id: string) => {
    setSelectedDatasetId(id);
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  };

  const handleSeek = (index: number) => {
    setCurrentFrameIdx(index);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen gradient-ocean pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold glow-text flex items-center gap-3">
              Data Explorer
            </h1>
            <p className="text-muted-foreground mt-1">Browse AI detection results across uploaded datasets</p>
          </div>
        </div>

        {/* Dataset selector & metadata */}
        <div className="glass-card rounded-xl px-5 py-3 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <select
              value={selectedDatasetId}
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="bg-secondary/30 border border-border/30 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {sampleDatasets.map((ds) => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </select>
          </div>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {dataset.date}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {dataset.duration}</span>
          <div className="ml-auto">
            <Link to="/upload">
              <Button size="sm" className="gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload
              </Button>
            </Link>
          </div>
        </div>

        {/* Full-width frame viewer */}
        <DatasetFrameView
          frame={frame}
          currentIndex={currentFrameIdx}
          totalFrames={dataset.frames.length}
          viewMode={viewMode}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onSeek={handleSeek}
          onSpeedChange={setPlaybackSpeed}
        />
      </div>
    </div>
  );
};

export default LiveMonitor;
