import { Link } from "react-router-dom";
import { ArrowRight, Fish, BarChart3, Brain, Video, Waves, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-ocean.jpg";

const features = [
  {
    icon: Video,
    title: "Video Analysis",
    desc: "Upload underwater footage and let our AI detect and track fish species in real-time.",
  },
  {
    icon: Fish,
    title: "Species Classification",
    desc: "Three-stage deep learning identifies Family, Genus, and Species with confidence scores.",
  },
  {
    icon: BarChart3,
    title: "Biodiversity Indices",
    desc: "Shannon-Wiener, Simpson, and species richness indices computed automatically.",
  },
  {
    icon: Brain,
    title: "AI Insights",
    desc: "LLM-powered ecological interpretation explains ecosystem health in plain language.",
  },
  {
    icon: Waves,
    title: "Fujairah Marine Data",
    desc: "Focused on the marine ecosystem of Fujairah, UAE — coral reefs and coastal waters.",
  },
  {
    icon: Shield,
    title: "Conservation Impact",
    desc: "Track changes over time to support marine conservation and policy decisions.",
  },
];

const Index = () => {
  const { user } = useAuth();
  const ctaTo = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "Open Dashboard" : "Get Started";

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Coral reef with tropical fish" className="w-full h-full object-cover" />
          <div className="absolute inset-0 ocean-gradient opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8 animate-pulse-slow">
            <Fish className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-primary">Marine Biodiversity AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Decode the Ocean's{" "}
            <span className="text-gradient-ocean">Biodiversity</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered framework for analyzing underwater video from Fujairah's marine ecosystem.
            Detect species, compute biodiversity indices, and generate ecological insights.
          </p>

          <div className="flex justify-center">
            <Link to={ctaTo}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8 teal-glow">
                {ctaLabel} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg viewBox="0 0 1440 120" className="w-full h-auto" preserveAspectRatio="none">
            <path
              d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,90 1440,60 L1440,120 L0,120 Z"
              fill="hsl(216 40% 7%)"
            />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="text-gradient-ocean">BioReef</span> Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From raw underwater video to actionable ecological intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:teal-glow transition-shadow duration-300">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to assess marine health?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Start analyzing underwater footage and generating biodiversity reports in minutes.
              </p>
              <Link to={ctaTo}>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 teal-glow">
                  {ctaLabel} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Fish className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-muted-foreground">BioReef.ai — Fujairah Marine Ecosystem</span>
          </div>
          <p className="text-xs text-muted-foreground">AI-Based Fish Biodiversity Assessment Framework</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
