from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QrInfo(BaseModel):
    id: str
    codigo_hash: str
    creado_en: datetime
    activo: bool


class EventoInfo(BaseModel):
    fecha: datetime
    equipo_local: str
    equipo_visitante: str
    sector_nombre: str
    estadio_nombre: Optional[str] = None
    cancelado: bool = False


class EntradaConInfoOut(BaseModel):
    id: str
    venta_id: str
    titular_mail: str
    costo: float
    evento_id: str
    sector_id: int
    consumido: bool
    evento: EventoInfo
    qr: Optional[QrInfo] = None


class TitularInfo(BaseModel):
    mail: str
    nombre: str
    apellido: str


class TransferenciaHistorialItem(BaseModel):
    id: str
    origen_mail: str
    destino_mail: str
    fecha: datetime
    estado: str


class EntradaDetalleOut(BaseModel):
    id: str
    venta_id: str
    titular: TitularInfo
    costo: float
    evento: EventoInfo
    consumido: bool
    estado: str
    historial_transferencias: list[TransferenciaHistorialItem]
