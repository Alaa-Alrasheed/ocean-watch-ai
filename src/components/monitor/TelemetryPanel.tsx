import { Zap } from "lucide-react";

interface Props {
  fps: number;
  inferenceMs: number;
  vram: number;
  detectionCount: number;
}

const TelemetryPanel = ({ fps, inferenceMs, vram, detectionCount }: Props) => {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 uppercase tracking-wider text-muted-foreground">
        <Zap className="w-4 h-4" /> Frame Telemetry
      </h3>
      <div className="space-y-4">
        {[
          { label: "Inference FPS", value: fps.toFixed(1), unit: "" },
          { label: "Inference Time", value: inferenceMs.toString(), unit: "ms" },
          { label: "VRAM Usage", value: vram.toFixed(2), unit: "GB" },
          { label: "Detections", value: detectionCount.toString(), unit: "" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-xl font-bold font-mono text-primary">
              {item.value}
              {item.unit && <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TelemetryPanel;
