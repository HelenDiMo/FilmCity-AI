"""Servicio unificado de triaje para la API y los tests."""

from app.models.enums import LLMProviderType
from app.models.schemas import CompareTriageResponse, TriageResponse
from app.services.llm_providers import get_llm_provider


class TriageService:
    """Orquestador de servicios de triaje."""

    def run_triage(
        self, text: str, provider: LLMProviderType = LLMProviderType.CLOUD_GROQ
    ) -> TriageResponse:
        """Ejecuta el triaje utilizando el proveedor indicado."""
        llm = get_llm_provider(provider)
        return llm.run_triage(text)

    def compare_providers(self, text: str) -> CompareTriageResponse:
        """Ejecuta la misma incidencia en local y cloud para comparar resultados y métricas."""
        local_provider = get_llm_provider(LLMProviderType.LOCAL_OLLAMA)
        cloud_provider = get_llm_provider(LLMProviderType.CLOUD_GROQ)

        res_local = local_provider.run_triage(text)
        res_cloud = cloud_provider.run_triage(text)

        return CompareTriageResponse(
            texto_original=text,
            resultado_local=res_local,
            resultado_cloud=res_cloud,
        )


# Instancia única lista para usar en los endpoints
triage_service = TriageService()