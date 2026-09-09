"""Módulo de proveedores de LLM con interfaz base y backoff exponencial."""

from abc import ABC, abstractmethod
import json
import time
from typing import Any, Dict, List, Tuple
from groq import Groq
import httpx
from pydantic import ValidationError
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.models.enums import LLMProviderType
from app.models.schemas import LLMTriageOutput, TriageMetrics, TriageResponse
from app.services.prompts import build_triage_prompt

# Estimación de coste Groq (Llama / GPT-OSS): ~$0.05 / 1M in, ~$0.08 / 1M out
COST_PER_MILLION_INPUT_GROQ = 0.05
COST_PER_MILLION_OUTPUT_GROQ = 0.08


class BaseLLMProvider(ABC):
    """Interfaz base abstracta para cualquier proveedor de LLM."""

    @abstractmethod
    def generate_triage(self, messages: List[Dict[str, str]]) -> Tuple[str, int, int, float, float]:
        """Ejecuta la inferencia devolviendo: (raw_json_str, in_tokens, out_tokens, latency_ms, cost_usd)."""
        pass

def run_triage(self, text: str, max_retries: int = 2) -> TriageResponse:
        """Construye el prompt, ejecuta el modelo y valida el contrato Pydantic.
        
        Si el LLM devuelve un JSON roto o inválido, reintenta la llamada.
        """
        messages = build_triage_prompt(text)
        attempts = 0
        last_error: Exception | None = None

        while attempts <= max_retries:
            attempts += 1
            raw_json_str, in_tokens, out_tokens, latency_ms, cost_usd = self.generate_triage(messages)

        # 1. Parsear texto JSON
            try:
                parsed_dict = json.loads(raw_json_str)
            except json.JSONDecodeError as err:
                last_error = ValueError(f"El modelo devolvió un JSON no parseable: {raw_json_str}")
                continue

        # 2. Validar contrato Pydantic (Type-Safety)
            try:
                validated_output = LLMTriageOutput.model_validate(parsed_dict)
            except ValidationError as val_err:
                last_error = ValueError(f"La salida no cumple el contrato de datos: {val_err}")
                continue

        # Si pasa la validación, construir métricas y retornar
            metrics = TriageMetrics(
                latencia_ms=round(latency_ms, 2),
                tokens_entrada=in_tokens,
                tokens_salida=out_tokens,
                coste_estimado_usd=round(cost_usd, 6),
                proveedor=self.get_provider_name(),
            )

            return TriageResponse(
                resultado=validated_output,
                metricas=metrics,
                validado_exitosamente=True,
            )

        # Si agotó reintentos sin éxito
        raise last_error or ValueError("Error desconocido al procesar el triaje con el LLM.")

@abstractmethod
def get_provider_name(self) -> str:
    """Devuelve el nombre identificador del proveedor y modelo."""
    pass


class OllamaProvider(BaseLLMProvider):
    """Implementación local mediante Ollama API."""

    def get_provider_name(self) -> str:
        return f"Ollama Local ({settings.OLLAMA_MODEL})"

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def generate_triage(self, messages: List[Dict[str, str]]) -> Tuple[str, int, int, float, float]:
        url = f"{settings.OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": messages,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": settings.TEMPERATURE,
                "top_p": settings.TOP_P,
                "num_predict": settings.MAX_TOKENS,
            },
        }

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            raise ConnectionError(f"Error de conexión con Ollama: {exc}") from exc

        latency_ms = (time.perf_counter() - start_time) * 1000.0
        raw_content = data.get("message", {}).get("content", "{}")
        in_tokens = data.get("prompt_eval_count", 0)
        out_tokens = data.get("eval_count", 0)
        cost_usd = 0.0

        return raw_content, in_tokens, out_tokens, latency_ms, cost_usd


class GroqProvider(BaseLLMProvider):
    """Implementación Cloud mediante Groq API."""

    def __init__(self) -> None:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY no configurada en el entorno.")
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def get_provider_name(self) -> str:
        return f"Groq Cloud ({settings.GROQ_MODEL})"

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def generate_triage(self, messages: List[Dict[str, str]]) -> Tuple[str, int, int, float, float]:
        start_time = time.perf_counter()
        chat_completion = self.client.chat.completions.create(
            messages=messages,
            model=settings.GROQ_MODEL,
            temperature=settings.TEMPERATURE,
            top_p=settings.TOP_P,
            max_tokens=settings.MAX_TOKENS,
            response_format={"type": "json_object"},
        )
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        raw_content = chat_completion.choices[0].message.content or "{}"
        in_tokens = chat_completion.usage.prompt_tokens if chat_completion.usage else 0
        out_tokens = chat_completion.usage.completion_tokens if chat_completion.usage else 0

        cost_usd = (in_tokens / 1_000_000 * COST_PER_MILLION_INPUT_GROQ) + (
            out_tokens / 1_000_000 * COST_PER_MILLION_OUTPUT_GROQ
        )

        return raw_content, in_tokens, out_tokens, latency_ms, cost_usd


# Factory para obtener el proveedor adecuado según la petición
def get_llm_provider(provider_type: LLMProviderType) -> BaseLLMProvider:
    if provider_type == LLMProviderType.CLOUD_GROQ:
        return GroqProvider()
    elif provider_type == LLMProviderType.LOCAL_OLLAMA:
        return OllamaProvider()
    raise ValueError(f"Proveedor no soportado: {provider_type}")