import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client";
import SprintMetricsPanel from "../components/SprintMetricsPanel";
import { ArrowLeft, RefreshCw, ChevronDown } from "lucide-react";

export default function ProjectPage() {
  const { key } = useParams<{ key: string }>();
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);

  const { data: sprints } = useQuery({
    queryKey: ["sprints", key],
    queryFn: () => api.getSprints(key!),
    staleTime: Infinity,
  });

  const queryKey = selectedSprintId
    ? ["sprint-metrics", key, selectedSprintId]
    : ["current-sprint-metrics", key];

  const queryFn = selectedSprintId
    ? () => api.getSprintMetrics(key!, selectedSprintId)
    : () => api.getCurrentSprintMetrics(key!);

  const { data, isFetching, refetch, error } = useQuery({
    queryKey,
    queryFn,
    staleTime: Infinity,
    enabled: false,
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold flex-1">Projet <span className="text-indigo-400">{key}</span></h1>

        {/* Sprint selector */}
        {sprints && sprints.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-1.5 pr-8 text-gray-300 focus:outline-none focus:border-indigo-500"
              value={selectedSprintId ?? ""}
              onChange={(e) => setSelectedSprintId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Sprint actif</option>
              {[...sprints].reverse().map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.goal || `Sprint ${s.orderNumber}`}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" />
          </div>
        )}

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 text-sm">
          Impossible de charger les métriques. Vérifiez que le projet <strong>{key}</strong> existe.
        </div>
      )}

      {data && <SprintMetricsPanel data={data} />}

      {!data && !error && !isFetching && (
        <p className="text-gray-500 text-center mt-20">Cliquez sur Actualiser pour charger le sprint.</p>
      )}
    </div>
  );
}
