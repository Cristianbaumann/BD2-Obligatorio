from pydantic import BaseModel
from datetime import datetime


class ValidacionCreate(BaseModel):
    codigo_hash: str
    dispositivo_id: str


class ValidacionOut(BaseModel):
    id: str
    entrada_id: str
    qr_id: str
    dispositivo_id: str
    funcionario_mail: str
    timestamp_val: datetime
