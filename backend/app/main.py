from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.db.base import Base
from app.db.session import SessionLocal, engine, ensure_schema
from app.models import identity as _identity  # noqa: F401
from app.models import catalog as _catalog  # noqa: F401
from app.models import people as _people  # noqa: F401
from app.models import assessment as _assessment  # noqa: F401
from app.models import exams as _exams  # noqa: F401
from app.models import interventions as _interventions  # noqa: F401
from app.models import intelligence as _intelligence  # noqa: F401
from app.models import ai as _ai  # noqa: F401
from app.models import teaching as _teaching  # noqa: F401
from app.models import ops as _ops  # noqa: F401
from app.models import capabilities as _capabilities  # noqa: F401
from app.middleware import RequestLogMiddleware
from app.services.seed import seed_if_empty

log = get_logger("medixo")


def _boot_schema() -> None:
    ensure_schema()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.services.seed import demo_counts
        from app.services.spa_documents import seed_spa_documents

        academic = None
        spa = None
        try:
            academic = seed_if_empty(db)
        except Exception:
            db.rollback()
            log.exception("demo_seed_failed")
        try:
            spa = seed_spa_documents(db)
        except Exception:
            db.rollback()
            log.exception("spa_seed_failed")
        log.info("schema_ready", **demo_counts(db), academic=academic, spa=spa)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    setup_logging(force=True)
    _boot_schema()
    log.info("app_started", env=settings.app_env, version=__version__)
    yield
    log.info("app_stopped")


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging()
    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description="Enterprise FastAPI backend for MediXO EduX (auth, academics, assessment, exam attempts, intelligence, AI gateway).",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_middleware(RequestLogMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/health")
    def health():
        return {"status": "ok", "version": __version__, "env": settings.app_env}

    return app


app = create_app()
