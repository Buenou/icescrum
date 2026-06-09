import clsx from "clsx";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "green" | "red" | "yellow";
}

const colors = {
  default: "text-white",
  green: "text-emerald-400",
  red: "text-red-400",
  yellow: "text-yellow-400",
};

export default function StatCard({ label, value, sub, color = "default" }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={clsx("text-2xl font-bold", colors[color])}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}
