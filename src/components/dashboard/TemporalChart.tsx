import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DetectionEvent } from "@/data/marineData";

export function TemporalChart({ data }: { data: DetectionEvent[] }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-lg font-semibold mb-1">Detection Activity</h2>
      <p className="text-sm text-muted-foreground mb-4">Species and individuals detected over time</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorIndividuals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSpecies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(12, 80%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(12, 80%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 25%, 18%)" />
            <XAxis dataKey="timestamp" stroke="hsl(210, 15%, 55%)" fontSize={12} />
            <YAxis stroke="hsl(210, 15%, 55%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "hsl(216, 35%, 10%)",
                border: "1px solid hsl(216, 25%, 18%)",
                borderRadius: "8px",
                color: "hsl(195, 60%, 90%)",
                fontSize: "13px",
              }}
            />
            <Area type="monotone" dataKey="totalIndividuals" stroke="hsl(174, 72%, 50%)" fill="url(#colorIndividuals)" strokeWidth={2} name="Individuals" />
            <Area type="monotone" dataKey="speciesCount" stroke="hsl(12, 80%, 60%)" fill="url(#colorSpecies)" strokeWidth={2} name="Species" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
