"""Endpoint para consultar las autorizaciones y sets de rodaje activos en Madrid."""

from typing import List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/filming-sets", tags=["Rodajes Activos"])


class FilmingSet(BaseModel):
    """Modelo de datos para una localización de rodaje u ocupación autorizada."""

    id: str = Field(..., description="Identificador único del permiso municipal")
    titulo_produccion: str = Field(..., description="Referencia o tipo de producción audiovisual")
    ubicacion: str = Field(..., description="Calle o enclave del rodaje")
    distrito: str = Field(..., description="Distrito municipal de Madrid")
    tipo_ocupacion: str = Field(..., description="Alcance de la autorización de vía pública")
    estado: str = Field(default="Activo", description="Estado operativo del set")


# Datos estructurados basados en el callejero y permisos de Madrid Film Office
ACTIVE_SETS: List[FilmingSet] = [
    FilmingSet(
        id="MFO-2026-089",
        titulo_produccion="Producción Ficción (Serie)",
        ubicacion="Gran Vía / Callao",
        distrito="Centro",
        tipo_ocupacion="Corte intermitente de tráfico y reserva técnica",
        estado="Activo",
    ),
    FilmingSet(
        id="MFO-2026-092",
        titulo_produccion="Largometraje Internacional",
        ubicacion="Plaza de la Villa",
        distrito="Centro",
        tipo_ocupacion="Ocupación peatonal con equipo ligero",
        estado="Activo",
    ),
    FilmingSet(
        id="MFO-2026-095",
        titulo_produccion="Ruta Screen Tourism",
        ubicacion="Paseo del Prado / Retiro",
        distrito="Retiro",
        tipo_ocupacion="Concentración turística en enclaves protegidos",
        estado="Activo",
    ),
    FilmingSet(
        id="MFO-2026-101",
        titulo_produccion="Spot Publicitario Comercial",
        ubicacion="Paseo de la Castellana / AZCA",
        distrito="Tetuán",
        tipo_ocupacion="Reserva de estacionamiento para camiones técnicos",
        estado="Activo",
    ),
]


@router.get("/active", response_model=List[FilmingSet])
def get_active_filming_sets() -> List[FilmingSet]:
    """Devuelve el listado de rodajes y ocupaciones autorizadas activas en la vía pública."""
    return ACTIVE_SETS