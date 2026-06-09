from typing import Optional

_store: dict = {}


def set_data(sprint: dict, stories: list, tasks: list, metrics: dict) -> None:
    _store.clear()
    _store.update({"sprint": sprint, "stories": stories, "tasks": tasks, "metrics": metrics})


def get_data() -> Optional[dict]:
    return _store if _store else None


def clear_data() -> None:
    _store.clear()