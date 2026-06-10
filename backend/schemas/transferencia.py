from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class EstadoTransferenciaEnum(str, Enum):
    PENDIENTE = "PENDIENTE"
    ACEPTADA = "ACEPTADA"
    RECHAZADA = "RECHAZADA"


class TransferenciaCreate(BaseModel):
    entrada_id: str
    destino_mail: EmailStr


class TransferenciaResponder(BaseModel):
    estado: EstadoTransferenciaEnum


class TransferenciaOut(BaseModel):
    id: str
    entrada_id: str
    origen_mail: str
    destino_mail: str
    fecha: datetime
    estado: str
