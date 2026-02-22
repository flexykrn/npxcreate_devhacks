from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SessionResponse(BaseModel):
    """Response after creating a session"""
    session_id: str
    status: str
    message: str
    created_at: str

class StageResponse(BaseModel):
    """Generic response for pipeline stages"""
    session_id: str
    stage: str
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None

class ParseResponse(StageResponse):
    """Response from parsing stage"""
    parsed_scenes: Optional[int] = None
    parsed_dialogues: Optional[int] = None

class AnalyzeResponse(StageResponse):
    """Response from analysis stage"""
    embeddings_generated: Optional[int] = None
    similarity_scores: Optional[Dict[str, float]] = None

class EnhanceResponse(StageResponse):
    """Response from enhancement stage"""
    dialogues_enhanced: Optional[int] = None

class FinalizeResponse(StageResponse):
    """Response from finalization stage"""
    final_screenplay: Optional[str] = None
    word_count: Optional[int] = None

class JobStatusResponse(BaseModel):
    """Response for async job status"""
    job_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: Optional[float] = None  # 0-100
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    models_loaded: Dict[str, bool]
    gpu_available: bool
    version: str
