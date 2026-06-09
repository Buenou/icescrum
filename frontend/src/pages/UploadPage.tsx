import { useState, useRef, DragEvent, RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [storiesFile, setStoriesFile] = useState<File | null>(null);
  const [tasksFile, setTasksFile] = useState<File | null>(null);
  const [sprintName, setSprintName] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storiesRef = useRef<HTMLInputElement>(null);
  const tasksRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!storiesFile || !tasksFile) {
      setError("Veuillez sélectionner les deux fichiers.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.uploadFiles(
        storiesFile,
        tasksFile,
        sprintName || "Sprint",
        sprintStart || undefined,
        sprintEnd || undefined,
      );
      qc.invalidateQueries({ queryKey: ["data-status"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      navigate("/");
    } catch (e: any) {
      setError(e.message || "Erreur lors du traitement des fichiers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Importer des données</h1>
      <p className="text-gray-500 text-sm mb-8">
        Importez vos fichiers CSV exportés depuis IceScrum pour analyser les métriques du sprint.
      </p>

      {/* Sprint info */}
      <section className="bg-gray-900 rounded-xl p-5 mb-4 border border-gray-800">
        <h2 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-widest">
          Informations du sprint
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom du sprint</label>
            <input
              type="text"
              placeholder="ex: Sprint 12"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Début <span className="text-gray-700">(optionnel)</span>
            </label>
            <input
              type="date"
              value={sprintStart}
              onChange={(e) => setSprintStart(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Fin <span className="text-gray-700">(optionnel)</span>
            </label>
            <input
              type="date"
              value={sprintEnd}
              onChange={(e) => setSprintEnd(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </section>

      {/* File dropzones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <DropZone
          label="User Stories"
          hint="Fichier CSV des US"
          file={storiesFile}
          onFile={setStoriesFile}
          inputRef={storiesRef}
          accentColor="indigo"
        />
        <DropZone
          label="Tâches"
          hint="Fichier CSV des tâches"
          file={tasksFile}
          onFile={setTasksFile}
          inputRef={tasksRef}
          accentColor="purple"
        />
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-3 text-sm mb-4 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !storiesFile || !tasksFile}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="animate-pulse">Analyse en cours...</span>
        ) : (
          <>
            <Upload size={16} />
            Analyser les données
          </>
        )}
      </button>
    </div>
  );
}

function DropZone({
  label,
  hint,
  file,
  onFile,
  inputRef,
  accentColor,
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (f: File) => void;
  inputRef: RefObject<HTMLInputElement>;
  accentColor: "indigo" | "purple";
}) {
  const [dragging, setDragging] = useState(false);

  const accent =
    accentColor === "indigo"
      ? { border: "border-indigo-600", bg: "bg-indigo-950/30", icon: "text-indigo-400" }
      : { border: "border-purple-600", bg: "bg-purple-950/30", icon: "text-purple-400" };

  const baseClass = [
    "relative border-2 rounded-xl p-6 cursor-pointer transition-all text-center select-none",
    file
      ? "border-green-700 bg-green-950/20"
      : dragging
      ? `${accent.border} ${accent.bg}`
      : "border-gray-700 hover:border-gray-600 bg-gray-900",
  ].join(" ");

  return (
    <div
      className={baseClass}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {file ? (
        <>
          <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-400 truncate">{file.name}</p>
          <p className="text-xs text-gray-600 mt-1">Cliquer pour changer</p>
        </>
      ) : (
        <>
          <FileText size={28} className={`${accent.icon} mx-auto mb-2`} />
          <p className="font-semibold text-sm text-white">{label}</p>
          <p className="text-xs text-gray-500 mt-1">{hint}</p>
          <p className="text-xs text-gray-700 mt-3">Glissez-déposez ou cliquez</p>
        </>
      )}
    </div>
  );
}