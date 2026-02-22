import logging
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import Optional

from config import settings
from model_loader import model_registry
from context_manager import context_manager

# Import routers
from routers import (
    session_router,
    parse_router,
    analyze_router,
    enhance_router,
    finalize_router
)
from routers.enhanced_pipeline import router as enhanced_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('screenplay_backend.log')
    ]
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for FastAPI application.
    Loads all models at startup and cleans up on shutdown.
    """
    logger.info("=" * 60)
    logger.info("🎬 ScriptED Backend Starting...")
    logger.info("=" * 60)
    
    # Startup: Load all models
    try:
        logger.info("Loading models...")
        await model_registry.load_all_models()
        
        # Create necessary directories
        Path("temp_uploads").mkdir(exist_ok=True)
        Path(settings.CONTEXT_STORAGE_PATH).mkdir(exist_ok=True)
        
        logger.info("✅ Backend ready to accept requests!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown: Cleanup
    logger.info("Shutting down backend...")
    model_registry.cleanup()
    logger.info("✓ Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    description="Production-ready screenplay processing backend with persistent context management"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(session_router, prefix=settings.API_V1_PREFIX)
app.include_router(parse_router, prefix=settings.API_V1_PREFIX)
app.include_router(analyze_router, prefix=settings.API_V1_PREFIX)
app.include_router(enhance_router, prefix=settings.API_V1_PREFIX)
app.include_router(finalize_router, prefix=settings.API_V1_PREFIX)
app.include_router(enhanced_router, prefix=settings.API_V1_PREFIX)  # New dual-model pipeline

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ScriptED Backend API",
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    Verifies that all models are loaded and ready.
    """
    try:
        models_status = {
            "spacy": False,
            "minilm": False,
            "qwen": False,
            "qwen_processor": False
        }
        
        # Check if models are loaded
        try:
            model_registry.get_model('spacy')
            models_status["spacy"] = True
        except:
            pass
        
        try:
            model_registry.get_model('minilm')
            models_status["minilm"] = True
        except:
            pass
        
        try:
            qwen = model_registry.get_model('qwen')
            models_status["qwen"] = qwen is not None
        except:
            pass
        
        try:
            processor = model_registry.get_model('qwen_processor')
            models_status["qwen_processor"] = processor is not None
        except:
            pass
        
        all_ready = all([
            models_status["spacy"],
            models_status["minilm"]
        ])
        
        # Check if Qwen is loaded for AI enhancement features
        ai_ready = models_status.get("qwen", False)
        
        return {
            "status": "healthy" if all_ready else "partial",
            "models_loaded": models_status,
            "gpu_available": settings.USE_GPU,
            "ai_enhancement_ready": ai_ready,
            "version": settings.VERSION,
            "device": model_registry.device,
            "message": "🎉 All models ready!" if (all_ready and ai_ready) else 
                      "⏳ Loading AI models..." if not ai_ready else 
                      "✅ Basic models ready"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

class ProcessScriptRequest(BaseModel):
    raw_script: str = Field(..., min_length=1, description="The screenplay text to process")
    tone_target: Optional[str] = Field(None, description="Target tone for enhancement (e.g., 'dramatic', 'comedic')")
    product_context: Optional[str] = Field(None, description="Product context (e.g., 'Feature film', 'TV series')")
    
    @field_validator('raw_script')
    @classmethod
    def validate_raw_script(cls, v):
        if not v or not v.strip():
            raise ValueError("raw_script cannot be empty")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "raw_script": "INT. SCENE - DAY\n\nCHARACTER\nDialogue here...",
                "tone_target": "dramatic",
                "product_context": "Feature film"
            }
        }

@app.post(f"{settings.API_V1_PREFIX}/process-full-pipeline")
async def process_full_pipeline(request: ProcessScriptRequest):
    """
    Process complete pipeline in one call (convenience endpoint).
    
    Internally calls all stages sequentially:
    1. Create session
    2. Parse
    3. Analyze
    4. Enhance
    5. Finalize
    """
    try:
        # Create session
        session_id = await context_manager.create_session(
            raw_script=request.raw_script,
            tone_target=request.tone_target,
            product_context=request.product_context
        )
        
        logger.info(f"Full pipeline started for session: {session_id}")
        
        # Import services
        from services.spacy_service import spacy_service
        from services.embedding_service import embedding_service
        from services.qwen_service_ollama import qwen_service
        
        # Stage 1: Parse
        await context_manager.update_status(session_id, "parsing")
        context = await context_manager.get_context(session_id)
        parsed_structure = await spacy_service.parse_screenplay(context.raw_script)
        await context_manager.update_context(
            session_id,
            {"parsed_structure": parsed_structure, "status": "parsed"},
            stage_name="parse"
        )
        
        # Stage 2: Analyze
        await context_manager.update_status(session_id, "analyzing")
        analysis_results = await embedding_service.generate_embeddings(parsed_structure)
        await context_manager.update_context(
            session_id,
            {
                "embeddings": analysis_results.get("dialogue_embeddings", []),
                "analysis_results": analysis_results,
                "status": "analyzed"
            },
            stage_name="analyze"
        )
        
        # Stage 3: Enhance (skip if Qwen not available)
        await context_manager.update_status(session_id, "enhancing")
        context = await context_manager.get_context(session_id)
        
        # Check if Qwen model is available
        if model_registry.get_model("qwen") is not None:
            enhancement_results = await qwen_service.enhance_dialogues(
                parsed_structure=context.parsed_structure,
                tone_target=context.tone_target,
                product_context=context.product_context
            )
            enhanced_dialogues = enhancement_results.get("enhanced_dialogues", [])
        else:
            logger.warning("Qwen model not available, skipping enhancement stage")
            enhanced_dialogues = []
            
        await context_manager.update_context(
            session_id,
            {"enhanced_dialogues": enhanced_dialogues, "status": "enhanced"},
            stage_name="enhance"
        )
        
        # Stage 4: Finalize (skip if Qwen not available)
        await context_manager.update_status(session_id, "finalizing")
        context = await context_manager.get_context(session_id)
        full_context = {
            "parsed_structure": context.parsed_structure,
            "analysis_results": context.analysis_results,
            "enhanced_dialogues": context.enhanced_dialogues,
            "embeddings": context.embeddings
        }
        
        # Check if Qwen model is available for finalization
        if model_registry.get_model("qwen") is not None:
            final_results = await qwen_service.generate_final_screenplay(
                context=full_context,
                tone_target=context.tone_target
            )
            final_screenplay = final_results.get("final_screenplay")
        else:
            logger.warning("Qwen model not available, using original screenplay as final output")
            final_screenplay = context.raw_script
            
        await context_manager.update_context(
            session_id,
            {"final_screenplay": final_screenplay, "status": "completed"},
            stage_name="finalize"
        )
        
        # Get final context
        final_context = await context_manager.get_context(session_id)
        
        return {
            "session_id": session_id,
            "status": "completed",
            "final_screenplay": final_context.final_screenplay,
            "pipeline_history": final_context.pipeline_history,
            "parsed_scenes": parsed_structure.get("total_scenes", 0),
            "parsed_dialogues": parsed_structure.get("total_dialogues", 0),
            "embeddings_generated": analysis_results.get("total_embeddings", 0)
        }
        
    except Exception as e:
        logger.error(f"Full pipeline failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "session_id": session_id if 'session_id' in locals() else None}
        )

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Set to True for development
        log_level="info"
    )
