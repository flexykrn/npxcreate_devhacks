from pydantic_settings import BaseSettings
from typing import Optional
import torch

class Settings(BaseSettings):
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "ScriptED Backend"
    VERSION: str = "1.0.0"
    
    # CORS Configuration
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # Model Paths
    SPACY_MODEL: str = "en_core_web_sm"
    MINILM_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Dual Model Configuration
    TEXT_MODEL: str = "llama3.2:latest"  # For text enhancement and dialogue
    VISION_MODEL: str = "minicpm-v:latest"  # For image analysis
    QWEN_MODEL: str = "llama3.2:latest"  # Backward compatibility
    
    # Ollama Configuration
    USE_OLLAMA: bool = True
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # GPU Configuration
    USE_GPU: bool = torch.cuda.is_available()
    GPU_MEMORY_FRACTION: float = 0.85  # Use 85% of 6GB
    LOAD_IN_4BIT: bool = True
    
    # Context Storage
    CONTEXT_STORAGE_PATH: str = "./context_store"
    CONTEXT_TTL_HOURS: int = 24
    MAX_CONTEXT_SIZE_MB: int = 100
    
    # Redis (optional for production)
    REDIS_URL: Optional[str] = None
    USE_REDIS: bool = False
    
    # Processing
    MAX_CONCURRENT_JOBS: int = 3
    JOB_TIMEOUT_SECONDS: int = 600
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
