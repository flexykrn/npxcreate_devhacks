import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

def load_json_file(file_path: str) -> Optional[Dict[str, Any]]:
    """Load JSON file safely"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load JSON from {file_path}: {e}")
        return None

def save_json_file(data: Dict[str, Any], file_path: str) -> bool:
    """Save data to JSON file"""
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Failed to save JSON to {file_path}: {e}")
        return False

def format_screenplay_text(text: str) -> str:
    """Format text as proper screenplay"""
    # Add basic screenplay formatting
    lines = text.split('\n')
    formatted = []
    
    for line in lines:
        line = line.strip()
        if not line:
            formatted.append("")
            continue
        
        # Scene headings
        if line.upper().startswith(('INT.', 'EXT.', 'INT/EXT.')):
            formatted.append(line.upper())
            formatted.append("")
        # Character names (simple heuristic)
        elif line.isupper() and len(line.split()) <= 3:
            formatted.append(" " * 20 + line)
        # Dialogue
        else:
            formatted.append(" " * 10 + line)
    
    return '\n'.join(formatted)

def truncate_text(text: str, max_length: int = 1000) -> str:
    """Truncate text to max length with ellipsis"""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."

def extract_character_stats(dialogues: list) -> Dict[str, int]:
    """Extract statistics about character dialogue counts"""
    stats = {}
    for dialogue in dialogues:
        char = dialogue.get("character")
        if char:
            stats[char] = stats.get(char, 0) + 1
    return stats
