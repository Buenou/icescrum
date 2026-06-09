import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import SprintMetricsPanel from "../components/SprintMetricsPanel";
import { Upload, RefreshCw } from "lucide-react";

export default function HomePage() {
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["data-status"],
    queryFn: api.getDataStatus,
  });

  const { data: metrics, isFetching, refetch } = useQuery({
    queryKey: ["metrics"],
    queryFn: api.getMetrics,
    enabled: status?.loaded === true,
    staleTime: Infinity,
  });

  if (statusLoading) {
    return <div className="text-center mt-20 text-gray-500">Chargement...</div>;
  }

  if (!status?.loaded) {
    return (
      <div className="max-w-lg mx-auto text-center mt-20">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <Upload size={40} className="text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Aucune donnée chargée</h2>
          <p className="text-gray-500 text-sm mb-6">
            Importez vos fichiers CSV pour commencer l'analyse du sprint.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Upload size={16} />
            Importer des fichiers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{status.sprint_name}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {status.stories_count} US · {status.tasks_count} tâches
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/upload"
            className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Upload size={14} />
            Nouveau fichier
          </Link>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {metrics && <SprintMetricsPanel data={metrics} />}

      {!metrics && !isFetching && (
        <p className="text-gray-500 text-center mt-20">Cliquez sur Actualiser pour charger les métriques.</p>
      )}
    </div>
  );
}