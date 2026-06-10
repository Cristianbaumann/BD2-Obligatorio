from pydantic import BaseModel, field_validator
from typing import List
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
    sectores: List[EventoSectorItem]

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
