import clsx from "clsx";

interface Props {
  onTrack: boolean | null;
}

export default function StatusBadge({ onTrack }: Props) {
  if (onTrack === null) return <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">N/A</span>;
  return (
    <span
      className={clsx(
        "text-xs px-2 py-0.5 rounded font-medium",
        onTrack ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"
      )}
    >
      {onTrack ? "Dans les temps" : "En retard"}
    </span>
  );
}
