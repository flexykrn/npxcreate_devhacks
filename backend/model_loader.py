import logging
from typing import Dict, Any, Optional
import torch
import spacy
from sentence_transformers import SentenceTransformer
import gc

from config import settings

logger = logging.getLogger(__name__)

class ModelRegistry:
    """
    Global singleton registry that loads all models once at startup
    and maintains them in memory throughout the application lifecycle.
    """
    
    _instance: Optional['ModelRegistry'] = None
    _initialized: bool = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.models: Dict[str, Any] = {}
            self.device = "cuda" if settings.USE_GPU else "cpu"
            self._initialized = True
            logger.info(f"ModelRegistry initialized. Device: {self.device}")
    
    async def load_all_models(self):
        """
        Load all models at startup. This is called once when FastAPI starts.
        """
        logger.info("🚀 Starting model loading sequence...")
        
        try:
            # 1. Load spaCy (CPU-based, fast)
            await self._load_spacy()
            
            # 2. Load MiniLM embeddings (CPU-based)
            await self._load_minilm()
            
            # 3. Load Qwen via Ollama
            if settings.USE_OLLAMA:
                logger.info("� Ollama enabled - Loading Qwen model...")
                await self._load_qwen()
            else:
                logger.info("ℹ️  Ollama disabled - Skipping Qwen model")
            
            logger.info("✅ All models loaded successfully!")
            self._log_memory_usage()
            
        except Exception as e:
            logger.error(f"❌ Model loading failed: {str(e)}")
            raise
    
    async def _load_spacy(self):
        """Load spaCy model for script parsing"""
        logger.info("Loading spaCy model...")
        try:
            nlp = spacy.load(settings.SPACY_MODEL)
            # Add custom components if needed
            if "sentencizer" not in nlp.pipe_names:
                nlp.add_pipe("sentencizer")
            
            self.models['spacy'] = nlp
            logger.info(f"✓ spaCy loaded: {settings.SPACY_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load spaCy: {e}")
            raise
    
    async def _load_minilm(self):
        """Load MiniLM for embeddings and similarity"""
        logger.info("Loading MiniLM model...")
        try:
            model = SentenceTransformer(settings.MINILM_MODEL)
            model.to('cpu')  # Force CPU
            
            self.models['minilm'] = model
            logger.info(f"✓ MiniLM loaded: {settings.MINILM_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load MiniLM: {e}")
            raise
    
    async def _load_qwen(self):
        """Load Qwen model via Ollama"""
        logger.info("Loading Qwen model via Ollama...")
        
        if not settings.USE_OLLAMA:
            logger.warning("⚠️ Ollama not enabled. Skipping Qwen model.")
            self.models['qwen'] = None
            return
        
        try:
            import ollama
            
            # Test Ollama connection
            logger.info(f"Connecting to Ollama at {settings.OLLAMA_BASE_URL}...")
            
            # List available models
            models_list = ollama.list()
            
            # Extract model names - Ollama API returns ListResponse with models attribute
            if hasattr(models_list, 'models'):
                models = models_list.models
            elif isinstance(models_list, dict):
                models = models_list.get('models', [])
            else:
                models = []
            
            model_names = []
            for model in models:
                # Ollama Python client Model object uses 'model' attribute
                if hasattr(model, 'model'):
                    model_names.append(model.model)
                elif isinstance(model, dict) and 'model' in model:
                    model_names.append(model['model'])
                elif hasattr(model, 'name'):
                    model_names.append(model.name)
                elif isinstance(model, dict) and 'name' in model:
                    model_names.append(model['name'])
            
            logger.info(f"Available Ollama models: {model_names}")
            
            # Check if our model is available
            if settings.QWEN_MODEL not in model_names:
                logger.error(f"Model '{settings.QWEN_MODEL}' not found in Ollama")
                logger.info(f"Available models: {', '.join(model_names)}")
                self.models['qwen'] = None
                return
            
            # Store Ollama client
            self.models['qwen'] = 'ollama'  # Marker that Ollama is available
            self.models['qwen_model_name'] = settings.QWEN_MODEL
            
            logger.info(f"Qwen model ready via Ollama: {settings.QWEN_MODEL}")
            
        except ImportError:
            logger.error("Ollama package not installed. Run: pip install ollama")
            self.models['qwen'] = None
        except Exception as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            logger.info("Make sure Ollama is running with: ollama serve")
            self.models['qwen'] = None
    
    def get_model(self, model_name: str) -> Any:
        """Retrieve a loaded model by name"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not found in registry")
        return self.models[model_name]
    
    def _log_memory_usage(self):
        """Log GPU memory usage"""
        if settings.USE_GPU:
            allocated = torch.cuda.memory_allocated() / 1024**3
            reserved = torch.cuda.memory_reserved() / 1024**3
            logger.info(f"📊 GPU Memory - Allocated: {allocated:.2f}GB, Reserved: {reserved:.2f}GB")
    
    def cleanup(self):
        """Cleanup models on shutdown"""
        logger.info("Cleaning up models...")
        self.models.clear()
        if settings.USE_GPU:
            torch.cuda.empty_cache()
        gc.collect()
        logger.info("✓ Models cleaned up")

# Global registry instance
model_registry = ModelRegistry()
