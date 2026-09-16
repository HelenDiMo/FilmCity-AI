from functools import lru_cache
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ruta absoluta al .env en la raíz del repositorio, independiente del directorio
# de trabajo desde el que se ejecute Python (run.py, pytest, scripts/, uvicorn...).
# config.py vive en backend/app/core/, así que subimos 3 niveles hasta la raíz.
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE_PATH = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Configuración global de la aplicación cargada desde variables de entorno."""

    # Configuración de la API
    PROJECT_NAME: str = "FilmCity AI"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Proveedor Local (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5-coder:7b"

    # Proveedor Cloud (Groq)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Parámetros de Decodificación de LLMs
    TEMPERATURE: float = 0.1
    TOP_P: float = 0.9
    MAX_TOKENS: int = 1000

    # Configuración de carga de archivo .env
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Devuelve una instancia única (singleton) en memoria de la configuración."""
    return Settings()


# Instancia lista para importar en cualquier módulo
settings = get_settings()
