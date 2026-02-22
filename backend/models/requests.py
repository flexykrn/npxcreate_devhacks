from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ScriptProcessRequest(BaseModel):
    """Request model for initial script processing"""
    raw_script: str = Field(..., description="Raw screenplay text")
    tone_target: Optional[str] = Field(None, description="Target tone/mood for the script")
    product_context: Optional[str] = Field(None, description="Optional product placement context")

class ParseRequest(BaseModel):
    """Request to parse a screenplay"""
    session_id: str = Field(..., description="Session identifier")

class AnalyzeRequest(BaseModel):
    """Request to analyze screenplay with embeddings"""
    session_id: str = Field(..., description="Session identifier")

class EnhanceRequest(BaseModel):
    """Request to enhance dialogues with Qwen"""
    session_id: str = Field(..., description="Session identifier")
    focus_areas: Optional[List[str]] = Field(
        default=["dialogue", "emotion", "pacing"],
        description="Areas to focus enhancement on"
    )

class FinalizeRequest(BaseModel):
    """Request to generate final screenplay"""
    session_id: str = Field(..., description="Session identifier")
    include_formatting: bool = Field(True, description="Include screenplay formatting")

class JobStatusRequest(BaseModel):
    """Request to check job status"""
    job_id: str = Field(..., description="Job identifier")
