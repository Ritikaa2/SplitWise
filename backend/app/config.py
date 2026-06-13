import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "SplitWise Pro"
    API_V1_STR: str = "/api"
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="mysql+pymysql://root@localhost/splitwise_pro",
        env="DATABASE_URL"
    )
    
    # Security Configuration
    JWT_SECRET: str = Field(
        default="splitwiseprosecretkeyforskilledinternshipevaluation2026",
        env="JWT_SECRET"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
