from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime


class EntradaVentaItem(BaseModel):
    evento_id: str
    sector_id: int
    cantidad: int = 1


class VentaCreate(BaseModel):
    entradas: List[EntradaVentaItem]

    @field_validator("entradas")
    @classmethod
    def validar_cantidad(cls, v):
        if len(v) == 0:
            raise ValueError("Debe incluir al menos 1 entrada")
        for item in v:
            if item.cantidad < 1:
                raise ValueError("Cada cantidad debe ser al menos 1")
        total = sum(item.cantidad for item in v)
        if total > 5:
            raise ValueError("Máximo 5 entradas por transacción")
        return v


class EntradaOut(BaseModel):
    id: str
    venta_id: str
    titular_mail: str
    costo: float
    evento_id: str
    sector_id: int
    consumido: bool
    evento_nombre: Optional[str] = None
    sector_nombre: Optional[str] = None


class VentaEstadoUpdate(BaseModel):
    nuevo_estado: str


class VentaOut(BaseModel):
    id: str
    usuario_mail: str
    fecha: datetime
    estado_id: int
    precio: float
    tasa_comision: float
    entradas: List[EntradaOut] = []
    segundos_restantes: Optional[int] = None
