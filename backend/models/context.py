from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class Scene(BaseModel):
    """Individual scene in a screenplay"""
    scene_number: int
    heading: str
    location: Optional[str] = None
    time: Optional[str] = None
    description: Optional[str] = None
    dialogues: List[Dict[str, Any]] = []
    action_lines: List[str] = []

class Dialogue(BaseModel):
    """Individual dialogue in a screenplay"""
    character: str
    text: str
    parenthetical: Optional[str] = None
    emotion: Optional[str] = None
    sentiment_score: Optional[float] = None

class ParsedScreenplay(BaseModel):
    """Complete parsed screenplay structure"""
    title: Optional[str] = None
    scenes: List[Scene] = []
    characters: List[str] = []
    total_dialogues: int = 0
    total_scenes: int = 0
