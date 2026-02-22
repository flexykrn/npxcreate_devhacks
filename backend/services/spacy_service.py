import logging
import re
from typing import Dict, Any, List, Optional
from model_loader import model_registry

logger = logging.getLogger(__name__)

class SpacyService:
    """
    Service for screenplay parsing using spaCy.
    Extracts structure, dialogues, scenes, and characters.
    """
    
    def __init__(self):
        self.nlp = None
    
    def _ensure_model_loaded(self):
        """Ensure spaCy model is available"""
        if self.nlp is None:
            self.nlp = model_registry.get_model('spacy')
    
    async def parse_screenplay(self, raw_script: str) -> Dict[str, Any]:
        """
        Parse raw screenplay text into structured format.
        
        Args:
            raw_script: Raw screenplay text
            
        Returns:
            Structured screenplay with scenes, dialogues, and characters
        """
        self._ensure_model_loaded()
        logger.info("Starting screenplay parsing...")
        
        try:
            # Parse with spaCy
            doc = self.nlp(raw_script)
            
            # Extract structure
            scenes = self._extract_scenes(raw_script)
            dialogues = self._extract_dialogues(raw_script, doc)
            characters = self._extract_characters(dialogues)
            action_lines = self._extract_action_lines(raw_script)
            
            result = {
                "scenes": scenes,
                "dialogues": dialogues,
                "characters": list(characters),
                "action_lines": action_lines,
                "total_scenes": len(scenes),
                "total_dialogues": len(dialogues),
                "total_characters": len(characters)
            }
            
            logger.info(f"✓ Parsed: {len(scenes)} scenes, {len(dialogues)} dialogues, {len(characters)} characters")
            return result
            
        except Exception as e:
            logger.error(f"Parsing failed: {e}")
            raise
    
    def _extract_scenes(self, text: str) -> List[Dict[str, Any]]:
        """Extract scene headings"""
        scenes = []
        
        # Regex patterns for scene headings
        scene_pattern = r'^(INT\.|EXT\.|INT/EXT\.|I/E\.)\s+(.+?)\s*-\s*(.+?)$'
        
        lines = text.split('\n')
        scene_number = 0
        
        for i, line in enumerate(lines):
            line = line.strip()
            match = re.match(scene_pattern, line, re.IGNORECASE)
            
            if match:
                scene_number += 1
                scenes.append({
                    "scene_number": scene_number,
                    "heading": line,
                    "location_type": match.group(1),
                    "location": match.group(2).strip(),
                    "time": match.group(3).strip(),
                    "line_number": i + 1
                })
        
        return scenes
    
    def _extract_dialogues(self, text: str, doc) -> List[Dict[str, Any]]:
        """Extract dialogues with character names"""
        dialogues = []
        lines = text.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Check if line is a character name (usually uppercase)
            if line and line.isupper() and len(line.split()) <= 3:
                character = line
                
                # Check for parenthetical
                parenthetical = None
                if i + 1 < len(lines) and lines[i + 1].strip().startswith('('):
                    parenthetical = lines[i + 1].strip()
                    i += 1
                
                # Get dialogue text
                dialogue_text = []
                i += 1
                while i < len(lines):
                    next_line = lines[i].strip()
                    
                    # Stop at next character or scene heading
                    if not next_line or next_line.isupper() or next_line.startswith(('INT.', 'EXT.')):
                        break
                    
                    dialogue_text.append(next_line)
                    i += 1
                
                if dialogue_text:
                    dialogues.append({
                        "character": character,
                        "text": ' '.join(dialogue_text),
                        "parenthetical": parenthetical
                    })
            
            i += 1
        
        return dialogues
    
    def _extract_characters(self, dialogues: List[Dict[str, Any]]) -> set:
        """Extract unique character names"""
        return {d["character"] for d in dialogues if d.get("character")}
    
    def _extract_action_lines(self, text: str) -> List[str]:
        """Extract action/description lines"""
        action_lines = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines, scene headings, and character names
            if (line and 
                not line.isupper() and 
                not line.startswith(('INT.', 'EXT.', '(')) and
                not re.match(r'^FADE', line, re.IGNORECASE)):
                
                # Check if it's not a dialogue (simple heuristic)
                if len(line.split()) > 3:
                    action_lines.append(line)
        
        return action_lines

# Global service instance
spacy_service = SpacyService()
