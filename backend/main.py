from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

import metrics as m
from file_parser import parse_stories, parse_tasks
import data_store as store


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="IceScrum Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _date_to_ms(date_str: Optional[str]) -> Optional[int]:
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return int(datetime.strptime(date_str, fmt).timestamp() * 1000)
        except ValueError:
            continue
    return None


@app.post("/api/upload")
async def upload_files(
    stories_file: UploadFile = File(...),
    tasks_file: UploadFile = File(...),
    sprint_name: str = Form("Sprint"),
    sprint_start: Optional[str] = Form(None),
    sprint_end: Optional[str] = Form(None),
):
    """Upload stories and tasks CSV files, compute sprint metrics."""
    try:
        stories_content = await stories_file.read()
        tasks_content = await tasks_file.read()

        stories = parse_stories(stories_content, stories_file.filename or "")
        tasks = parse_tasks(tasks_content, tasks_file.filename or "")

        sprint = {
            "id": 1,
            "goal": sprint_name,
            "orderNumber": 1,
            "startDate": _date_to_ms(sprint_start),
            "endDate": _date_to_ms(sprint_end),
        }

        metrics_result = m.sprint_health(sprint, stories, tasks)
        store.set_data(sprint, stories, tasks, metrics_result)

        return {
            "success": True,
            "metrics": metrics_result,
            "counts": {"stories": len(stories), "tasks": len(tasks)},
        }
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, f"Erreur lors du traitement: {e}")


@app.get("/api/data/status")
def data_status():
    """Check if data is currently loaded."""
    data = store.get_data()
    if not data:
        return {"loaded": False}
    return {
        "loaded": True,
        "sprint_name": data["sprint"].get("goal", "Sprint"),
        "stories_count": len(data["stories"]),
        "tasks_count": len(data["tasks"]),
    }


@app.get("/api/data/raw")
def data_raw():
    """Debug: return raw parsed stories and tasks."""
    data = store.get_data()
    if not data:
        raise HTTPException(404, "Aucune donnée chargée. Veuillez importer des fichiers.")
    return {"stories": data["stories"], "tasks": data["tasks"]}


@app.get("/api/metrics")
def get_metrics():
    """Return metrics for the currently loaded data."""
    data = store.get_data()
    if not data:
        raise HTTPException(404, "Aucune donnée chargée. Veuillez importer des fichiers.")
    return data["metrics"]


@app.delete("/api/data")
def clear_data():
    """Clear all loaded data."""
    store.clear_data()
    return {"success": True}