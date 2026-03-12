import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function LLMInterpretation({ text }: { text: string }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-border/50">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">AI Ecological Interpretation</h2>
          <p className="text-xs text-muted-foreground">Generated from biodiversity indices using LLM analysis</p>
        </div>
      </div>
      <div className="p-5 prose prose-sm prose-invert max-w-none
        prose-headings:text-foreground
        prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2
        prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-primary
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-strong:text-foreground
        prose-li:text-muted-foreground
        prose-ol:text-muted-foreground
        prose-ul:text-muted-foreground">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
