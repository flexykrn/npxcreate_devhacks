import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import uuid
import shutil
from pathlib import Path

from services.dual_model_service import dual_model_service
from context_manager import context_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/enhanced", tags=["Enhanced Pipeline"])

@router.post("/stage1-director")
async def stage1_director_enhancement(
    raw_text: str = Form(...),
    tone_target: Optional[str] = Form(None)
):
    """
    Stage 1: Text-only enhancement using Llama3.2 as a professional director.
    
    User provides raw screenplay text.
    Returns industry-standard formatted screenplay.
    """
    try:
        logger.info("📝 Starting Stage 1: Director Enhancement")
        
        # Create initial session (using create_session, not create_context)
        session_id = await context_manager.create_session(
            raw_script=raw_text,
            tone_target=tone_target
        )
        
        # Enhance with director AI (Llama3.2)
        result = await dual_model_service.enhance_text_as_director(
            raw_text=raw_text,
            tone_target=tone_target
        )
        
        # Store Stage 1 result
        await context_manager.update_context(
            session_id,
            {
                "stage1_output": result.get("enhanced_screenplay"),
                "model_used_stage1": result.get("model_used"),
                "status": "stage1_complete"
            },
            stage_name="stage1_director"
        )
        
        return {
            "session_id": session_id,
            "stage": "stage1_director",
            "status": "success",
            "model_used": result.get("model_used"),
            "enhanced_screenplay": result.get("enhanced_screenplay"),
            "message": "✅ Stage 1 complete! Text enhanced by AI director."
        }
        
    except Exception as e:
        logger.error(f"Stage 1 failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stage2-vision")
async def stage2_vision_enhancement(
    session_id: str = Form(...),
    image: UploadFile = File(...),
    scene_context: Optional[str] = Form(None)
):
    """
    Stage 2: Image analysis using MiniCPM-V vision model.
    
    User uploads an image for a scene.
    Vision AI analyzes it and integrates visual context into Stage 1 output.
    """
    try:
        logger.info(f"🖼️ Starting Stage 2: Vision Enhancement for session {session_id}")
        
        # Get Stage 1 context
        context = await context_manager.get_context(session_id)
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if not context.stage1_output:
            raise HTTPException(
                status_code=400,
                detail="Stage 1 must be completed before Stage 2"
            )
        
        # Save uploaded image
        upload_dir = Path("temp_uploads")
        upload_dir.mkdir(exist_ok=True)
        
        image_path = upload_dir / f"{session_id}_{image.filename}"
        with image_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        logger.info(f"Image saved: {image_path}")
        
        # Analyze image with vision model (MiniCPM-V)
        result = await dual_model_service.analyze_image_and_enhance(
            enhanced_screenplay=context.stage1_output,
            image_path=str(image_path),
            scene_context=scene_context
        )
        
        # Store Stage 2 result
        await context_manager.update_context(
            session_id,
            {
                "stage2_output": result.get("final_screenplay"),
                "visual_description": result.get("visual_description"),
                "model_used_stage2": result.get("model_used"),
                "image_path": str(image_path),
                "final_screenplay": result.get("final_screenplay"),
                "status": "completed"
            },
            stage_name="stage2_vision"
        )
        
        return {
            "session_id": session_id,
            "stage": "stage2_vision",
            "status": "success",
            "model_used": result.get("model_used"),
            "visual_description": result.get("visual_description"),
            "final_screenplay": result.get("final_screenplay"),
            "message": "✅ Stage 2 complete! Visual context added."
        }
        
    except Exception as e:
        logger.error(f"Stage 2 failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session_result(session_id: str):
    """
    Get the complete result for a session (both stages if completed).
    """
    try:
        context = await context_manager.get_context(session_id)
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session_id,
            "status": context.status,
            "stage1_complete": bool(context.stage1_output),
            "stage2_complete": bool(context.stage2_output),
            "stage1_output": context.stage1_output,
            "stage2_output": context.stage2_output,
            "visual_description": context.visual_description,
            "final_screenplay": context.final_screenplay or context.stage2_output or context.stage1_output
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve session: {e}")
        raise HTTPException(status_code=500, detail=str(e))
