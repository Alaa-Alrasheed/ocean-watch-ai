import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export function DownloadReport() {
  const handleDownload = () => {
    toast({
      title: "Report Generated",
      description: "Full biodiversity assessment report is being prepared for download.",
    });
  };

  return (
    <div className="glass-card rounded-xl p-5 flex items-center justify-between">
      <div>
        <h3 className="font-semibold">Download Full Report</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Export complete biodiversity assessment with charts, indices, and AI interpretation as PDF
        </p>
      </div>
      <Button onClick={handleDownload} className="gap-2">
        <Download className="w-4 h-4" />
        Export PDF
      </Button>
    </div>
  );
}
