import { useState, useEffect, useRef } from "react";
import { Database, Calendar, Clock, Upload as UploadIcon, Loader2, ChevronDown, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dataset, DatasetFrame } from "@/data/monitorDatasets";
import DatasetFrameView from "@/components/monitor/DatasetFrameView";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { uploadDataset } from "@/lib/uploadDataset";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

// Empty stub frame so DatasetFrameView doesn't crash when frames[] is empty.
const EMPTY_FRAME: DatasetFrame = {
  id: 0,
  timestamp: "",
  detections: [],
  frameStats: { fps: 0, inferenceMs: 0, vram: 0 },
};

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

async function makeDatasetFromFile(file: File, idOverride?: string): Promise<Dataset> {
  const id = idOverride ?? `upload-${Date.now()}`;
  const name = file.name.replace(/\.[^.]+$/, "");
  const rawDate = file.lastModified ? new Date(file.lastModified) : new Date();
  const date = rawDate.toISOString().slice(0, 10);
  const videoUrl = URL.createObjectURL(file);
  const { duration } = await probeVideoMetadata(videoUrl);
  return {
    id,
    name,
    location: "Uploaded",
    date,
    totalFrames: 0,
    duration: duration > 0 ? formatDuration(duration) : "—",
    depth: "—",
    frames: [],
    videoUrl,
  };
}

const LiveMonitor = () => {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [storagePathById, setStoragePathById] = useState<Record<string, string>>({});
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode] = useState<"raw" | "waternet">("waternet");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hasVideo, setHasVideo] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "finalizing" | "done">("idle");
  const [uploadFileName, setUploadFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => { urls.forEach(URL.revokeObjectURL); };
  }, []);

  // Load the user's saved datasets from Supabase whenever they're authenticated.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("datasets")
        .select("id, name, location, capture_date, duration_seconds, storage_path")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data || cancelled) return;

      const loaded: Dataset[] = [];
      const pathByLoadedId: Record<string, string> = {};
      for (const row of data) {
        if (!row.storage_path) continue;

        const { data: signed } = await supabase
          .storage
          .from("datasets")
          .createSignedUrl(row.storage_path, 3600);

        if (!signed?.signedUrl) continue;

        loaded.push({
          id: row.id,
          name: row.name,
          location: row.location ?? "Uploaded",
          date: row.capture_date ?? "—",
          totalFrames: 0,
          duration: row.duration_seconds ? formatDuration(row.duration_seconds) : "—",
          depth: "—",
          frames: [],
          videoUrl: signed.signedUrl,
        });
        pathByLoadedId[row.id] = row.storage_path;
      }

      if (cancelled) return;

      setDatasets((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        const fresh = loaded.filter((d) => !existingIds.has(d.id));
        return [...fresh, ...prev];
      });
      setStoragePathById((m) => ({ ...m, ...pathByLoadedId }));

      if (loaded.length > 0) {
        setHasVideo(true);
        setSelectedDatasetId((curr) => {
          if (curr && loaded.some((d) => d.id === curr)) return curr;
          return loaded[0].id;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const dataset = datasets.find((d) => d.id === selectedDatasetId);
  const frame = dataset?.frames[currentFrameIdx] ?? EMPTY_FRAME;

  useEffect(() => {
    if (!dataset || !isPlaying || dataset.videoUrl) return;
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
  }, [isPlaying, dataset, playbackSpeed]);

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
    setUploadFileName(file.name);
    setUploadProgress(0);
    setUploadStage("uploading");

    try {
      let datasetId: string | undefined;
      let storagePath: string | undefined;

      if (user) {
        const result = await uploadDataset({
          file,
          userId: user.id,
          onProgress: (pct) => setUploadProgress(pct),
        });
        datasetId = result.datasetId;
        storagePath = result.storagePath;
        setUploadStage("finalizing");
      } else {
        for (let p = 0; p <= 100; p += 10) {
          setUploadProgress(p);
          await new Promise((r) => setTimeout(r, 60));
        }
      }

      const newDataset = await makeDatasetFromFile(file, datasetId);
      if (storagePath) {
        setStoragePathById((m) => ({ ...m, [newDataset.id]: storagePath! }));
      }
      activateDataset(newDataset);
      setUploadStage("done");
      setHasVideo(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
      setUploadStage("idle");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!datasetToDelete) return;
    setDeleting(true);

    try {
      const id = datasetToDelete.id;
      const path = storagePathById[id];

      // If this dataset is backed by Supabase, remove the storage object + DB row
      if (path && user) {
        const { error: storageErr } = await supabase
          .storage.from("datasets").remove([path]);
        if (storageErr) throw new Error(storageErr.message);

        const { error: dbErr } = await supabase
          .from("datasets").delete().eq("id", id);
        if (dbErr) throw new Error(dbErr.message);
      }

      // Drop from local state
      const remaining = datasets.filter((d) => d.id !== id);
      setDatasets(remaining);
      setStoragePathById((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });

      // If we deleted the active dataset, pick another or fall back to upload UI
      if (selectedDatasetId === id) {
        if (remaining.length > 0) {
          setSelectedDatasetId(remaining[0].id);
          setCurrentFrameIdx(0);
          setIsPlaying(false);
        } else {
          setSelectedDatasetId("");
          setHasVideo(false);
        }
      }

      // Free the in-memory blob URL if any
      if (datasetToDelete.videoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(datasetToDelete.videoUrl);
      }

      toast({ title: "Video deleted" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDatasetToDelete(null);
    }
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
  if (!hasVideo || !dataset) {
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
              <div className="space-y-4 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2">
                  {uploadStage === "finalizing" ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : uploadStage === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <UploadIcon className="w-5 h-5 text-primary" />
                  )}
                  <p className="text-base font-medium">
                    {uploadStage === "finalizing"
                      ? "Finalizing..."
                      : uploadStage === "done"
                      ? "Upload complete"
                      : "Uploading video"}
                  </p>
                </div>
                {uploadFileName && (
                  <p className="text-xs text-muted-foreground truncate">{uploadFileName}</p>
                )}
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {uploadProgress.toFixed(0)}%
                  {!user && " (local only — sign in to save to your account)"}
                </p>
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
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDatasetToDelete(dataset)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
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

        {/* Delete confirmation */}
        <AlertDialog open={!!datasetToDelete} onOpenChange={(open) => !open && setDatasetToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this video?</AlertDialogTitle>
              <AlertDialogDescription>
                "{datasetToDelete?.name}" will be permanently removed
                {storagePathById[datasetToDelete?.id ?? ""] ? " from your account and cloud storage" : " from this session"}.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleDelete(); }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
