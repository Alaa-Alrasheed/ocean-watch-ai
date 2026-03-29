import { biodiversityIndices, computeBiodiversityScore } from "@/data/marineData";

export function BiodiversityScore() {
  const score = computeBiodiversityScore(biodiversityIndices);

  const getStatus = (s: number) => {
    if (s >= 75) return { label: "Healthy", color: "text-bioluminescent", bg: "bg-bioluminescent/10", ring: "ring-bioluminescent/30" };
    if (s >= 50) return { label: "Moderate", color: "text-sand", bg: "bg-sand/10", ring: "ring-sand/30" };
    return { label: "Stressed", color: "text-destructive", bg: "bg-destructive/10", ring: "ring-destructive/30" };
  };

  const status = getStatus(score);

  // Circumference for the ring (radius = 54)
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center gap-4">
      <h3 className="font-mono text-sm text-muted-foreground tracking-wide uppercase">
        Composite Biodiversity Score
      </h3>

      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.color} ${status.bg} ring-1 ${status.ring}`}>
        {status.label}
      </span>

      <p className="text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
        Weighted composite of Species Richness, Shannon, Simpson &amp; Pielou indices
      </p>
    </div>
  );
}
