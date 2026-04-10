import { useState } from "react";
import { Play, Pause, Image, ChevronDown } from "lucide-react";
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
}: Props) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Simulated time based on 2s per frame at 1x
  const currentTime = currentIndex * 2;
  const totalTime = (totalFrames - 1) * 2;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Frame with bounding boxes */}
      <div className="relative bg-ocean-deep aspect-video">
        <div
          className={`w-full h-full flex items-center justify-center transition-all ${
            viewMode === "raw"
              ? "bg-gradient-to-b from-muted/80 via-muted to-muted/60 grayscale"
              : "bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface/30"
          }`}
        >
          {frame.detections.length > 0 ? (
            <div className="text-center space-y-1">
              <div className="text-5xl">{frame.detections[0].icon}</div>
              <p className="text-xs text-muted-foreground font-mono">
                {viewMode === "raw" ? "Raw frame" : "WaterNet enhanced"}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-mono">No detections in this frame</p>
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
      </div>

      {/* Video player controls */}
      <div className="px-4 py-3 border-t border-border/30 flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={currentIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-1 accent-primary cursor-pointer"
        />

        {/* Time counter */}
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(totalTime)}
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
