import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional

from models.requests import ParseRequest
from models.responses import ParseResponse
from context_manager import context_manager
from services.spacy_service import spacy_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/parse", tags=["Parse"])

@router.post("/", response_model=ParseResponse)
async def parse_screenplay(
    request: ParseRequest,
    background_tasks: BackgroundTasks
):
    """
    Parse screenplay into structured format using spaCy.
    
    This is Stage 1 of the pipeline:
    - Extracts scenes, dialogues, characters
    - Creates structured representation
    - Updates context with parsed data
    """
    try:
        logger.info(f"Starting parse for session: {request.session_id}")
        
        # Get context
        context = await context_manager.get_context(request.session_id)
        if not context:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update status
        await context_manager.update_status(request.session_id, "parsing")
        
        # Parse with spaCy
        parsed_structure = await spacy_service.parse_screenplay(context.raw_script)
        
        # Update context with parsed data
        await context_manager.update_context(
            request.session_id,
            {
                "parsed_structure": parsed_structure,
                "status": "parsed"
            },
            stage_name="parse"
        )
        
        return ParseResponse(
            session_id=request.session_id,
            stage="parse",
            status="completed",
            message="Screenplay parsed successfully",
            data=parsed_structure,
            parsed_scenes=parsed_structure.get("total_scenes", 0),
            parsed_dialogues=parsed_structure.get("total_dialogues", 0)
        )
        
    except Exception as e:
        logger.error(f"Parse failed for session {request.session_id}: {e}")
        await context_manager.add_error(request.session_id, "parse", str(e))
        await context_manager.update_status(request.session_id, "parse_failed")
        raise HTTPException(status_code=500, detail=str(e))
