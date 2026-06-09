import httpx
from config import settings
from typing import Any

# IceScrum v7 REST API v2 base path
BASE = f"{settings.icescrum_url.rstrip('/')}/ws"

HEADERS = {
    "Authorization": f"Bearer {settings.icescrum_token}",
    "Accept": "application/json",
}


async def _get(path: str, params: dict = None) -> Any:
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(f"{BASE}{path}", headers=HEADERS, params=params or {})
        r.raise_for_status()
        return r.json()


async def get_projects() -> list[dict]:
    return await _get("/project")


async def get_project(project_key: str) -> dict:
    return await _get(f"/project/{project_key}")


async def get_sprints(project_key: str) -> list[dict]:
    return await _get(f"/project/{project_key}/sprint")


async def get_sprint(project_key: str, sprint_id: int) -> dict:
    return await _get(f"/project/{project_key}/sprint/{sprint_id}")


async def get_stories(project_key: str, sprint_id: int | None = None) -> list[dict]:
    params = {"sprint": sprint_id} if sprint_id else {}
    return await _get(f"/project/{project_key}/story", params)


async def get_tasks(project_key: str, sprint_id: int | None = None) -> list[dict]:
    params = {"sprint": sprint_id} if sprint_id else {}
    return await _get(f"/project/{project_key}/task", params)
