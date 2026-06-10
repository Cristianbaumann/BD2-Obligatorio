from pydantic import BaseModel
from datetime import datetime


class DisponibilidadOut(BaseModel):
    evento_id: str
    sector_id: int
    sector_nombre: str
    estadio_pais: str
    estadio_localidad: str
    capacidad_maxima: int
    entradas_emitidas: int
    disponibles: int


class MayorCompradorOut(BaseModel):
    mail: str
    total_entradas_compradas: int
    total_gastado: float


class EventoMasVendidoOut(BaseModel):
    evento_id: str
    fecha: datetime
    equipo_local: str
    equipo_visitante: str
    estadio_pais: str
    estadio_localidad: str
    total_entradas_vendidas: int


class CoberturFuncionarioOut(BaseModel):
    funcionario_mail: str
    evento_id: str
    sector_id: int
    sector_nombre: str
    sector_cubierto: bool
