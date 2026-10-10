import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.exceptions import AppException, app_exception_handler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="Legal document automation platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}


from app.routers import auth, templates, files

app.include_router(auth.router, prefix="/api/v1")
app.include_router(templates.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
