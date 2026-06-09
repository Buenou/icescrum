import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface Props {
  data: { date: string; ideal: number }[];
  totalPts: number;
}

export default function BurndownChart({ data, totalPts }: Props) {
  if (!data.length) return <p className="text-gray-500 text-sm">Pas de données burndown.</p>;

  const today = new Date().toISOString().split("T")[0];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          tickFormatter={(d) => d.slice(5)}
        />
        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} domain={[0, totalPts]} />
        <Tooltip
          contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
          labelStyle={{ color: "#9ca3af" }}
          itemStyle={{ color: "#a5b4fc" }}
        />
        <ReferenceLine x={today} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Auj.", fill: "#f59e0b", fontSize: 10 }} />
        <Line type="monotone" dataKey="ideal" stroke="#6366f1" strokeWidth={2} dot={false} name="Idéal" />
      </LineChart>
    </ResponsiveContainer>
  );
}
