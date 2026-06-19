from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    apellido: str
    doc_pais: str
    doc_tipo: str
    doc_numero: str
    dir_pais: str
    dir_localidad: str
    dir_calle: str
    dir_numero: str
    dir_codigo_postal: Optional[str] = None
    telefonos: List[str] = []

    @field_validator("telefonos")
    @classmethod
    def al_menos_un_telefono(cls, v):
        non_empty = [t for t in v if t.strip()]
        if not non_empty:
            raise ValueError("Debe proporcionar al menos un número de teléfono")
        return non_empty


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    mail: str
    estado_verificacion: Optional[str] = None


class UserResponse(BaseModel):
    mail: str
    nombre: str
    apellido: str
    rol: str
