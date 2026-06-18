from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "ticketing"

    AUTH0_DOMAIN: str = ""
    AUTH0_MGMT_CLIENT_ID: str = ""
    AUTH0_MGMT_CLIENT_SECRET: str = ""
    AUTH0_CLIENT_ID: str = ""
    AUTH0_CLIENT_SECRET: str = ""
    AUTH0_AUDIENCE: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
