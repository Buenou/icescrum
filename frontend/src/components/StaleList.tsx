import { AlertTriangle } from "lucide-react";
import { StaleItem } from "../api/client";

interface Props {
  items: StaleItem[];
  label: string;
}

export default function StaleList({ items, label }: Props) {
  if (!items.length) return null;
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 text-yellow-400">
        <AlertTriangle size={14} />
        <span className="text-xs font-semibold uppercase tracking-wide">{label} sans activité</span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-300 truncate max-w-[70%]">{item.name}</span>
            <span className="text-yellow-500 shrink-0">{item.days}j</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
