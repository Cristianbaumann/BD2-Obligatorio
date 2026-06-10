from pydantic import BaseModel, EmailStr


class DispositivoCreate(BaseModel):
    funcionario_mail: EmailStr


class DispositivoOut(BaseModel):
    id: str
    funcionario_mail: str
    activo: bool
