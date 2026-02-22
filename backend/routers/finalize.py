import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks

from models.requests import FinalizeRequest
from models.responses import FinalizeResponse
from context_manager import context_manager
from services.qwen_service_ollama import qwen_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/finalize", tags=["Finalize"])

@router.post("/", response_model=FinalizeResponse)
async def finalize_screenplay(
    request: FinalizeRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate final polished screenplay using all context.
    
    This is Stage 4 (final) of the pipeline:
    - Synthesizes all previous stages
    - Generates production-ready screenplay
    - Applies proper formatting
    - Updates context with final output
    """
    try:
        logger.info(f"Starting finalization for session: {request.session_id}")
        
        # Get complete context
        context = await context_manager.get_context(request.session_id)
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Ensure all previous stages are complete
        if not context.parsed_structure:
            raise HTTPException(
                status_code=400,
                detail="Screenplay must be parsed before finalization"
            )
        
        # Update status
        await context_manager.update_status(request.session_id, "finalizing")
        
        # Prepare context dict for Qwen
        full_context = {
            "parsed_structure": context.parsed_structure,
            "analysis_results": context.analysis_results,
            "enhanced_dialogues": context.enhanced_dialogues,
            "embeddings": context.embeddings,
            "scene_image_path": context.scene_image_path,
            "product_context": context.product_context
        }
        
        # Generate final screenplay with Qwen
        final_results = await qwen_service.generate_final_screenplay(
            context=full_context,
            tone_target=context.tone_target,
            include_formatting=request.include_formatting
        )
        
        # Update context with final screenplay
        await context_manager.update_context(
            request.session_id,
            {
                "final_screenplay": final_results.get("final_screenplay"),
                "status": "completed"
            },
            stage_name="finalize"
        )
        
        return FinalizeResponse(
            session_id=request.session_id,
            stage="finalize",
            status="completed",
            message="Screenplay finalized successfully",
            data=final_results,
            final_screenplay=final_results.get("final_screenplay"),
            word_count=final_results.get("word_count", 0)
        )
        
    except Exception as e:
        logger.error(f"Finalization failed for session {request.session_id}: {e}")
        await context_manager.add_error(request.session_id, "finalize", str(e))
        await context_manager.update_status(request.session_id, "finalization_failed")
        raise HTTPException(status_code=500, detail=str(e))
