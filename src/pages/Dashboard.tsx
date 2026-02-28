import { Fish, TrendingUp, Activity, Droplets, BarChart3, Brain } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";

const speciesData = [
  { name: "Chaetodon melapterus", family: "Chaetodontidae", count: 24, confidence: 94 },
  { name: "Abudefduf vaigiensis", family: "Pomacentridae", count: 18, confidence: 91 },
  { name: "Acanthurus sohal", family: "Acanthuridae", count: 15, confidence: 88 },
  { name: "Lutjanus kasmira", family: "Lutjanidae", count: 12, confidence: 92 },
  { name: "Epinephelus coioides", family: "Serranidae", count: 8, confidence: 85 },
];

const familyDistribution = [
  { name: "Chaetodontidae", value: 30 },
  { name: "Pomacentridae", value: 25 },
  { name: "Acanthuridae", value: 18 },
  { name: "Lutjanidae", value: 15 },
  { name: "Serranidae", value: 12 },
];

const COLORS = [
  "hsl(168 60% 36%)",
  "hsl(190 80% 45%)",
  "hsl(16 80% 60%)",
  "hsl(38 50% 70%)",
  "hsl(210 50% 50%)",
];

const trendsData = [
  { month: "Sep", shannon: 2.1, simpson: 0.78 },
  { month: "Oct", shannon: 2.3, simpson: 0.81 },
  { month: "Nov", shannon: 2.0, simpson: 0.76 },
  { month: "Dec", shannon: 2.4, simpson: 0.83 },
  { month: "Jan", shannon: 2.6, simpson: 0.85 },
  { month: "Feb", shannon: 2.5, simpson: 0.84 },
];

const metrics = [
  { label: "Species Detected", value: "23", icon: Fish, color: "text-primary" },
  { label: "Shannon Index", value: "2.51", icon: BarChart3, color: "text-ocean-glow" },
  { label: "Simpson Index", value: "0.84", icon: Activity, color: "text-coral" },
  { label: "Total Individuals", value: "187", icon: Droplets, color: "text-sand" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold">Biodiversity Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Fujairah Coral Reef — Survey: Feb 2026
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary">Ecosystem: Moderate Health</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</span>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="text-3xl font-bold font-mono">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Species Table */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Fish className="w-5 h-5 text-primary" /> Detected Species
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 text-muted-foreground font-medium">Species</th>
                    <th className="text-left py-3 text-muted-foreground font-medium">Family</th>
                    <th className="text-right py-3 text-muted-foreground font-medium">Count</th>
                    <th className="text-right py-3 text-muted-foreground font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {speciesData.map((s, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-mono text-xs italic">{s.name}</td>
                      <td className="py-3 text-muted-foreground">{s.family}</td>
                      <td className="py-3 text-right font-mono">{s.count}</td>
                      <td className="py-3 text-right">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                          s.confidence >= 90
                            ? "bg-primary/15 text-primary"
                            : "bg-sand/15 text-sand"
                        }`}>
                          {s.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Family Distribution Pie */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Family Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={familyDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {familyDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(216 35% 10%)", border: "1px solid hsl(210 30% 18%)", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "hsl(195 60% 92%)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {familyDistribution.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{f.name}</span>
                  </div>
                  <span className="font-mono">{f.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trends */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ocean-glow" /> Biodiversity Trends
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendsData}>
                <defs>
                  <linearGradient id="shannonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168 60% 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(168 60% 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 18%)" />
                <XAxis dataKey="month" stroke="hsl(210 20% 55%)" fontSize={12} />
                <YAxis stroke="hsl(210 20% 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(216 35% 10%)", border: "1px solid hsl(210 30% 18%)", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "hsl(195 60% 92%)" }}
                />
                <Area type="monotone" dataKey="shannon" stroke="hsl(168 60% 36%)" fill="url(#shannonGrad)" strokeWidth={2} name="Shannon Index" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insights */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-coral" /> AI Ecological Insights
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-1">Ecosystem Status: Moderate</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Shannon-Wiener index of 2.51 indicates moderate species diversity. 
                  The reef supports a healthy Chaetodontidae population — typically a positive indicator of coral reef health.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-ocean-glow/5 border border-ocean-glow/20">
                <p className="text-sm font-medium text-ocean-glow mb-1">Key Observation</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Butterflyfish dominance (30%) suggests available coral cover for feeding. However, low predator presence 
                  (Serranidae at 12%) may indicate overfishing pressure in this area.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-coral/5 border border-coral/20">
                <p className="text-sm font-medium text-coral mb-1">Recommendation</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Increase survey frequency during summer months to monitor thermal stress effects. 
                  Consider comparing with protected reef zones in Fujairah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
