"""Tests unitarios y de integración para los endpoints de triaje con mocks."""

import sys
from pathlib import Path
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

# Añadir la raíz del backend al path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.models.enums import Department, IncidentCategory, LLMProviderType, UrgencyLevel
from app.models.schemas import (
    CompareTriageResponse,
    LLMTriageOutput,
    TriageMetrics,
    TriageResponse,
)

client = TestClient(app)

# Obtener valores válidos directamente de los Enums existentes
sample_category = list(IncidentCategory)[0]
sample_urgency = list(UrgencyLevel)[0]
sample_department = list(Department)[0]

react_payload = {
    "thought": "La furgoneta impide el paso de emergencias.",
    "action": "Consultar protocolo de bloqueo vial.",
    "observation": "Riesgo crítico de seguridad ciudadana.",
}

MOCK_VALID_TRIAGE_RESPONSE = TriageResponse(
    resultado=LLMTriageOutput(
        categoria=sample_category,
        nivel_urgencia=sample_urgency,
        departamento_asignado=sample_department,
        justificacion_urgencia="Bloqueo directo de salida de emergencia.",
        accion_inmediata_recomendada="Despejar acceso con grúa municipal.",
        resumen_10_palabras="Furgoneta de rodaje bloqueando vado de ambulancias",
        react_reasoning=react_payload,
    ),
    metricas=TriageMetrics(
        latencia_ms=120.5,
        tokens_entrada=850,
        tokens_salida=220,
        coste_estimado_usd=0.00005,
        proveedor="Groq Cloud (Mock Model)",
    ),
    validado_exitosamente=True,
)


def test_health_check_endpoint():
    """Verifica que el endpoint /health responde 200 y el estado esperado."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@patch("app.api.v1.endpoints.triage.triage_service.run_triage")
def test_process_triage_success(mock_run_triage):
    """Verifica el flujo correcto de POST /api/v1/triage con mock de LLM."""
    mock_run_triage.return_value = MOCK_VALID_TRIAGE_RESPONSE

    payload = {
        "texto_incidencia": "Una furgoneta de rodaje está tapando la salida de emergencias.",
        "provider": "cloud_groq",
    }

    response = client.post("/api/v1/triage", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["validado_exitosamente"] is True
    assert data["resultado"]["nivel_urgencia"] == sample_urgency.value
    assert data["resultado"]["departamento_asignado"] == sample_department.value
    assert data["metricas"]["tokens_entrada"] == 850


@patch("app.api.v1.endpoints.triage.triage_service.run_triage")
def test_process_triage_broken_json_handled(mock_run_triage):
    """Verifica que un error de validación o JSON roto devuelva HTTP 422."""
    mock_run_triage.side_effect = ValueError(
        "El modelo devolvió un JSON no parseable tras reintentos."
    )

    payload = {
        "texto_incidencia": "Texto que provocará error simulado.",
        "provider": "cloud_groq",
    }

    response = client.post("/api/v1/triage", json=payload)

    assert response.status_code == 422
    assert "JSON no parseable" in response.json()["detail"]


@patch("app.api.v1.endpoints.triage.triage_service.run_triage")
def test_process_triage_connection_error_handled(mock_run_triage):
    """Verifica que una caída de conexión con el proveedor devuelva HTTP 503."""
    mock_run_triage.side_effect = ConnectionError(
        "No se pudo conectar con Ollama en localhost:11434."
    )

    payload = {
        "texto_incidencia": "Texto de prueba.",
        "provider": "local_ollama",
    }

    response = client.post("/api/v1/triage", json=payload)

    assert response.status_code == 503
    assert "Ollama" in response.json()["detail"]


@patch("app.api.v1.endpoints.triage.triage_service.compare_providers")
def test_compare_triage_success(mock_compare):
    """Verifica el endpoint de comparativa POST /api/v1/triage/compare."""
    mock_compare.return_value = CompareTriageResponse(
        texto_original="Queja para comparar",
        resultado_local=MOCK_VALID_TRIAGE_RESPONSE,
        resultado_cloud=MOCK_VALID_TRIAGE_RESPONSE,
    )

    payload = {
        "texto_incidencia": "Queja para comparar",
        "provider": "cloud_groq",
    }

    response = client.post("/api/v1/triage/compare", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "resultado_local" in data
    assert "resultado_cloud" in data
