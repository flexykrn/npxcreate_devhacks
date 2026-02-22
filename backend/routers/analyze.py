import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks

from models.requests import AnalyzeRequest
from models.responses import AnalyzeResponse
from context_manager import context_manager
from services.embedding_service import embedding_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["Analyze"])

@router.post("/", response_model=AnalyzeResponse)
async def analyze_screenplay(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze screenplay using embeddings and similarity metrics.
    
    This is Stage 2 of the pipeline:
    - Generates embeddings for dialogues and scenes
    - Computes similarity metrics
    - Analyzes narrative coherence
    - Updates context with analysis results
    """
    try:
        logger.info(f"Starting analysis for session: {request.session_id}")
        
        # Get context
        context = await context_manager.get_context(request.session_id)
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Ensure parsing is complete
        if not context.parsed_structure:
            raise HTTPException(
                status_code=400,
                detail="Screenplay must be parsed before analysis"
            )
        
        # Update status
        await context_manager.update_status(request.session_id, "analyzing")
        
        # Generate embeddings and analyze
        analysis_results = await embedding_service.generate_embeddings(
            context.parsed_structure
        )
        
        # Update context with analysis data
        await context_manager.update_context(
            request.session_id,
            {
                "embeddings": analysis_results.get("dialogue_embeddings", []),
                "analysis_results": analysis_results,
                "status": "analyzed"
            },
            stage_name="analyze"
        )
        
        similarity_analysis = analysis_results.get("similarity_analysis", {})
        
        return AnalyzeResponse(
            session_id=request.session_id,
            stage="analyze",
            status="completed",
            message="Screenplay analyzed successfully",
            data=analysis_results,
            embeddings_generated=analysis_results.get("total_embeddings", 0),
            similarity_scores={
                "dialogue_coherence": similarity_analysis.get("dialogue_coherence", 0.0),
                "scene_coherence": similarity_analysis.get("scene_coherence", 0.0)
            }
        )
        
    except Exception as e:
        logger.error(f"Analysis failed for session {request.session_id}: {e}")
        await context_manager.add_error(request.session_id, "analyze", str(e))
        await context_manager.update_status(request.session_id, "analysis_failed")
        raise HTTPException(status_code=500, detail=str(e))
