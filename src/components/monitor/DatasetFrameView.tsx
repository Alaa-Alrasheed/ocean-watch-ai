import { useState, useRef, useEffect } from "react";
import { Play, Pause, ChevronDown } from "lucide-react";
import { DatasetFrame } from "@/data/monitorDatasets";

interface Props {
  frame: DatasetFrame;
  currentIndex: number;
  totalFrames: number;
  viewMode: "raw" | "waternet";
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: number) => void;
  videoUrl?: string;
}

const SPEEDS = [0.5, 1, 2];

const DatasetFrameView = ({
  frame,
  currentIndex,
  totalFrames,
  viewMode,
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onSeek,
  onSpeedChange,
  videoUrl,
}: Props) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.play();
    else videoRef.current.pause();
  }, [isPlaying]);

  // Sync playback speed
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setVideoCurrentTime(t);
  };

  // Simulated time based on 2s per frame at 1x (for sample datasets)
  const currentTime = currentIndex * 2;
  const totalTime = (totalFrames - 1) * 2;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-card rounded-xl">
      {/* Frame / Video area */}
      <div className="relative bg-ocean-deep aspect-video overflow-hidden rounded-t-xl">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain cursor-pointer"
            onClick={onPlayPause}
            onTimeUpdate={() => setVideoCurrentTime(videoRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setVideoDuration(videoRef.current?.duration ?? 0)}
            onEnded={() => onPlayPause()}
          />
        ) : (
          <>
            <div
              className={`w-full h-full flex items-center justify-center transition-all ${
                viewMode === "raw"
                  ? "bg-gradient-to-b from-muted/80 via-muted to-muted/60 grayscale"
                  : "bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface/30"
              }`}
            >
              {viewMode === "waternet" && frame.detections.length > 0 && (
                <p className="absolute bottom-3 left-3 text-[11px] text-muted-foreground/70 font-mono z-10">
                  Hover over boxes to see species
                </p>
              )}
            </div>

            {/* Bounding boxes overlay — only in WaterNet mode */}
            {viewMode === "waternet" &&
              frame.detections.map((det, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-primary/70 rounded-sm cursor-pointer transition-colors hover:border-primary"
                  style={{
                    left: `${det.boundingBox.x}%`,
                    top: `${det.boundingBox.y}%`,
                    width: `${det.boundingBox.w}%`,
                    height: `${det.boundingBox.h}%`,
                  }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {hoveredIdx === i && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm border border-border/50 text-foreground px-2 py-1 rounded text-[11px] font-mono whitespace-nowrap z-10 shadow-lg">
                      {det.commonName} · {det.confidence}%
                    </div>
                  )}
                </div>
              ))}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-border/30 flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Seek bar */}
        {videoUrl ? (
          <input
            type="range"
            min={0}
            max={videoDuration}
            step={0.1}
            value={videoCurrentTime}
            onChange={handleVideoSeek}
            className="flex-1 h-1 accent-primary cursor-pointer"
          />
        ) : (
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={currentIndex}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 h-1 accent-primary cursor-pointer"
          />
        )}

        {/* Time counter */}
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
          {videoUrl
            ? `${formatTime(videoCurrentTime)} / ${formatTime(videoDuration)}`
            : `${formatTime(currentTime)} / ${formatTime(totalTime)}`}
        </span>

        {/* Speed control */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-secondary/30"
          >
            {playbackSpeed}x
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-full mb-1 right-0 bg-background border border-border/50 rounded-lg shadow-lg overflow-hidden z-20">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onSpeedChange(s);
                    setShowSpeedMenu(false);
                  }}
                  className={`block w-full px-4 py-1.5 text-xs font-mono text-left hover:bg-secondary/50 transition-colors ${
                    s === playbackSpeed ? "text-primary" : "text-foreground"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasetFrameView;
