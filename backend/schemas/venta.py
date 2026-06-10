from pydantic import BaseModel, field_validator
from typing import List
from datetime import datetime


class EntradaVentaItem(BaseModel):
    evento_id: str
    sector_id: int


class VentaCreate(BaseModel):
    entradas: List[EntradaVentaItem]

    @field_validator("entradas")
    @classmethod
    def validar_cantidad(cls, v):
        if len(v) == 0:
            raise ValueError("Debe incluir al menos 1 entrada")
        if len(v) > 5:
            raise ValueError("Máximo 5 entradas por venta")
        return v


class EntradaOut(BaseModel):
    id: str
    venta_id: str
    titular_mail: str
    costo: float
    evento_id: str
    sector_id: int
    consumido: bool


class VentaOut(BaseModel):
    id: str
    usuario_mail: str
    fecha: datetime
    estado_id: int
    precio: float
    tasa_comision: float
    entradas: List[EntradaOut] = []
