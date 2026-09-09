"""Definición de endpoints de triaje para la versión 1 de la API."""

from fastapi import APIRouter, HTTPException, status
from app.models.schemas import CompareTriageResponse, TriageRequest, TriageResponse
from app.services.llm_service import triage_service

router = APIRouter(tags=["Triaje de Incidencias"])


@router.post(
    "",
    response_model=TriageResponse,
    status_code=status.HTTP_200_OK,
    summary="Procesar triaje de una incidencia",
    description="Analiza una queja ciudadana mediante el LLM configurado, aplicando razonamiento ReAct y validación de contrato.",
)
def process_triage(payload: TriageRequest) -> TriageResponse:
    """Procesa una incidencia individual con el proveedor seleccionado (Ollama o Groq)."""
    try:
        return triage_service.run_triage(
            text=payload.texto_incidencia,
            provider=payload.provider,
        )
    except ConnectionError as conn_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Servicio LLM no disponible: {conn_err}",
        ) from conn_err
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error en la validación del contrato de datos o JSON roto: {val_err}",
        ) from val_err
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno durante el procesamiento del triaje: {exc}",
        ) from exc


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
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error de conexión en uno de los proveedores: {conn_err}",
        ) from conn_err
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar la comparativa: {exc}",
        ) from exc

