"""Punto de entrada principal de la aplicación FastAPI para FilmCity IA."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.triage import router as triage_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend type-safe para el triaje inteligente de incidencias en turismo cinematográfico y rodajes.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas bajo el prefijo /api/v1/triage
app.include_router(triage_router, prefix=f"{settings.API_V1_PREFIX}/triage")


@app.get("/health", tags=["Estado del Sistema"])
def health_check() -> dict[str, str]:
    """Endpoint ligero para verificar que la API está operativa."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }