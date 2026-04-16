import { useState, useEffect, useRef } from "react";
import { Database, Calendar, Clock, Upload as UploadIcon, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sampleDatasets, Dataset } from "@/data/monitorDatasets";
import DatasetFrameView from "@/components/monitor/DatasetFrameView";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m} min ${s.toString().padStart(2, "0")} sec`;
}

function probeVideoMetadata(url: string): Promise<{ duration: number }> {
  return new Promise((resolve) => {
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      resolve({ duration: vid.duration });
      vid.src = "";
    };
    vid.onerror = () => resolve({ duration: 0 });
    vid.src = url;
  });
}

async function makeDatasetFromFile(file: File): Promise<Dataset> {
  const id = `upload-${Date.now()}`;
  const name = file.name.replace(/\.[^.]+$/, "");
  // Use file's last-modified date, fall back to today
  const rawDate = file.lastModified ? new Date(file.lastModified) : new Date();
  const date = rawDate.toISOString().slice(0, 10);
  const videoUrl = URL.createObjectURL(file);
  const { duration } = await probeVideoMetadata(videoUrl);
  return {
    id,
    name,
    location: "Uploaded",
    date,
    totalFrames: sampleDatasets[0].frames.length,
    duration: duration > 0 ? formatDuration(duration) : "—",
    depth: "—",
    frames: sampleDatasets[0].frames,
    videoUrl,
  };
}

const LiveMonitor = () => {
  const [datasets, setDatasets] = useState<Dataset[]>(sampleDatasets);
  const [selectedDatasetId, setSelectedDatasetId] = useState(sampleDatasets[0].id);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode] = useState<"raw" | "waternet">("waternet");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hasVideo, setHasVideo] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => { urls.forEach(URL.revokeObjectURL); };
  }, []);

  const dataset = datasets.find((d) => d.id === selectedDatasetId)!;
  const frame = dataset.frames[currentFrameIdx];

  useEffect(() => {
    if (!isPlaying || dataset.videoUrl) return;
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
  }, [isPlaying, dataset.frames.length, playbackSpeed, dataset.videoUrl]);

  const handleDatasetChange = (id: string) => {
    setSelectedDatasetId(id);
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  };

  const handleSeek = (index: number) => {
    setCurrentFrameIdx(index);
    setIsPlaying(false);
  };

  const activateDataset = (newDataset: Dataset) => {
    if (newDataset.videoUrl) blobUrlsRef.current.push(newDataset.videoUrl);
    setDatasets((prev) => [...prev, newDataset]);
    setSelectedDatasetId(newDataset.id);
    setCurrentFrameIdx(0);
    setIsPlaying(false);
    setPlaybackSpeed(1);
  };

  const handleFileSelect = async (file: File) => {
    setProcessing(true);
    const newDataset = await makeDatasetFromFile(file);
    activateDataset(newDataset);
    setProcessing(false);
    setHasVideo(true);
  };

  const handleExplorerUpload = async (file: File) => {
    activateDataset(await makeDatasetFromFile(file));
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
            } ${processing ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => !processing && fileInputRef.current?.click()}
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

            {processing ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                <p className="text-lg font-medium">Loading video...</p>
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
        <div className="glass-card rounded-xl px-5 py-3 flex flex-wrap items-center gap-6 text-sm text-muted-foreground relative z-20">
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
                  {datasets.map((ds) => (
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
                if (f) handleExplorerUpload(f);
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
          videoUrl={dataset.videoUrl}
        />
      </div>
    </div>
  );
};

export default LiveMonitor;
