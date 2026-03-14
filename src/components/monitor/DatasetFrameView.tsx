import { ChevronLeft, ChevronRight, Play, Pause, Image } from "lucide-react";
import { DatasetFrame } from "@/data/monitorDatasets";

interface Props {
  frame: DatasetFrame;
  currentIndex: number;
  totalFrames: number;
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}

const DatasetFrameView = ({ frame, currentIndex, totalFrames, isPlaying, onPrev, onNext, onTogglePlay }: Props) => {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2 text-sm">
          <Image className="w-4 h-4 text-primary" />
          <span className="font-medium">Frame {currentIndex + 1} / {totalFrames}</span>
          <span className="text-muted-foreground font-mono text-xs ml-2">{frame.timestamp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {frame.detections.length} detection{frame.detections.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Frame with bounding boxes */}
      <div className="relative bg-ocean-deep aspect-video">
        <div className="w-full h-full bg-gradient-to-b from-ocean-deep via-ocean-mid to-ocean-surface/30 flex items-center justify-center">
          {frame.detections.length > 0 ? (
            <div className="text-center space-y-1">
              <div className="text-5xl">{frame.detections[0].icon}</div>
              <p className="text-xs text-muted-foreground font-mono">Analyzed frame</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-mono">No detections in this frame</p>
          )}
        </div>

        {/* Bounding boxes overlay */}
        {frame.detections.map((det, i) => (
          <div
            key={i}
            className="absolute border-2 border-primary/70 rounded-sm"
            style={{
              left: `${det.boundingBox.x}%`,
              top: `${det.boundingBox.y}%`,
              width: `${det.boundingBox.w}%`,
              height: `${det.boundingBox.h}%`,
            }}
          >
            <div className="absolute -top-5 left-0 bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">
              {det.commonName} {det.confidence}%
            </div>
          </div>
        ))}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-secondary/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Auto-play"}
          </button>

          {/* Frame progress */}
          <div className="flex gap-1">
            {Array.from({ length: totalFrames }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-primary" : i < currentIndex ? "bg-primary/40" : "bg-secondary/40"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === totalFrames - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-secondary/30 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DatasetFrameView;
