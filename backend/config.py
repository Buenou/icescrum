from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    icescrum_url: str
    icescrum_token: str
    database_url: str

    class Config:
        env_file = ".env"

settings = Settings()
