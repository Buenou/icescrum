import { SprintMetrics } from "../api/client";
import StatCard from "./StatCard";
import StatusBadge from "./StatusBadge";
import BurndownChart from "./BurndownChart";
import StaleList from "./StaleList";
import { Clock, CheckSquare, AlertCircle } from "lucide-react";

interface Props {
  data: SprintMetrics;
}

export default function SprintMetricsPanel({ data }: Props) {
  const { sprint, on_track, stories, tasks, stale_stories, stale_tasks, unassigned_tasks, burndown } = data;

  const endDate = sprint.end ? new Date(sprint.end).toLocaleDateString("fr-FR") : "—";

  return (
    <div className="space-y-6">
      {/* Header sprint */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{sprint.name}</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
            <Clock size={12} /> Fin le {endDate}
            {sprint.remaining_days !== null && (
              <span className="ml-2 text-gray-400">— {sprint.remaining_days}j restants</span>
            )}
          </p>
        </div>
        <StatusBadge onTrack={on_track} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Vélocité"
          value={`${stories.velocity_pct}%`}
          sub={`${stories.done_pts} / ${stories.total_pts} pts`}
          color={stories.velocity_pct >= (sprint.elapsed_pct ?? 50) ? "green" : "red"}
        />
        <StatCard
          label="US terminées"
          value={`${stories.done} / ${stories.total}`}
          sub={`${stories.in_progress} en cours`}
        />
        <StatCard
          label="Tâches"
          value={`${tasks.done} / ${tasks.total}`}
          sub="terminées"
          color={tasks.total > 0 && tasks.done === tasks.total ? "green" : "default"}
        />
        <StatCard
          label="Points restants"
          value={stories.remaining_pts}
          sub="story points"
          color={on_track === false ? "red" : "default"}
        />
      </div>

      {/* Progression bar */}
      {sprint.elapsed_pct !== null && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Avancement sprint</span>
            <span>{sprint.elapsed_pct}% écoulé</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${sprint.elapsed_pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Début</span>
            <span>Fin</span>
          </div>
        </div>
      )}

      {/* Burndown */}
      <div className="bg-gray-900 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Burndown (ligne idéale)</p>
        <BurndownChart data={burndown} totalPts={stories.total_pts} />
      </div>

      {/* Stale items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StaleList items={stale_stories} label="US" />
        <StaleList items={stale_tasks} label="Tâches" />
      </div>

      {/* Unassigned tasks */}
      {unassigned_tasks.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-orange-400">
            <AlertCircle size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Tâches non assignées ({unassigned_tasks.length})
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                <th className="text-left pb-2 pr-3 font-medium w-16">ID</th>
                <th className="text-left pb-2 pr-3 font-medium">Tâche</th>
                <th className="text-left pb-2 font-medium">Story parente</th>
              </tr>
            </thead>
            <tbody>
              {unassigned_tasks.map((t) => (
                <tr key={t.id} className="border-b border-gray-800 last:border-0">
                  <td className="py-1.5 pr-3 text-gray-500 font-mono">#{t.id}</td>
                  <td className="py-1.5 pr-3 text-gray-300">{t.name}</td>
                  <td className="py-1.5 text-gray-400 italic">{t.story_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
