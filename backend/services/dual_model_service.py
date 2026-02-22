import logging
import ollama
from typing import Dict, Any, List, Optional
from pathlib import Path
from config import settings

logger = logging.getLogger(__name__)

class DualModelService:
    """
    Dual-model service for screenplay enhancement.
    - Llama3.2: Text enhancement, dialogue, structure
    - MiniCPM-V: Vision analysis for images
    """
    
    def __init__(self):
        self.text_model = settings.TEXT_MODEL
        self.vision_model = settings.VISION_MODEL
        logger.info(f"Initialized with Text Model: {self.text_model}, Vision Model: {self.vision_model}")
    
    def _generate_with_ollama(self, prompt: str, model_name: str, max_tokens: int = 512) -> str:
        """Generate text using specified Ollama model"""
        try:
            response = ollama.generate(
                model=model_name,
                prompt=prompt,
                options={
                    "num_predict": max_tokens,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            )
            
            if hasattr(response, 'response'):
                return response.response.strip()
            elif isinstance(response, dict):
                return response.get('response', '').strip()
            else:
                return str(response).strip()
                
        except Exception as e:
            logger.error(f"Ollama generation failed with {model_name}: {e}")
            return ""
    
    async def enhance_text_as_director(
        self,
        raw_text: str,
        tone_target: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Stage 1: Enhance raw text using Llama3.2 as a professional director.
        
        Args:
            raw_text: User's raw screenplay text
            tone_target: Desired tone (Dramatic, Comedy, etc.)
            
        Returns:
            Director-enhanced screenplay in industry format
        """
        logger.info("🎬 Stage 1: Enhancing with Llama3.2 (Director Mode)")
        
        try:
            # Load director prompt
            prompt_path = Path("prompts/director_enhancement_prompt.txt")
            if prompt_path.exists():
                with open(prompt_path, "r", encoding="utf-8") as f:
                    base_prompt = f.read()
            else:
                base_prompt = "You are a professional director. Enhance this screenplay to industry standard:"
            
            # Build full prompt
            full_prompt = f"{base_prompt}\n\n"
            full_prompt += f"TARGET TONE: {tone_target or 'Dramatic'}\n\n"
            full_prompt += f"RAW SCREENPLAY:\n{raw_text}\n\n"
            full_prompt += "ENHANCED VERSION:"
            
            # Generate with Llama3.2
            enhanced_text = self._generate_with_ollama(
                full_prompt,
                self.text_model,
                max_tokens=1024
            )
            
            if not enhanced_text:
                logger.warning("No enhancement generated, using original")
                enhanced_text = raw_text
            
            result = {
                "stage": "director_enhancement",
                "model_used": self.text_model,
                "enhanced_screenplay": enhanced_text,
                "original_text": raw_text,
                "tone": tone_target or "Dramatic"
            }
            
            logger.info(f"✅ Stage 1 complete: {len(enhanced_text)} characters generated")
            return result
            
        except Exception as e:
            logger.error(f"Director enhancement failed: {e}")
            return {
                "stage": "director_enhancement",
                "enhanced_screenplay": raw_text,
                "error": str(e)
            }
    
    async def analyze_image_and_enhance(
        self,
        enhanced_screenplay: str,
        image_path: str,
        scene_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Stage 2: Analyze image with MiniCPM-V vision model and integrate into screenplay.
        
        Args:
            enhanced_screenplay: Output from Stage 1 (director enhancement)
            image_path: Path to uploaded image
            scene_context: Optional context about which scene this image relates to
            
        Returns:
            Final screenplay with visual context integrated
        """
        logger.info("🖼️ Stage 2: Analyzing image with MiniCPM-V (Vision Model)")
        
        try:
            # Load vision prompt
            prompt_path = Path("prompts/vision_analysis_prompt.txt")
            if prompt_path.exists():
                with open(prompt_path, "r", encoding="utf-8") as f:
                    vision_prompt = f.read()
            else:
                vision_prompt = "Analyze this image and describe it in screenplay format:"
            
            # Build vision analysis prompt
            full_prompt = f"{vision_prompt}\n\n"
            if scene_context:
                full_prompt += f"SCENE CONTEXT: {scene_context}\n\n"
            full_prompt += "Describe what you see in cinematic, screenplay-ready language:"
            
            # Analyze image with vision model
            try:
                # Use Ollama's vision API with image
                response = ollama.chat(
                    model=self.vision_model,
                    messages=[{
                        'role': 'user',
                        'content': full_prompt,
                        'images': [image_path]
                    }]
                )
                
                if hasattr(response, 'message'):
                    visual_description = response.message.content.strip()
                elif isinstance(response, dict):
                    visual_description = response.get('message', {}).get('content', '').strip()
                else:
                    visual_description = str(response).strip()
                    
            except Exception as e:
                logger.error(f"Vision analysis failed: {e}")
                visual_description = "[Image analysis unavailable]"
            
            # Integrate visual description into screenplay
            integration_prompt = f"""You are a screenplay editor. Integrate the following visual description into the appropriate scene in the screenplay.

VISUAL DESCRIPTION:
{visual_description}

CURRENT SCREENPLAY:
{enhanced_screenplay}

Task: Add the visual description to the relevant scene's action lines. Keep everything else the same. Output the complete updated screenplay."""

            # Use text model to integrate
            final_screenplay = self._generate_with_ollama(
                integration_prompt,
                self.text_model,
                max_tokens=1536
            )
            
            if not final_screenplay:
                final_screenplay = f"{enhanced_screenplay}\n\n[Visual Context: {visual_description}]"
            
            result = {
                "stage": "vision_integration",
                "model_used": self.vision_model,
                "visual_description": visual_description,
                "final_screenplay": final_screenplay,
                "image_analyzed": image_path
            }
            
            logger.info("✅ Stage 2 complete: Visual context integrated")
            return result
            
        except Exception as e:
            logger.error(f"Vision integration failed: {e}")
            return {
                "stage": "vision_integration",
                "final_screenplay": enhanced_screenplay,
                "error": str(e)
            }

# Singleton instance
dual_model_service = DualModelService()
