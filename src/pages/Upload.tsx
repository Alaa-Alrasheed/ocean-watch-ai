import { useState } from "react";
import { Upload as UploadIcon, Video, FileUp, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Upload = () => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleProcess = () => {
    setProcessing(true);
    // Simulated processing
    setTimeout(() => setProcessing(false), 3000);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
          <p className="text-muted-foreground">
            Upload underwater footage for AI-powered species detection and biodiversity analysis.
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`glass-card p-12 text-center transition-all duration-300 cursor-pointer ${
            dragOver ? "border-primary/60 bg-primary/5 teal-glow" : "hover:border-primary/30"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            type="file"
            id="file-input"
            className="hidden"
            accept="video/*"
            onChange={handleFileSelect}
          />

          {file ? (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 text-primary mx-auto" />
              <div>
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
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

        {file && (
          <div className="mt-6 space-y-4">
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
};

export default Upload;
