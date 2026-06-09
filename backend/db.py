from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from config import settings
from typing import AsyncGenerator

engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# ── Tables (exemples prêts pour les futures évolutions) ──────────────────────

class SprintSnapshot(Base):
    """Historique des métriques par sprint — pour les tendances futures."""
    __tablename__ = "sprint_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_key: Mapped[str]
    sprint_id: Mapped[int]
    sprint_name: Mapped[str]
    captured_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    total_pts: Mapped[int] = mapped_column(default=0)
    done_pts: Mapped[int] = mapped_column(default=0)
    velocity_pct: Mapped[int] = mapped_column(default=0)
    total_stories: Mapped[int] = mapped_column(default=0)
    done_stories: Mapped[int] = mapped_column(default=0)
    stale_count: Mapped[int] = mapped_column(default=0)
    on_track: Mapped[bool | None] = mapped_column(nullable=True)


# ── Session helper ────────────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """Crée les tables si elles n'existent pas encore."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
