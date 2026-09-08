from typing import Optional
from pydantic import BaseModel, Field, field_validator
from .enums import UrgencyLevel, Department, IncidentCategory, LLMProviderType


# --- 1. Sub-esquema del Razonamiento ReAct ---
class ReActReasoning(BaseModel):
    """Estructura de razonamiento intermedio siguiendo el framework ReAct."""

    thought: str = Field(
        ...,
        description="Análisis inicial: evaluación de hechos objetivos, riesgos físicos o patrimoniales sin sesgos.",
        min_length=10,
    )
    action: str = Field(
        ...,
        description="Regla, protocolo o directriz municipal consultada para el triaje.",
        min_length=5,
    )
    observation: str = Field(
        ...,
        description="Conclusión operativa extraída tras contrastar los hechos con el protocolo.",
        min_length=5,
    )


# --- 2. Salida Estructurada que debe generar el LLM ---
class LLMTriageOutput(BaseModel):
    """Contrato estricto que debe devolver el LLM en formato JSON."""

    react_reasoning: ReActReasoning = Field(
        ...,
        description="Proceso de razonamiento ReAct previo a la toma de decisión.",
    )
    categoria: IncidentCategory = Field(
        ...,
        description="Categoría principal de la incidencia en la localización de rodaje.",
    )
    nivel_urgencia: UrgencyLevel = Field(
        ...,
        description="Nivel de urgencia evaluado: Baja, Media, Alta o Crítica.",
    )
    resumen_10_palabras: str = Field(
        ...,
        description="Resumen conciso del reporte en un máximo estricto de 10 palabras.",
    )
    departamento_asignado: Department = Field(
        ...,
        description="Departamento municipal competente responsable de la intervención.",
    )

    @field_validator("resumen_10_palabras")
    @classmethod
    def validar_maximo_10_palabras(cls, value: str) -> str:
        """Valida que el resumen no exceda el límite de 10 palabras."""
        palabras = value.strip().split()
        if len(palabras) > 10:
            raise ValueError(
                f"El resumen excede el límite permitido: contiene {len(palabras)} palabras (máximo 10)."
            )
        return value


# --- 3. Esquemas de Petición (API Request) ---
class TriageRequest(BaseModel):
    """Payload de entrada que recibe el endpoint de la API."""

    texto_incidencia: str = Field(
        ...,
        min_length=15,
        description="Texto no estructurado de la queja o reporte ciudadano.",
        json_schema_extra={
            "example": "Hay una multitud de turistas bloqueando la salida de emergencias del edificio histórico donde se rodó la película, y están dejando botellas rotas en la acera."
        },
    )
    provider: LLMProviderType = Field(
        default=LLMProviderType.LOCAL_OLLAMA,
        description="Proveedor de LLM seleccionado para ejecutar el triaje.",
    )


# --- 4. Esquemas de Métricas y Observabilidad ---
class TriageMetrics(BaseModel):
    """Métricas técnicas asociadas a la ejecución del modelo."""

    latencia_ms: float = Field(
        ..., description="Tiempo de inferencia y respuesta en milisegundos."
    )
    tokens_entrada: int = Field(
        ..., description="Tokens consumidos en el prompt de entrada."
    )
    tokens_salida: int = Field(
        ..., description="Tokens generados por el modelo en la respuesta."
    )
    coste_estimado_usd: float = Field(
        ..., description="Coste estimado en dólares (0.0 para modelos locales)."
    )
    proveedor: str = Field(
        ..., description="Identificador del modelo y proveedor ejecutado."
    )


# --- 5. Esquemas de Respuesta (API Response) ---
class TriageResponse(BaseModel):
    """Respuesta unificada de la API tras el triaje exitoso."""

    resultado: LLMTriageOutput
    metricas: TriageMetrics
    validado_exitosamente: bool = Field(
        default=True,
        description="Indica si la salida cumplió de forma estricta el esquema Type-Safe.",
    )


class CompareTriageResponse(BaseModel):
    """Respuesta del endpoint comparador (Local vs. Cloud)."""

    texto_original: str
    resultado_local: TriageResponse
    resultado_cloud: TriageResponse