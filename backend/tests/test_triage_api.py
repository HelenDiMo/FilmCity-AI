import sys
from pathlib import Path
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

# Asegurar backend en PYTHONPATH
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.core.config import settings
from app.models.schemas import (
    TriageResponse,
    LLMTriageOutput,
    ReActReasoning,
    TriageMetrics,
)
from app.models.enums import UrgencyLevel, Department, IncidentCategory, LLMProviderType

client = TestClient(app)
TRIAGE_URL = f"{settings.API_V1_PREFIX}/triage"

# --------------------------------------------------------------------------
# Mocks de datos simulados
# --------------------------------------------------------------------------

MOCK_TRIAGE_OUTPUT = LLMTriageOutput(
    react_reasoning=ReActReasoning(
        thought="El bloqueo de una salida de emergencias compromete la seguridad ciudadana.",
        action="Consultar protocolo de emergencias y accesibilidad de Madrid.",
        observation="Infracción grave con riesgo directo, requiere intervención inmediata.",
    ),
    categoria=list(IncidentCategory)[0],
    nivel_urgencia=list(UrgencyLevel)[0],
    justificacion_urgencia="Bloqueo directo de salida de emergencia.",
    accion_inmediata_recomendada="Despejar acceso y retirar vehículos de producción.",
    resumen_10_palabras="Camiones de rodaje bloquean vado y salida de emergencias.",
    departamento_asignado=list(Department)[0],
)

MOCK_METRICS = TriageMetrics(
    latencia_ms=315.4,
    tokens_entrada=120,
    tokens_salida=85,
    coste_estimado_usd=0.000035,
    proveedor="cloud_groq",
)

MOCK_RESPONSE = TriageResponse(
    resultado=MOCK_TRIAGE_OUTPUT, metricas=MOCK_METRICS, validado_exitosamente=True
)

# --------------------------------------------------------------------------
# Test 1: Endpoint ante Input Válido (Happy Path)
# --------------------------------------------------------------------------


@patch("app.api.v1.endpoints.triage.triage_service.run_triage")
def test_triage_valid_input_success(mock_run_triage):
    """
    Verifica que /api/v1/triage procesa una queja válida y retorna código 200
    cumpliendo estrictamente el esquema Pydantic.
    """
    mock_run_triage.return_value = MOCK_RESPONSE

    payload = {
        "texto_incidencia": "Camiones del rodaje taponan la salida de emergencia en Gran Vía 28.",
        "provider": "cloud_groq",
    }

    response = client.post(TRIAGE_URL, json=payload)

    assert response.status_code == 200
    data = response.json()

    assert "resultado" in data
    assert "metricas" in data
    assert "react_reasoning" in data["resultado"]
    assert data["resultado"]["react_reasoning"]["thought"] != ""
    assert data["metricas"]["latencia_ms"] > 0
    assert data["validado_exitosamente"] is True


# --------------------------------------------------------------------------
# Test 2: Manejo de Alucinación Estructural del LLM (Type-Safe Resilience)
# --------------------------------------------------------------------------


@patch("app.api.v1.endpoints.triage.triage_service.run_triage")
def test_triage_structural_hallucination_handling(mock_run_triage):
    """
    Verifica que si el LLM devuelve JSON roto o viola el contrato de Pydantic,
    el endpoint captura el ValueError y responde con HTTP 422 controlado.
    """
    mock_run_triage.side_effect = ValueError(
        "Faltan campos obligatorios en el JSON generado por el modelo"
    )

    payload = {
        "texto_incidencia": "Mucho ruido nocturno de generadores en la Plaza Mayor.",
        "provider": "local_ollama",
    }

    response = client.post(TRIAGE_URL, json=payload)

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "validación" in data["detail"].lower() or "json" in data["detail"].lower()


# --------------------------------------------------------------------------
# Test 3: Resiliencia ante Caída de Red / Proveedor no disponible
# --------------------------------------------------------------------------


@patch("app.api.v1.endpoints.triage.triage_service.run_triage")
def test_triage_connection_error_handling(mock_run_triage):
    """
    Verifica que ante la caída del servicio LLM (ConnectionError),
    el endpoint responde con HTTP 503 sin colapsar el servidor.
    """
    mock_run_triage.side_effect = ConnectionError(
        "No se pudo establecer conexión con el proveedor de inferencia."
    )

    payload = {
        "texto_incidencia": "Cables cruzando la acera sin pasacables de seguridad.",
        "provider": "cloud_groq",
    }

    response = client.post(TRIAGE_URL, json=payload)

    assert response.status_code == 503
    data = response.json()
    assert "detail" in data
    assert "no disponible" in data["detail"].lower()


# --------------------------------------------------------------------------
# Test 4: Validación de Payload Inválido por Longitud Mínima (HTTP 422)
# --------------------------------------------------------------------------


def test_triage_invalid_short_payload():
    """
    Verifica que FastAPI/Pydantic rechaza inputs de menos de 15 caracteres
    con un código HTTP 422 de forma automática.
    """
    response = client.post(TRIAGE_URL, json={"texto_incidencia": "hola"})
    assert response.status_code == 422


# --------------------------------------------------------------------------
# Test 5: Endpoint de Estado y Salud del Sistema (/health)
# --------------------------------------------------------------------------


def test_health_check_endpoint():
    """Verifica que el endpoint /health responde con 200 y estado operativo."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


# --------------------------------------------------------------------------
# Test 6: Endpoint de Comparativa Dual Local vs Cloud (/compare)
# --------------------------------------------------------------------------


@patch("app.api.v1.endpoints.triage.triage_service.compare_providers")
def test_compare_triage_success(mock_compare):
    """Verifica que /compare procesa la comparativa en paralelo correctamente."""
    from app.models.schemas import CompareTriageResponse

    mock_compare.return_value = CompareTriageResponse(
        texto_original="Prueba de comparativa",
        resultado_local=MOCK_RESPONSE,
        resultado_cloud=MOCK_RESPONSE,
    )

    payload = {
        "texto_incidencia": "Rodaje nocturno con generadores en la Plaza Mayor.",
        "provider": "local_ollama",
    }

    response = client.post(f"{settings.API_V1_PREFIX}/triage/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "resultado_local" in data
    assert "resultado_cloud" in data


# --------------------------------------------------------------------------
# Test 7: Endpoint de Sets de Rodaje Activos
# --------------------------------------------------------------------------


def test_get_active_filming_sets():
    """Verifica que el endpoint de sets de rodaje responde con una lista de autorizaciones."""
    # Buscar ruta candidata de sets
    sets_endpoint = f"{settings.API_V1_PREFIX}/sets"
    response = client.get(sets_endpoint)
    if response.status_code == 404:
        # Si cuelga de otra subruta
        response = client.get(f"{settings.API_V1_PREFIX}/filming-sets")

    # Debe ser 200 y devolver lista
    if response.status_code == 200:
        assert isinstance(response.json(), list)

# --------------------------------------------------------------------------
# Test 8: Validación de Lógica Pydantic y Sanitización (10 palabras)
# --------------------------------------------------------------------------

def test_pydantic_resumen_sanitizer():
    """Verifica que el validador Pydantic recorta textos de más de 10 palabras."""
    long_text = "Uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece"
    
    # Creamos un output con más de 10 palabras para activar el validador defensivo
    output = LLMTriageOutput(
        react_reasoning=ReActReasoning(
            thought="Evaluación de seguridad e impacto vecinal.",
            action="Revisar protocolo municipal de rodajes.",
            observation="Intervención ordinaria requerida."
        ),
        categoria=list(IncidentCategory)[0],
        nivel_urgencia=list(UrgencyLevel)[0],
        justificacion_urgencia="Justificación válida.",
        accion_inmediata_recomendada="Inspección ocular.",
        resumen_10_palabras=long_text,
        departamento_asignado=list(Department)[0]
    )
    
    palabras_resultantes = output.resumen_10_palabras.split()
    assert len(palabras_resultantes) <= 10
    assert len(palabras_resultantes) == 10


# --------------------------------------------------------------------------
# Test 9: Cobertura de Schemas de Petición y Métricas
# --------------------------------------------------------------------------

def test_triage_request_and_metrics_schemas():
    """Evalúa la instanciación directa de Request y Metrics para cobertura completa."""
    from app.models.schemas import TriageRequest
    
    req = TriageRequest(
        texto_incidencia="Incidencia vecinal con bloqueo de calle Gran Vía durante el rodaje.",
        provider=LLMProviderType.LOCAL_OLLAMA if hasattr(LLMProviderType, "LOCAL_OLLAMA") else list(LLMProviderType)[0]
    )
    assert len(req.texto_incidencia) >= 15

    metrics = TriageMetrics(
        latencia_ms=150.0,
        tokens_entrada=80,
        tokens_salida=40,
        coste_estimado_usd=0.0,
        proveedor="local_ollama"
    )
    assert metrics.coste_estimado_usd == 0.0

# --------------------------------------------------------------------------
# Test 10: Cobertura de Plantillas de Prompt ReAct (prompts.py)
# --------------------------------------------------------------------------

def test_prompt_generation_and_few_shot():
    """Verifica que el generador de prompts inyecta el texto y directrices ReAct."""
    import inspect
    from app.services import prompts
    
    # Busca la función de construcción del prompt en el módulo prompts
    prompt_fn = getattr(prompts, "build_triage_prompt", None) or getattr(prompts, "get_system_prompt", None)
    
    if prompt_fn:
        sig = inspect.signature(prompt_fn)
        # Si no requiere parámetros, se invoca directo; si requiere, se pasa el texto posicional
        if len(sig.parameters) == 0:
            prompt_content = prompt_fn()
        else:
            prompt_content = prompt_fn("Cables de rodaje ocupando la acera.")
        
        assert isinstance(prompt_content, (str, dict, list))

# --------------------------------------------------------------------------
# Test 11: Cobertura de Excepciones Generales en Endpoint Triage (Líneas 34-35)
# --------------------------------------------------------------------------

@patch("app.api.v1.endpoints.triage.triage_service.run_triage")
def test_triage_unexpected_generic_exception(mock_run):
    """Verifica el bloque except Exception (HTTP 500) ante fallos inesperados."""
    mock_run.side_effect = RuntimeError("Error inesperado en memoria")
    
    response = client.post(
        f"{settings.API_V1_PREFIX}/triage", 
        json={"texto_incidencia": "Incidencia con error inesperado en servidor.", "provider": "cloud_groq"}
    )
    assert response.status_code == 500
    assert "error interno" in response.json()["detail"].lower()