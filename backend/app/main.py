import logging
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import prompts, simulator, analyzer, versions
from app.db import init_db
from app.core.security import RateLimitMiddleware, verify_api_key

# Configure application-wide logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize the SQLite database tables on application startup."""
    init_db()
    if not settings.API_KEY:
        logger.warning("API_KEY is not set: API routes are unauthenticated.")
    if settings.ALLOWED_ORIGINS.strip() in ("", "*"):
        logger.warning("ALLOWED_ORIGINS is '*': restrict it to your frontend origin outside local dev.")
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Backend services for AI Voice Agent Studio - Prompt Studio compilation engine."
)

# Rate limiting (added BEFORE CORS: the last middleware added is outermost, so CORS also decorates 429s)
app.add_middleware(
    RateLimitMiddleware,
    limit_per_minute=settings.RATE_LIMIT_PER_MINUTE,
    api_prefix=settings.API_V1_STR,
    trust_proxy=settings.TRUST_PROXY_HEADERS,
)

# CORS middleware rules to allow deployed frontend communication
cors_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
if not cors_origins:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(
    prompts.router,
    prefix=f"{settings.API_V1_STR}/prompts",
    tags=["prompts"],
    dependencies=[Depends(verify_api_key)],
)

app.include_router(
    simulator.router,
    prefix=f"{settings.API_V1_STR}/simulator",
    tags=["simulator"],
    dependencies=[Depends(verify_api_key)],
)

app.include_router(
    analyzer.router,
    prefix=f"{settings.API_V1_STR}/analyzer",
    tags=["analyzer"],
    dependencies=[Depends(verify_api_key)],
)

app.include_router(
    versions.router,
    prefix=f"{settings.API_V1_STR}/versions",
    tags=["versions"],
    dependencies=[Depends(verify_api_key)],
)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

logger.info(f"FastAPI application bootstrap complete. API prefix: {settings.API_V1_STR}")
