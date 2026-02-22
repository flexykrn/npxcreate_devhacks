import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks

from models.requests import EnhanceRequest
from models.responses import EnhanceResponse
from context_manager import context_manager
from services.qwen_service_ollama import qwen_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/enhance", tags=["Enhance"])

@router.post("/", response_model=EnhanceResponse)
async def enhance_dialogues(
    request: EnhanceRequest,
    background_tasks: BackgroundTasks
):
    """
    Enhance dialogues using Qwen2-VL multimodal model.
    
    This is Stage 3 of the pipeline:
    - Enhances dialogue quality and emotion
    - Incorporates tone target
    - Considers visual context if available
    - Updates context with enhanced dialogues
    """
    try:
        logger.info(f"Starting enhancement for session: {request.session_id}")
        
        # Get context
        context = await context_manager.get_context(request.session_id)
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Ensure analysis is complete
        if not context.parsed_structure:
            raise HTTPException(
                status_code=400,
                detail="Screenplay must be parsed before enhancement"
            )
        
        # Update status
        await context_manager.update_status(request.session_id, "enhancing")
        
        # Enhance dialogues with Qwen
        enhancement_results = await qwen_service.enhance_dialogues(
            parsed_structure=context.parsed_structure,
            tone_target=context.tone_target,
            product_context=context.product_context,
            image_path=context.scene_image_path
        )
        
        # Update context with enhanced data
        await context_manager.update_context(
            request.session_id,
            {
                "enhanced_dialogues": enhancement_results.get("enhanced_dialogues", []),
                "status": "enhanced"
            },
            stage_name="enhance"
        )
        
        return EnhanceResponse(
            session_id=request.session_id,
            stage="enhance",
            status="completed",
            message="Dialogues enhanced successfully",
            data=enhancement_results,
            dialogues_enhanced=enhancement_results.get("total_enhanced", 0)
        )
        
    except Exception as e:
        logger.error(f"Enhancement failed for session {request.session_id}: {e}")
        await context_manager.add_error(request.session_id, "enhance", str(e))
        await context_manager.update_status(request.session_id, "enhancement_failed")
        raise HTTPException(status_code=500, detail=str(e))
