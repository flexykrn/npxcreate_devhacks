import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List
import aiofiles
import asyncio
from dataclasses import dataclass, asdict, field

from config import settings

logger = logging.getLogger(__name__)

@dataclass
class ScreenplayContext:
    """
    Complete screenplay context that evolves through the pipeline.
    This is the core data structure that persists across all model stages.
    """
    session_id: str
    created_at: str
    updated_at: str
    status: str  # "initialized", "parsing", "analyzing", "enhancing", "finalizing", "completed"
    
    # Input data
    raw_script: Optional[str] = None
    tone_target: Optional[str] = None
    product_context: Optional[str] = None
    scene_image_path: Optional[str] = None
    
    # Stage outputs
    parsed_structure: Optional[Dict[str, Any]] = None
    embeddings: Optional[Dict[str, List[float]]] = None
    analysis_results: Optional[Dict[str, Any]] = None
    enhanced_dialogues: Optional[List[Dict[str, Any]]] = None
    final_screenplay: Optional[str] = None
    
    # Enhanced two-stage pipeline outputs
    stage1_output: Optional[str] = None  # Director-enhanced text (Llama3.2)
    stage2_output: Optional[str] = None  # Vision-integrated final (MiniCPM-V)
    visual_description: Optional[str] = None  # Description from vision model
    model_used_stage1: Optional[str] = None
    model_used_stage2: Optional[str] = None
    image_path: Optional[str] = None
    
    # Metadata
    pipeline_history: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)
    
    def add_stage_completion(self, stage_name: str, output: Dict[str, Any]):
        """Record completion of a pipeline stage"""
        self.pipeline_history.append({
            "stage": stage_name,
            "timestamp": datetime.utcnow().isoformat(),
            "output_keys": list(output.keys()) if output else []
        })
        self.updated_at = datetime.utcnow().isoformat()
    
    def add_error(self, stage_name: str, error_message: str):
        """Record an error during processing"""
        self.errors.append({
            "stage": stage_name,
            "error": error_message,
            "timestamp": datetime.utcnow().isoformat()
        })


class ContextManager:
    """
    MCP-style context manager that maintains persistent screenplay context
    across all pipeline stages. Uses file-based storage with optional Redis support.
    """
    
    def __init__(self):
        self.storage_path = Path(settings.CONTEXT_STORAGE_PATH)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self._lock = asyncio.Lock()
        logger.info(f"ContextManager initialized. Storage: {self.storage_path}")
    
    def _get_context_file_path(self, session_id: str) -> Path:
        """Get the file path for a session's context"""
        return self.storage_path / f"{session_id}.json"
    
    async def create_session(
        self,
        raw_script: str,
        tone_target: Optional[str] = None,
        product_context: Optional[str] = None,
        scene_image_path: Optional[str] = None
    ) -> str:
        """
        Create a new screenplay processing session and initialize context.
        
        Returns:
            session_id: Unique identifier for this session
        """
        session_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        context = ScreenplayContext(
            session_id=session_id,
            created_at=now,
            updated_at=now,
            status="initialized",
            raw_script=raw_script,
            tone_target=tone_target,
            product_context=product_context,
            scene_image_path=scene_image_path
        )
        
        await self._save_context(session_id, context)
        logger.info(f"✓ Session created: {session_id}")
        return session_id
    
    async def get_context(self, session_id: str) -> Optional[ScreenplayContext]:
        """
        Retrieve the full context for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            ScreenplayContext or None if not found
        """
        context_file = self._get_context_file_path(session_id)
        
        if not context_file.exists():
            logger.warning(f"Context not found for session: {session_id}")
            return None
        
        try:
            async with aiofiles.open(context_file, 'r') as f:
                content = await f.read()
                data = json.loads(content)
                
                # Convert back to ScreenplayContext
                context = ScreenplayContext(**data)
                return context
                
        except Exception as e:
            logger.error(f"Failed to load context for {session_id}: {e}")
            return None
    
    async def update_context(
        self,
        session_id: str,
        updates: Dict[str, Any],
        stage_name: Optional[str] = None
    ) -> bool:
        """
        Update context with new data from a pipeline stage.
        
        Args:
            session_id: Session identifier
            updates: Dictionary of fields to update
            stage_name: Name of the stage making the update
            
        Returns:
            True if successful, False otherwise
        """
        async with self._lock:
            context = await self.get_context(session_id)
            
            if context is None:
                logger.error(f"Cannot update: session {session_id} not found")
                return False
            
            # Update fields
            for key, value in updates.items():
                if hasattr(context, key):
                    setattr(context, key, value)
            
            context.updated_at = datetime.utcnow().isoformat()
            
            # Record stage completion if provided
            if stage_name:
                context.add_stage_completion(stage_name, updates)
            
            await self._save_context(session_id, context)
            logger.info(f"✓ Context updated for session {session_id} (stage: {stage_name})")
            return True
    
    async def update_status(self, session_id: str, status: str) -> bool:
        """Update the processing status"""
        return await self.update_context(session_id, {"status": status})
    
    async def add_error(self, session_id: str, stage_name: str, error_message: str) -> bool:
        """Record an error for a session"""
        context = await self.get_context(session_id)
        if context:
            context.add_error(stage_name, error_message)
            await self._save_context(session_id, context)
            return True
        return False
    
    async def _save_context(self, session_id: str, context: ScreenplayContext):
        """Persist context to disk"""
        context_file = self._get_context_file_path(session_id)
        
        try:
            # Convert to dict
            context_dict = asdict(context)
            
            async with aiofiles.open(context_file, 'w') as f:
                await f.write(json.dumps(context_dict, indent=2))
                
        except Exception as e:
            logger.error(f"Failed to save context for {session_id}: {e}")
            raise
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session and its context"""
        context_file = self._get_context_file_path(session_id)
        
        try:
            if context_file.exists():
                os.remove(context_file)
                logger.info(f"✓ Session deleted: {session_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {e}")
            return False
    
    async def list_sessions(self) -> List[Dict[str, Any]]:
        """List all active sessions"""
        sessions = []
        
        for context_file in self.storage_path.glob("*.json"):
            try:
                async with aiofiles.open(context_file, 'r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    sessions.append({
                        "session_id": data.get("session_id"),
                        "status": data.get("status"),
                        "created_at": data.get("created_at"),
                        "updated_at": data.get("updated_at")
                    })
            except Exception as e:
                logger.error(f"Failed to read session file {context_file}: {e}")
        
        return sessions
    
    async def cleanup_old_sessions(self):
        """Remove sessions older than TTL"""
        cutoff_time = datetime.utcnow() - timedelta(hours=settings.CONTEXT_TTL_HOURS)
        
        for context_file in self.storage_path.glob("*.json"):
            try:
                async with aiofiles.open(context_file, 'r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    created_at = datetime.fromisoformat(data.get("created_at"))
                    
                    if created_at < cutoff_time:
                        os.remove(context_file)
                        logger.info(f"✓ Cleaned up old session: {data.get('session_id')}")
                        
            except Exception as e:
                logger.error(f"Failed to cleanup session {context_file}: {e}")

# Global context manager instance
context_manager = ContextManager()
