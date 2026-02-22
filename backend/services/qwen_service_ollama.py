import logging
import ollama
from typing import Dict, Any, List, Optional
from model_loader import model_registry
from config import settings

logger = logging.getLogger(__name__)

class QwenServiceOllama:
    """
    Service for screenplay enhancement using Qwen via Ollama.
    Handles dialogue enhancement and final screenplay generation.
    """
    
    def __init__(self):
        self.model_name = None
    
    def _ensure_model_loaded(self):
        """Ensure Qwen model is available via Ollama"""
        if self.model_name is None:
            qwen_marker = model_registry.get_model('qwen')
            if qwen_marker == 'ollama':
                self.model_name = model_registry.get_model('qwen_model_name')
                logger.info(f"Using Ollama model: {self.model_name}")
            else:
                self.model_name = None
    
    async def enhance_dialogues(
        self,
        parsed_structure: Dict[str, Any],
        tone_target: Optional[str] = None,
        product_context: Optional[str] = None,
        image_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enhance dialogues using Qwen via Ollama.
        
        Args:
            parsed_structure: Parsed screenplay structure
            tone_target: Target tone for enhancement
            product_context: Optional product placement context
            image_path: Optional path to scene image
            
        Returns:
            Enhanced dialogues and suggestions
        """
        self._ensure_model_loaded()
        
        if self.model_name is None:
            logger.warning("Qwen model not available via Ollama, skipping enhancement")
            return {"enhanced_dialogues": [], "suggestions": []}
        
        logger.info("Enhancing dialogues with Qwen via Ollama...")
        
        try:
            dialogues = parsed_structure.get("dialogues", [])
            
            # Load prompts
            try:
                with open("prompts/dialogue_prompt.txt", "r", encoding="utf-8") as f:
                    base_prompt = f.read()
            except FileNotFoundError:
                base_prompt = "Enhance the following screenplay dialogues to be more engaging:"
            
            enhanced_dialogues = []
            
            # Process dialogues
            for dialogue in dialogues[:5]:  # Limit to first 5 for demo
                prompt = self._build_enhancement_prompt(
                    dialogue,
                    tone_target,
                    product_context,
                    base_prompt
                )
                
                # Generate enhancement via Ollama
                enhanced = self._generate_with_ollama(prompt)
                
                enhanced_dialogues.append({
                    "original": dialogue.get("text", ""),
                    "character": dialogue.get("character", ""),
                    "enhanced": enhanced,
                    "scene": dialogue.get("scene", "")
                })
            
            result = {
                "enhanced_dialogues": enhanced_dialogues,
                "total_enhanced": len(enhanced_dialogues),
                "suggestions": ["Consider adding more emotional depth", "Ensure consistent character voice"]
            }
            
            logger.info(f"✅ Enhanced {len(enhanced_dialogues)} dialogues")
            return result
            
        except Exception as e:
            logger.error(f"Dialogue enhancement failed: {e}")
            return {"enhanced_dialogues": [], "suggestions": []}
    
    def _build_enhancement_prompt(
        self,
        dialogue: Dict,
        tone_target: Optional[str],
        product_context: Optional[str],
        base_prompt: str
    ) -> str:
        """Build prompt for dialogue enhancement"""
        character = dialogue.get("character", "CHARACTER")
        text = dialogue.get("text", "")
        
        prompt = f"{base_prompt}\n\n"
        prompt += f"Character: {character}\n"
        prompt += f"Original Dialogue: {text}\n"
        
        if tone_target:
            prompt += f"Target Tone: {tone_target}\n"
        
        if product_context:
            prompt += f"Context: {product_context}\n"
        
        prompt += "\nProvide an enhanced version that maintains character voice while improving impact:"
        
        return prompt
    
    def _generate_with_ollama(self, prompt: str, max_tokens: int = 256) -> str:
        """Generate text using Ollama"""
        try:
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    "num_predict": max_tokens,
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            )
            
            # Ollama returns an object, not a dict - access as attribute or dict
            if hasattr(response, 'response'):
                return response.response.strip()
            elif isinstance(response, dict):
                return response.get('response', '').strip()
            else:
                logger.error(f"Unexpected Ollama response type: {type(response)}")
                return str(response).strip()
            
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            return ""
    
    async def generate_final_screenplay(
        self,
        context: Dict[str, Any],
        tone_target: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate final screenplay using enhanced dialogues and analysis.
        
        Args:
            context: Full context including parsed structure, analysis, and enhancements
            tone_target: Target tone for the screenplay
            
        Returns:
            Final screenplay with AI enhancements
        """
        self._ensure_model_loaded()
        
        if self.model_name is None:
            logger.warning("Qwen model not available, using original")
            return {
                "final_screenplay": context.get("parsed_structure", {}).get("raw_text", ""),
                "status": "no_enhancement"
            }
        
        logger.info("Generating final screenplay with Qwen via Ollama...")
        
        try:
            # Load final prompt
            try:
                with open("prompts/final_prompt.txt", "r", encoding="utf-8") as f:
                    base_prompt = f.read()
            except FileNotFoundError:
                base_prompt = "Create a polished final screenplay based on the following:"
            
            # Build comprehensive prompt
            parsed_structure = context.get("parsed_structure", {})
            enhanced_dialogues = context.get("enhanced_dialogues", [])
            
            prompt = f"{base_prompt}\n\n"
            prompt += f"Tone: {tone_target or 'Dramatic'}\n\n"
            
            # Add scenes
            scenes = parsed_structure.get("scenes", [])
            for i, scene in enumerate(scenes[:3], 1):  # First 3 scenes for demo
                prompt += f"\nScene {i}:\n"
                prompt += f"Heading: {scene.get('heading', '')}\n"
                prompt += f"Action: {scene.get('action', '')}\n"
            
            # Add enhanced dialogues
            if enhanced_dialogues:
                prompt += "\n\nEnhanced Dialogues:\n"
                for ed in enhanced_dialogues[:5]:  # First 5 dialogues
                    prompt += f"\n{ed.get('character', 'CHARACTER')}: {ed.get('enhanced', '')}\n"
            
            prompt += "\n\nGenerate a polished, professional screenplay:"
            
            # Generate final screenplay
            final_text = self._generate_with_ollama(prompt, max_tokens=1024)
            
            result = {
                "final_screenplay": final_text,
                "status": "completed",
                "enhancements_applied": len(enhanced_dialogues)
            }
            
            logger.info("✅ Final screenplay generated")
            return result
            
        except Exception as e:
            logger.error(f"Final screenplay generation failed: {e}")
            return {
                "final_screenplay": context.get("parsed_structure", {}).get("raw_text", ""),
                "status": "error",
                "error": str(e)
            }

# Create singleton instance
qwen_service = QwenServiceOllama()
