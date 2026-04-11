import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { FishSpecies } from "@/data/marineData";

const COLORS = [
  "hsl(174, 72%, 50%)",
  "hsl(174, 60%, 40%)",
  "hsl(195, 50%, 45%)",
  "hsl(210, 45%, 40%)",
  "hsl(12, 80%, 60%)",
  "hsl(12, 60%, 50%)",
  "hsl(38, 40%, 55%)",
  "hsl(150, 50%, 45%)",
  "hsl(216, 35%, 35%)",
  "hsl(195, 30%, 55%)",
];

export function SpeciesChart({ species }: { species: FishSpecies[] }) {
  const data = species.map((s) => ({ name: s.name, value: s.count }));

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-lg font-semibold mb-1">Species Composition</h2>
      <p className="text-sm text-muted-foreground mb-4">Relative abundance distribution</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(216, 35%, 10%)",
                border: "1px solid hsl(216, 25%, 18%)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
        {species.slice(0, 6).map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
            <span className="text-muted-foreground truncate">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
