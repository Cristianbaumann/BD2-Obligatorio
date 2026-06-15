from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime


class EventoSectorItem(BaseModel):
    sector_id: int
    costo: float


class EventoCreate(BaseModel):
    fecha: datetime
    equipo_local_id: str
    equipo_visitante_id: str
    estadio_pais: str
    estadio_localidad: str
    estadio_calle: str
    estadio_numero: str
    sectores: Optional[List[EventoSectorItem]] = None

    @field_validator("equipo_visitante_id")
    @classmethod
    def equipos_distintos(cls, v, info):
        if info.data.get("equipo_local_id") == v:
            raise ValueError("equipo_local y equipo_visitante deben ser distintos")
        return v


class EventoOut(BaseModel):
    id: str
    fecha: datetime
    equipo_local_id: str
    equipo_visitante_id: str
    estadio_pais: str
    estadio_localidad: str
    estadio_calle: str
    estadio_numero: str


class EventoSectorOut(BaseModel):
    evento_id: str
    sector_id: int
    costo: float


class EventoRichOut(BaseModel):
    id: str
    fecha: datetime
    equipo_local: str
    equipo_visitante: str
    estadio: str
    precio_minimo: Optional[float] = None
    capacidad: Optional[int] = None
    entradas_disponibles: Optional[int] = None


class SectorDisponibilidadOut(BaseModel):
    sector_id: int
    nombre: str
    costo: float
    total: int
    disponibles: int
