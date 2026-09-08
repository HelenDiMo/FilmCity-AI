from enum import Enum


class UrgencyLevel(str, Enum):
    """Niveles de urgencia para el triaje de incidencias."""

    BAJA = "Baja"
    MEDIA = "Media"
    ALTA = "Alta"
    CRITICA = "Crítica"


class Department(str, Enum):
    """Departamentos municipales responsables de resolver la incidencia."""

    TURISMO_PATRIMONIO = "Turismo y Patrimonio Cultural"
    INSPECCION_VIA_PUBLICA = "Inspección de Vía Pública"
    SEGURIDAD_CIUDADANA = "Seguridad Ciudadana"
    LIMPIEZA_ESPECIAL = "Limpieza Especial"


class IncidentCategory(str, Enum):
    """Categorías temáticas de incidencias en rutas de rodajes y turismo cinematográfico."""

    MASIFICACION = "Masificación y Control de Aforos"
    VANDALISMO_PATRIMONIO = "Vandalismo o Daños en Patrimonio/Placas"
    ACTIVIDAD_NO_AUTORIZADA = "Guías y Actividades Comerciales No Autorizadas"
    RESIDUOS_Y_SUCIEDAD = "Acumulación de Residuos en Escenarios"
    BLOQUEO_ACCESOS = "Bloqueo de Vados y Accesos de Emergencia"
    RUIDO_CONVIVENCIA = "Ruidos y Molestias Vecinales"
    OTRO = "Otro"


class LLMProviderType(str, Enum):
    """Proveedores de modelos de lenguaje soportados por la plataforma."""

    LOCAL_OLLAMA = "local_ollama"
    CLOUD_GROQ = "cloud_groq"
