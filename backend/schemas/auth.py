from pydantic import BaseModel, EmailStr
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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    mail: str


class UserResponse(BaseModel):
    mail: str
    nombre: str
    apellido: str
    rol: str
