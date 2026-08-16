import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import prompts, simulator, analyzer, versions
from app.db import init_db

# Configure application-wide logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Backend services for AI Voice Agent Studio - Prompt Studio compilation engine."
)

@app.on_event("startup")
def on_startup():
    """Initialize the SQLite database tables on application startup."""
    init_db()

# CORS middleware rules to allow deployed frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(
    prompts.router,
    prefix=f"{settings.API_V1_STR}/prompts",
    tags=["prompts"]
)

app.include_router(
    simulator.router,
    prefix=f"{settings.API_V1_STR}/simulator",
    tags=["simulator"]
)

app.include_router(
    analyzer.router,
    prefix=f"{settings.API_V1_STR}/analyzer",
    tags=["analyzer"]
)

app.include_router(
    versions.router,
    prefix=f"{settings.API_V1_STR}/versions",
    tags=["versions"]
)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

logger.info(f"FastAPI application bootstrap complete. API prefix: {settings.API_V1_STR}")
