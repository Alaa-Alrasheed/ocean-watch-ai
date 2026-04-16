import { useState, useEffect, useRef } from "react";
import { Database, Calendar, Clock, Upload as UploadIcon, Video, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sampleDatasets } from "@/data/monitorDatasets";
import DatasetFrameView from "@/components/monitor/DatasetFrameView";

const LiveMonitor = () => {
  const [selectedDatasetId, setSelectedDatasetId] = useState(sampleDatasets[0].id);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<"raw" | "waternet">("waternet");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hasVideo, setHasVideo] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
  };

  const handleProcess = () => {
    setProcessing(true);
    // Simulated processing — after "analysis", show the explorer
    setTimeout(() => {
      setProcessing(false);
      setHasVideo(true);
    }, 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  // Empty state — upload UI
  if (!hasVideo) {
    return (
      <div className="min-h-screen gradient-ocean pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold glow-text flex items-center gap-3">
              Data Explorer
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload underwater footage for AI-powered species detection and biodiversity analysis.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`glass-card p-12 text-center transition-all duration-300 cursor-pointer ${
              dragOver ? "border-primary/60 bg-primary/5 teal-glow" : "hover:border-primary/30"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />

            {uploadedFile ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                <div>
                  <p className="text-lg font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drop your video here</p>
                  <p className="text-sm text-muted-foreground">or click to browse — MP4, AVI, MOV</p>
                </div>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="space-y-4">
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium mb-3">Analysis Options</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["Species Detection", "Biodiversity Index", "AI Insights", "Track Movement"].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                      <input type="checkbox" defaultChecked className="accent-primary" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleProcess}
                disabled={processing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 teal-glow"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" /> Start Analysis
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Video loaded — explorer UI
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
          <div className="relative flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-secondary border border-border/30 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              >
                {dataset.name}
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-secondary border border-border/30 rounded-lg overflow-hidden shadow-lg">
                  {sampleDatasets.map((ds) => (
                    <button
                      key={ds.id}
                      onClick={() => { handleDatasetChange(ds.id); setDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        ds.id === selectedDatasetId
                          ? "bg-primary/20 text-primary"
                          : "text-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {ds.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {dataset.date}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {dataset.duration}</span>
          <div className="ml-auto">
            <Button size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon className="w-3.5 h-3.5" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) console.log("File selected:", f.name);
              }}
            />
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
