"""Servicio unificado de inferencia LLM para FilmCity IA.
Gestiona las llamadas a Ollama (local) y Groq (cloud), calculando
latencia, consumo de tokens y costes estimados con validación Pydantic.
"""

import json
import time
from typing import Any, Dict, Tuple
from groq import Groq
import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.models.enums import LLMProviderType
from app.models.schemas import LLMTriageOutput, TriageMetrics, TriageResponse
from app.services.prompts import build_triage_prompt

# Estimación de coste Groq (Llama 3.1 8B): ~$0.05 / 1M tokens entrada, ~$0.08 / 1M tokens salida
COST_PER_MILLION_INPUT_GROQ = 0.05
COST_PER_MILLION_OUTPUT_GROQ = 0.08


class LLMService:
    """Gestiona la comunicación con proveedores de lenguaje locales y en la nube."""

    def __init__(self) -> None:
        self.groq_client = (
            Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        )

    def _call_groq(
        self, messages: list[dict[str, str]]
    ) -> Tuple[str, int, int, float]:
        """Ejecuta la inferencia en Groq Cloud forzando respuesta en formato JSON."""
        if not self.groq_client:
            raise ValueError(
                "GROQ_API_KEY no está configurada en las variables de entorno."
            )

        start_time = time.perf_counter()
        chat_completion = self.groq_client.chat.completions.create(
            messages=messages,
            model=settings.GROQ_MODEL,
            temperature=settings.TEMPERATURE,
            top_p=settings.TOP_P,
            max_tokens=settings.MAX_TOKENS,
            response_format={"type": "json_object"},
        )
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        raw_content = chat_completion.choices[0].message.content or "{}"
        input_tokens = (
            chat_completion.usage.prompt_tokens if chat_completion.usage else 0
        )
        output_tokens = (
            chat_completion.usage.completion_tokens if chat_completion.usage else 0
        )

        cost_usd = (input_tokens / 1_000_000 * COST_PER_MILLION_INPUT_GROQ) + (
            output_tokens / 1_000_000 * COST_PER_MILLION_OUTPUT_GROQ
        )

        return raw_content, input_tokens, output_tokens, latency_ms, cost_usd

    def _call_ollama(
        self, messages: list[dict[str, str]]
    ) -> Tuple[str, int, int, float, float]:
        """Ejecuta la inferencia en el servidor local de Ollama forzando modo JSON."""
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
            raise ConnectionError(
                f"No se pudo conectar con Ollama en {settings.OLLAMA_BASE_URL}. "
                f"Asegúrate de que el servicio está activo: {exc}"
            ) from exc

        latency_ms = (time.perf_counter() - start_time) * 1000.0
        raw_content = data.get("message", {}).get("content", "{}")
        input_tokens = data.get("prompt_eval_count", 0)
        output_tokens = data.get("eval_count", 0)
        cost_usd = 0.0  # La inferencia local no tiene coste por token

        return raw_content, input_tokens, output_tokens, latency_ms, cost_usd

    def run_triage(
        self, text: str, provider: LLMProviderType = LLMProviderType.LOCAL_OLLAMA
    ) -> TriageResponse:
        """Flujo completo: construye prompt, ejecuta modelo, valida contrato y genera métricas."""
        messages = build_triage_prompt(text)

        if provider == LLMProviderType.CLOUD_GROQ:
            (
                raw_json_str,
                input_tokens,
                output_tokens,
                latency_ms,
                cost_usd,
            ) = self._call_groq(messages)
            model_used = f"Groq Cloud ({settings.GROQ_MODEL})"
        else:
            (
                raw_json_str,
                input_tokens,
                output_tokens,
                latency_ms,
                cost_usd,
            ) = self._call_ollama(messages)
            model_used = f"Ollama Local ({settings.OLLAMA_MODEL})"

        # 1. Parsear el texto JSON devuelto por el LLM
        try:
            parsed_dict = json.loads(raw_json_str)
        except json.JSONDecodeError as err:
            raise ValueError(
                f"El modelo devolvió una respuesta que no es JSON válido: {raw_json_str}"
            ) from err

        # 2. Validación estricta con Pydantic (Type-Safety)
        try:
            validated_output = LLMTriageOutput.model_validate(parsed_dict)
        except ValidationError as val_err:
            raise ValueError(
                f"La salida del modelo no cumple el contrato de datos requerido: {val_err}"
            ) from val_err

        # 3. Construir métricas de observabilidad
        metrics = TriageMetrics(
            latencia_ms=round(latency_ms, 2),
            tokens_entrada=input_tokens,
            tokens_salida=output_tokens,
            coste_estimado_usd=round(cost_usd, 6),
            proveedor=model_used,
        )

        return TriageResponse(
            resultado=validated_output,
            metricas=metrics,
            validado_exitosamente=True,
        )


# Instancia única del servicio lista para inyectar en la API
triage_service = LLMService()