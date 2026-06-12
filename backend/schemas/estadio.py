from pydantic import BaseModel
from typing import List, Optional


class EstadioCreate(BaseModel):
    dir_pais: str
    dir_localidad: str
    dir_calle: str
    dir_numero: str
    nombre: str
    aforo: int


class EstadioOut(BaseModel):
    dir_pais: str
    dir_localidad: str
    dir_calle: str
    dir_numero: str
    nombre: str
    aforo: int


class SectorCreate(BaseModel):
    estadio_pais: str
    estadio_localidad: str
    estadio_calle: str
    estadio_numero: str
    nombre: str
    capacidad: int


class SectorIn(BaseModel):
    nombre: str
    capacidad: int


class SectorUpdate(BaseModel):
    nombre: Optional[str] = None
    capacidad: Optional[int] = None


class SectorOut(BaseModel):
    id: int
    estadio_pais: str
    estadio_localidad: str
    estadio_calle: str
    estadio_numero: str
    nombre: str
    capacidad: int


class EstadioDetail(BaseModel):
    dir_pais: str
    dir_localidad: str
    dir_calle: str
    dir_numero: str
    nombre: str
    aforo: int
    sectores: List[SectorOut]
