const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export interface SprintSummary {
  id: number;
  name: string;
  start: string | null;
  end: string | null;
  remaining_days: number | null;
  elapsed_pct: number | null;
}

export interface StaleItem {
  id: number;
  name: string;
  days: number;
}

export interface SprintMetrics {
  sprint: SprintSummary;
  on_track: boolean | null;
  stories: {
    total: number;
    done: number;
    in_progress: number;
    total_pts: number;
    done_pts: number;
    remaining_pts: number;
    velocity_pct: number;
  };
  tasks: { total: number; done: number };
  stale_stories: StaleItem[];
  stale_tasks: StaleItem[];
  long_running_tasks: { id: number; name: string; responsible: string; story_id: string | null; story_name: string; days: number }[];
  burndown: { date: string; ideal: number }[];
}

export interface DataStatus {
  loaded: boolean;
  sprint_name?: string;
  stories_count?: number;
  tasks_count?: number;
}

export const api = {
  getDataStatus: () => get<DataStatus>("/data/status"),

  getMetrics: () => get<SprintMetrics>("/metrics"),

  uploadFiles: async (
    storiesFile: File,
    tasksFile: File,
    sprintName: string,
    sprintStart?: string,
    sprintEnd?: string,
  ): Promise<{ success: boolean; metrics: SprintMetrics; counts: { stories: number; tasks: number } }> => {
    const form = new FormData();
    form.append("stories_file", storiesFile);
    form.append("tasks_file", tasksFile);
    form.append("sprint_name", sprintName);
    if (sprintStart) form.append("sprint_start", sprintStart);
    if (sprintEnd) form.append("sprint_end", sprintEnd);

    const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Erreur ${res.status}`);
    }
    return res.json();
  },

  clearData: async (): Promise<void> => {
    const res = await fetch(`${BASE}/data`, { method: "DELETE" });
    if (!res.ok) throw new Error("Impossible de supprimer les données");
  },
};