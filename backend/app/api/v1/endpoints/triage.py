"""Definición de endpoints de triaje para la versión 1 de la API."""

from fastapi import APIRouter, HTTPException, status
from app.models.schemas import CompareTriageResponse, TriageRequest, TriageResponse
from app.services.llm_service import triage_service

router = APIRouter(tags=["Triaje de Incidencias"])

OLLAMA_NOTICE = (
    "Modo On-Premise: El motor local Ollama está diseñado para ejecuciones "
    "en red local bajo soberanía de datos (RGPD). En esta demo cloud pública, "
    "por favor selecciona 'Groq Cloud'."
)

OLLAMA_COMPARE_NOTICE = (
    "Comparativa no disponible en la nube: El motor Ollama requiere un entorno local On-Premise. "
    "Selecciona 'Groq Cloud' en el análisis individual."
)


# ✅ CORRECTO:
@router.post("")
def process_triage(payload: TriageRequest) -> TriageResponse:
    try:
        return triage_service.run_triage(
            text=payload.texto_incidencia,
            provider=payload.provider,  # <-- ESTA ES LA LÍNEA CLAVE
        )
    except ConnectionError as conn_err:
        err_msg = str(conn_err)
        detail_msg = (
            OLLAMA_NOTICE
            if ("Ollama" in err_msg or "111" in err_msg)
            else f"Servicio LLM no disponible: {err_msg}"
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail_msg,
        ) from conn_err
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error en validación de contrato o proveedor: {val_err}",
        ) from val_err


@router.post(
    "/compare",
    response_model=CompareTriageResponse,
    status_code=status.HTTP_200_OK,
    summary="Comparar triaje entre Local y Cloud",
    description="Ejecuta la misma queja simultáneamente en Ollama (Local) y Groq (Cloud) para evaluar latencia, costes y consistencia.",
)
def compare_triage(payload: TriageRequest) -> CompareTriageResponse:
    """Ejecuta el triaje en ambos proveedores para alimentar la comparativa en el frontend."""
    try:
        return triage_service.compare_providers(text=payload.texto_incidencia)
    except ConnectionError as conn_err:
        err_msg = str(conn_err)
        detail_msg = (
            OLLAMA_COMPARE_NOTICE
            if ("Ollama" in err_msg or "111" in err_msg)
            else f"Error de conexión en uno de los proveedores: {err_msg}"
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail_msg,
        ) from conn_err
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar la comparativa: {exc}",
        ) from exc
