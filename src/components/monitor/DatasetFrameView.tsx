import { Play, Pause, Image } from "lucide-react";
import { DatasetFrame } from "@/data/monitorDatasets";

interface Props {
  frame: DatasetFrame;
  currentIndex: number;
  totalFrames: number;
  viewMode: "raw" | "waternet";
}

const DatasetFrameView = ({ frame, currentIndex, totalFrames, viewMode }: Props) => {
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

      {/* Frame progress bar */}
      <div className="px-4 py-3 border-t border-border/30 flex items-center gap-3">
        <div className="flex gap-1 flex-1 justify-center">
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
    </div>
  );
};

export default DatasetFrameView;
