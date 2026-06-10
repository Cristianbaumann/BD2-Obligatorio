from pydantic import BaseModel


class EquipoCreate(BaseModel):
    nombre: str


class EquipoOut(BaseModel):
    id: str
    nombre: str
