from pydantic import BaseModel, EmailStr
from typing import List, Optional
from enum import Enum


class RolEnum(str, Enum):
    ADMIN = "ADMIN"
    FUNCIONARIO = "FUNCIONARIO"
    USUARIO_FINAL = "USUARIO_FINAL"


class EstadoVerificacionEnum(str, Enum):
    PENDIENTE = "PENDIENTE"
    VERIFICADO = "VERIFICADO"
    RECHAZADO = "RECHAZADO"


class UsuarioCreate(BaseModel):
    mail: EmailStr
    password: str
    rol: RolEnum

    doc_pais: str
    doc_tipo: str
    doc_numero: str

    dir_pais: str
    dir_localidad: str
    dir_calle: str
    dir_numero: str
    dir_codigo_postal: Optional[str] = None

    telefonos: List[str] = []


class UsuarioOut(BaseModel):
    mail: str
    nombre: Optional[str]
    apellido: Optional[str]
    rol: str
    doc_pais: str
    doc_tipo: str
    doc_numero: str
    dir_pais: str
    dir_localidad: str
    dir_calle: str
    dir_numero: str
    dir_codigo_postal: Optional[str]
    estado_verificacion: Optional[str] = None


class MeOut(BaseModel):
    mail: str
    nombre: Optional[str]
    apellido: Optional[str]
    rol: str
    doc_pais: str
    doc_tipo: str
    doc_numero: str
    dir_pais: str
    dir_localidad: str
    dir_calle: str
    dir_numero: str
    dir_codigo_postal: Optional[str]
    estado_verificacion: Optional[str] = None
    saldo: Optional[float] = None
    telefonos: List[str] = []


class UsuarioUpdate(BaseModel):
    dir_pais: Optional[str] = None
    dir_localidad: Optional[str] = None
    dir_calle: Optional[str] = None
    dir_numero: Optional[str] = None
    dir_codigo_postal: Optional[str] = None
    telefonos: Optional[List[str]] = None


# Datos extra según rol
class AdminOut(BaseModel):
    pais_sede: str
    fecha_asignacion_cargo: str


class FuncionarioOut(BaseModel):
    numero_legajo: str


class UsuarioFinalOut(BaseModel):
    fecha_registro: str
    estado_verificacion: str
