import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { FishSpecies } from "@/data/marineData";

// Fixed order, never cycled: the 7 most abundant species get a hue each and the rest fold into a
// neutral "Other". Checked with the dataviz palette validator against the dark panel (all pass).
const COLORS = ["#10a49e", "#d2643c", "#4a79c6", "#b2912e", "#9d56ad", "#399d57", "#5c5fac"];
const OTHER = "#6a7a8b";

export function SpeciesChart({ species }: { species: FishSpecies[] }) {
  const top = species.slice(0, COLORS.length);
  const rest = species.slice(COLORS.length);
  const data = [
    ...top.map((s, i) => ({ name: s.name, value: s.count, share: s.percentage, color: COLORS[i] })),
    ...(rest.length
      ? [{
          name: `Other (${rest.length} species)`,
          value: rest.reduce((n, s) => n + s.count, 0),
          share: Math.round(rest.reduce((n, s) => n + s.percentage, 0) * 10) / 10,
          color: OTHER,
        }]
      : []),
  ];
  const isCompact = data.length <= 5;

  return (
    <div className="panel p-5">
      <h2 className="font-display text-2xl">Composition</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">Share of all individuals counted, by species</p>
      {data.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
          No positive species counts are available for this dataset.
        </div>
      ) : (
        <div className={isCompact ? "h-[210px]" : "h-[260px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={isCompact ? 50 : 66}
                outerRadius={isCompact ? 84 : 110}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={2}
                animationDuration={900}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => [`${value} (${item.payload.share}%)`, item.payload.name]}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                  fontSize: "13px",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className={`truncate text-muted-foreground ${d.color === OTHER ? "" : "italic"}`}>{d.name}</span>
            <span className="ml-auto font-mono tabular-nums text-foreground/80">{d.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
