import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import shutil
from pathlib import Path

from models.requests import ScriptProcessRequest
from models.responses import SessionResponse
from context_manager import context_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/session", tags=["Session"])

@router.post("/create", response_model=SessionResponse)
async def create_session(
    raw_script: str = Form(...),
    tone_target: Optional[str] = Form(None),
    product_context: Optional[str] = Form(None),
    scene_image: Optional[UploadFile] = File(None)
):
    """
    Create a new screenplay processing session.
    
    This initializes the context and prepares for pipeline processing.
    
    Args:
        raw_script: Raw screenplay text
        tone_target: Target tone/mood
        product_context: Optional product placement context
        scene_image: Optional scene image file
        
    Returns:
        Session ID and initial status
    """
    try:
        # Handle image upload if provided
        image_path = None
        if scene_image:
            upload_dir = Path("temp_uploads")
            upload_dir.mkdir(exist_ok=True)
            
            image_path = upload_dir / scene_image.filename
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(scene_image.file, buffer)
            
            logger.info(f"Image uploaded: {image_path}")
        
        # Create session and initialize context
        session_id = await context_manager.create_session(
            raw_script=raw_script,
            tone_target=tone_target,
            product_context=product_context,
            scene_image_path=str(image_path) if image_path else None
        )
        
        # Get created context
        context = await context_manager.get_context(session_id)
        
        return SessionResponse(
            session_id=session_id,
            status=context.status,
            message="Session created successfully",
            created_at=context.created_at
        )
        
    except Exception as e:
        logger.error(f"Session creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}")
async def get_session_status(session_id: str):
    """
    Get current status and context for a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Complete session context and status
    """
    try:
        context = await context_manager.get_context(session_id)
        
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": context.session_id,
            "status": context.status,
            "created_at": context.created_at,
            "updated_at": context.updated_at,
            "pipeline_history": context.pipeline_history,
            "errors": context.errors,
            "has_parsed_structure": context.parsed_structure is not None,
            "has_embeddings": context.embeddings is not None,
            "has_enhanced_dialogues": context.enhanced_dialogues is not None,
            "has_final_screenplay": context.final_screenplay is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/result")
async def get_final_result(session_id: str):
    """
    Get the final screenplay result for a completed session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Final screenplay and all context data
    """
    try:
        context = await context_manager.get_context(session_id)
        
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if context.status != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Session not completed. Current status: {context.status}"
            )
        
        return {
            "session_id": context.session_id,
            "status": context.status,
            "final_screenplay": context.final_screenplay,
            "parsed_structure": context.parsed_structure,
            "analysis_results": context.analysis_results,
            "enhanced_dialogues": context.enhanced_dialogues,
            "pipeline_history": context.pipeline_history
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get final result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a session and its context.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Deletion confirmation
    """
    try:
        deleted = await context_manager.delete_session(session_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted successfully", "session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_sessions():
    """
    List all active sessions.
    
    Returns:
        List of sessions with basic info
    """
    try:
        sessions = await context_manager.list_sessions()
        return {"sessions": sessions, "total": len(sessions)}
        
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
