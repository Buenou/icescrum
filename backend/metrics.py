from datetime import datetime, timezone
from typing import Any

# IceScrum story states
STORY_STATES = {
    -1: "suggested", 0: "accepted", 1: "estimated", 2: "planned",
    3: "in_progress", 4: "done", 7: "icebox",
}
# IceScrum task states
TASK_STATES = {0: "todo", 1: "in_progress", 2: "done"}

STALE_DAYS = 3  # days without activity to flag as stale


def _days_since(ts_ms: int | None) -> float | None:
    if not ts_ms:
        return None
    updated = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
    return (datetime.now(tz=timezone.utc) - updated).total_seconds() / 86400


def sprint_health(sprint: dict, stories: list[dict], tasks: list[dict]) -> dict:
    now = datetime.now(tz=timezone.utc)

    start_ts = sprint.get("startDate")
    end_ts = sprint.get("endDate")
    start = datetime.fromtimestamp(start_ts / 1000, tz=timezone.utc) if start_ts else None
    end = datetime.fromtimestamp(end_ts / 1000, tz=timezone.utc) if end_ts else None

    total_days = (end - start).days if start and end else None
    elapsed_days = (now - start).days if start else None
    remaining_days = (end - now).days if end else None
    progress_pct = round(elapsed_days / total_days * 100) if total_days else None

    # Stories breakdown
    total_stories = len(stories)
    done_stories = sum(1 for s in stories if s.get("state") == 4)
    in_progress_stories = sum(1 for s in stories if s.get("state") == 3)

    # Velocity: story points
    total_pts = sum(s.get("effort", 0) or 0 for s in stories)
    done_pts = sum(s.get("effort", 0) or 0 for s in stories if s.get("state") == 4)
    remaining_pts = total_pts - done_pts
    velocity_pct = round(done_pts / total_pts * 100) if total_pts else 0

    # Is sprint on track? Compare % done pts vs % elapsed time
    on_track: bool | None = None
    if progress_pct is not None and total_pts > 0:
        on_track = velocity_pct >= (progress_pct - 10)  # 10pt tolerance

    # Stale stories: in progress but no recent activity
    stale_stories = [
        {"id": s["id"], "name": s.get("name"), "days": round(_days_since(s.get("inProgressDate") or s.get("lastUpdated")) or 0)}
        for s in stories
        if s.get("state") == 3 and (_days_since(s.get("inProgressDate") or s.get("lastUpdated")) or 0) > STALE_DAYS
    ]

    # Tasks breakdown
    total_tasks = len(tasks)
    done_tasks = sum(1 for t in tasks if t.get("state") == 2)
    stale_tasks = [
        {"id": t["id"], "name": t.get("name"), "days": round(_days_since(t.get("inProgressDate") or t.get("lastUpdated")) or 0)}
        for t in tasks
        if t.get("state") == 1 and (_days_since(t.get("inProgressDate") or t.get("lastUpdated")) or 0) > STALE_DAYS
    ]
    story_lookup = {str(s["id"]): s.get("name", f"US {s['id']}") for s in stories}

    # Tasks in progress for more than 2 days
    long_running_tasks = [
        {
            "id": t["id"],
            "name": t.get("name"),
            "responsible": t.get("responsible") or "—",
            "story_id": t.get("parentStory"),
            "story_name": story_lookup.get(str(t.get("parentStory", "")), "—") if t.get("parentStory") else "—",
            "days": round(_days_since(t.get("inProgressDate") or t.get("lastUpdated")) or 0),
        }
        for t in tasks
        if t.get("state") == 1 and (_days_since(t.get("inProgressDate") or t.get("lastUpdated")) or 0) > 2
    ]

    # Burndown points per day (simplified: done pts spread)
    burndown = _build_burndown(sprint, stories)

    return {
        "sprint": {
            "id": sprint["id"],
            "name": sprint.get("goal") or f"Sprint {sprint.get('orderNumber', '')}",
            "start": start.isoformat() if start else None,
            "end": end.isoformat() if end else None,
            "remaining_days": remaining_days,
            "elapsed_pct": progress_pct,
        },
        "on_track": on_track,
        "stories": {
            "total": total_stories,
            "done": done_stories,
            "in_progress": in_progress_stories,
            "total_pts": total_pts,
            "done_pts": done_pts,
            "remaining_pts": remaining_pts,
            "velocity_pct": velocity_pct,
        },
        "tasks": {
            "total": total_tasks,
            "done": done_tasks,
        },
        "stale_stories": stale_stories,
        "stale_tasks": stale_tasks,
        "long_running_tasks": long_running_tasks,
        "burndown": burndown,
    }


def _build_burndown(sprint: dict, stories: list[dict]) -> list[dict]:
    """Simplified burndown: ideal line vs remaining points by day."""
    start_ts = sprint.get("startDate")
    end_ts = sprint.get("endDate")
    if not start_ts or not end_ts:
        return []

    start = datetime.fromtimestamp(start_ts / 1000, tz=timezone.utc)
    end = datetime.fromtimestamp(end_ts / 1000, tz=timezone.utc)
    total_days = max((end - start).days, 1)
    total_pts = sum(s.get("effort", 0) or 0 for s in stories)

    points = []
    for d in range(total_days + 1):
        day = start.date() + __import__("datetime").timedelta(days=d)
        ideal = round(total_pts * (1 - d / total_days))
        points.append({"date": day.isoformat(), "ideal": ideal})

    return points


def consolidate_projects(projects_metrics: list[dict]) -> dict:
    """Aggregate health across all projects for the home dashboard."""
    total = len(projects_metrics)
    on_track = sum(1 for p in projects_metrics if p.get("current_sprint", {}).get("on_track") is True)
    at_risk = sum(1 for p in projects_metrics if p.get("current_sprint", {}).get("on_track") is False)
    total_stale = sum(
        len(p.get("current_sprint", {}).get("stale_stories", [])) +
        len(p.get("current_sprint", {}).get("stale_tasks", []))
        for p in projects_metrics
    )
    return {
        "total_projects": total,
        "on_track": on_track,
        "at_risk": at_risk,
        "no_data": total - on_track - at_risk,
        "total_stale_items": total_stale,
    }
