from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.api.routes import auth, profiles, reports, analytes, import_files
from app.core.security_middleware import setup_security_middleware

app = FastAPI(
    title="Analyses Tracker API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS - строгая конфигурация
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Request-Id"],
    max_age=600,  # 10 минут
)

# Security middleware (rate limiting, security headers, file validation)
setup_security_middleware(app)

app.include_router(auth.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(analytes.router, prefix="/api")
app.include_router(import_files.router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "service": "Analyses Tracker API",
        "version": "0.1.0",
        "docs": "/api/docs"
    }
