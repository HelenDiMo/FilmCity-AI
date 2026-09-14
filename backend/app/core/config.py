from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración global de la aplicación cargada desde variables de entorno."""

    # Configuración de la API
    PROJECT_NAME: str = "FilmCity AI"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Proveedor Local (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # Proveedor Cloud (Groq)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # Parámetros de Decodificación de LLMs
    TEMPERATURE: float = 0.1
    TOP_P: float = 0.9
    MAX_TOKENS: int = 1000

    # Configuración de carga de archivo .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Devuelve una instancia única (singleton) en memoria de la configuración."""
    return Settings()


# Instancia lista para importar en cualquier módulo
settings = get_settings()