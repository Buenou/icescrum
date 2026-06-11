import csv
import io
import re
from datetime import datetime
from typing import Any, Optional

STORY_FIELD_ALIASES: dict[str, list[str]] = {
    "id":          ["uid", "id", "story_id", "us_id", "num", "#"],
    "name":        ["name", "title", "subject", "libelle", "nom"],
    "state":       ["state", "status", "etat", "état"],
    "effort":      ["effort", "points", "story_points", "estimation", "pts", "sp"],
    "lastUpdated": [
        "lastupdated", "last_updated", "updated_at", "updatedate",
        "datemodified", "modifieddate", "date_modification",
    ],
    "sprint":      ["sprint", "sprint_id", "sprint_name", "sprintid"],
}

TASK_FIELD_ALIASES: dict[str, list[str]] = {
    "id":          ["uid", "id", "task_id", "num", "#"],
    "name":        ["name", "title", "subject", "libelle", "nom"],
    "state":       ["state", "status", "etat", "état"],
    "estimation":  ["estimation", "remaining", "remaining_time", "reste", "restant"],
    "spent":       ["spent", "time_spent", "passe", "passé"],
    "lastUpdated": [
        "lastupdated", "last_updated", "updated_at", "updatedate",
        "datemodified", "modifieddate",
    ],
    "responsible": ["responsible", "assignee", "assigned_to", "responsable"],
    "parentStory": ["parentstory", "story_id", "us_id", "parent_story", "us", "us_num"],
}

STORY_STATE_MAP: dict[str, int] = {
    "-1": -1, "suggested": -1, "proposée": -1, "propose": -1,
    "0": 0, "accepted": 0, "acceptée": 0, "acceptee": 0,
    "1": 1, "estimated": 1, "estimée": 1, "estimee": 1,
    "2": 2, "planned": 2, "planifiée": 2, "planifiee": 2,
    "3": 3, "in_progress": 3, "inprogress": 3, "in progress": 3,
    "en_cours": 3, "en cours": 3, "encours": 3,
    "4": 4, "done": 4, "terminée": 4, "terminee": 4, "termine": 4,
    "finished": 4, "completed": 4, "fait": 4, "réalisée": 4, "realisee": 4,
    "7": 7, "icebox": 7,
}

TASK_STATE_MAP: dict[str, int] = {
    "0": 0, "todo": 0, "to_do": 0, "to do": 0,
    "à faire": 0, "a_faire": 0, "a faire": 0,
    "1": 1, "in_progress": 1, "inprogress": 1, "in progress": 1,
    "en_cours": 1, "en cours": 1, "encours": 1,
    "2": 2, "done": 2, "terminée": 2, "termine": 2,
    "finished": 2, "fait": 2, "réalisée": 2, "realisee": 2,
}


def _find_col(headers: list[str], aliases: list[str]) -> Optional[str]:
    headers_lower = [h.lower().strip() for h in headers]
    for alias in aliases:
        for i, h in enumerate(headers_lower):
            if h == alias or h.replace(" ", "_") == alias:
                return headers[i]
    return None


def _parse_date_to_ms(val: str) -> Optional[int]:
    if not val or not val.strip():
        return None
    val = val.strip()
    try:
        n = int(val)
        return n if n > 1_000_000_000_000 else n * 1000
    except ValueError:
        pass
    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y",
        "%m/%d/%Y",
    ]
    cleaned = val.split("+")[0].rstrip("Z").strip()
    for fmt in formats:
        try:
            return int(datetime.strptime(cleaned, fmt).timestamp() * 1000)
        except ValueError:
            continue
    return None


def _parse_state(val: Any, state_map: dict[str, int]) -> Optional[int]:
    if val is None:
        return None
    return state_map.get(str(val).strip().lower())


def _parse_num(val: Any) -> Optional[float]:
    if val is None or str(val).strip() == "":
        return None
    try:
        return float(str(val).strip().replace(",", "."))
    except ValueError:
        return None


def _read_csv(content: bytes) -> list[dict]:
    text = content.decode("utf-8-sig", errors="replace")
    sample = text[:2000]
    counts = {d: sample.count(d) for d in [",", ";", "\t", "|"]}
    delimiter = max(counts, key=lambda k: counts[k])
    return list(csv.DictReader(io.StringIO(text), delimiter=delimiter))


def _build_col_map(headers: list[str], aliases_map: dict[str, list[str]]) -> dict[str, Optional[str]]:
    return {field: _find_col(headers, aliases) for field, aliases in aliases_map.items()}


def parse_stories(content: bytes, filename: str = "") -> list[dict]:
    rows = _read_csv(content)
    if not rows:
        raise ValueError("Le fichier User Stories est vide ou illisible.")

    headers = list(rows[0].keys())
    col = _build_col_map(headers, STORY_FIELD_ALIASES)
    print(f"[parse_stories] headers={headers} col_map={col}")

    stories = []
    for i, row in enumerate(rows):
        raw_state = row.get(col["state"]) if col["state"] else None
        state = _parse_state(raw_state, STORY_STATE_MAP)

        raw_effort = row.get(col["effort"]) if col["effort"] else None
        effort = int(_parse_num(raw_effort) or 0)

        raw_date = row.get(col["lastUpdated"]) if col["lastUpdated"] else None
        last_updated = _parse_date_to_ms(raw_date) if raw_date else None

        stories.append({
            "id": row.get(col["id"], i) if col["id"] else i,
            "name": row.get(col["name"], f"US {i + 1}") if col["name"] else f"US {i + 1}",
            "state": state if state is not None else 0,
            "effort": effort,
            "lastUpdated": last_updated,
        })

    return stories


def parse_tasks(content: bytes, filename: str = "") -> list[dict]:
    rows = _read_csv(content)
    if not rows:
        raise ValueError("Le fichier Tâches est vide ou illisible.")

    headers = list(rows[0].keys())
    col = _build_col_map(headers, TASK_FIELD_ALIASES)
    print(f"[parse_tasks] headers={headers} col_map={col}")

    tasks = []
    for i, row in enumerate(rows):
        raw_state = row.get(col["state"]) if col["state"] else None
        state = _parse_state(raw_state, TASK_STATE_MAP)

        raw_resp = row.get(col["responsible"]) if col["responsible"] else None
        responsible = raw_resp if raw_resp and str(raw_resp).strip() else None

        raw_parent = row.get(col["parentStory"]) if col["parentStory"] else None
        if raw_parent and str(raw_parent).strip():
            m = re.match(r'^(\d+)', str(raw_parent).strip())
            parent_story = m.group(1) if m else str(raw_parent).strip()
        else:
            parent_story = None

        raw_date = row.get(col["lastUpdated"]) if col["lastUpdated"] else None
        last_updated = _parse_date_to_ms(raw_date) if raw_date else None

        tasks.append({
            "id": row.get(col["id"], i) if col["id"] else i,
            "name": row.get(col["name"], f"Tâche {i + 1}") if col["name"] else f"Tâche {i + 1}",
            "state": state if state is not None else 0,
            "responsible": responsible,
            "parentStory": parent_story,
            "lastUpdated": last_updated,
        })

    return tasks
