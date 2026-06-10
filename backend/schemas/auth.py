from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    mail: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    mail: str
