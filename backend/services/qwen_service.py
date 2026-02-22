import logging
import torch
from typing import Dict, Any, List, Optional
from PIL import Image
import io
import base64
from model_loader import model_registry

logger = logging.getLogger(__name__)

class QwenService:
    """
    Service for multimodal screenplay enhancement using Qwen2-VL.
    Handles dialogue enhancement and final screenplay generation.
    """
    
    def __init__(self):
        self.model = None
        self.processor = None
    
    def _ensure_model_loaded(self):
        """Ensure Qwen model is available"""
        if self.model is None:
            self.model = model_registry.get_model('qwen')
            self.processor = model_registry.get_model('qwen_processor')
    
    async def enhance_dialogues(
        self,
        parsed_structure: Dict[str, Any],
        tone_target: Optional[str] = None,
        product_context: Optional[str] = None,
        image_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enhance dialogues using Qwen2-VL with optional image context.
        
        Args:
            parsed_structure: Parsed screenplay structure
            tone_target: Target tone for enhancement
            product_context: Optional product placement context
            image_path: Optional path to scene image
            
        Returns:
            Enhanced dialogues and suggestions
        """
        self._ensure_model_loaded()
        
        if self.model is None:
            logger.warning("Qwen model not available, skipping enhancement")
            return {"enhanced_dialogues": [], "suggestions": []}
        
        logger.info("Enhancing dialogues with Qwen2-VL...")
        
        try:
            dialogues = parsed_structure.get("dialogues", [])
            characters = parsed_structure.get("characters", [])
            
            # Load prompts
            with open("prompts/dialogue_prompt.txt", "r") as f:
                base_prompt = f.read()
            
            enhanced_dialogues = []
            
            # Process in batches to manage memory
            batch_size = 5
            for i in range(0, len(dialogues), batch_size):
                batch = dialogues[i:i + batch_size]
                
                # Build prompt for this batch
                prompt = self._build_enhancement_prompt(
                    batch,
                    characters,
                    tone_target,
                    product_context,
                    base_prompt
                )
                
                # Generate enhancement
                enhanced = await self._generate_with_qwen(
                    prompt,
                    image_path,
                    max_tokens=512
                )
                
                # Parse and store enhanced dialogues
                enhanced_batch = self._parse_enhanced_dialogues(enhanced, batch)
                enhanced_dialogues.extend(enhanced_batch)
            
            result = {
                "enhanced_dialogues": enhanced_dialogues,
                "total_enhanced": len(enhanced_dialogues),
                "suggestions": self._generate_suggestions(enhanced_dialogues)
            }
            
            logger.info(f"✓ Enhanced {len(enhanced_dialogues)} dialogues")
            return result
            
        except Exception as e:
            logger.error(f"Dialogue enhancement failed: {e}")
            raise
    
    async def generate_final_screenplay(
        self,
        context: Dict[str, Any],
        tone_target: Optional[str] = None,
        include_formatting: bool = True
    ) -> Dict[str, Any]:
        """
        Generate final polished screenplay using all accumulated context.
        
        Args:
            context: Full screenplay context
            tone_target: Target tone
            include_formatting: Include standard screenplay formatting
            
        Returns:
            Final screenplay text and metadata
        """
        self._ensure_model_loaded()
        
        if self.model is None:
            logger.warning("Qwen model not available, returning basic screenplay")
            return self._generate_basic_screenplay(context)
        
        logger.info("Generating final screenplay with Qwen2-VL...")
        
        try:
            # Load final prompt template
            with open("prompts/final_prompt.txt", "r") as f:
                base_prompt = f.read()
            
            # Build comprehensive prompt
            prompt = self._build_final_prompt(
                context,
                tone_target,
                include_formatting,
                base_prompt
            )
            
            # Generate final screenplay
            final_screenplay = await self._generate_with_qwen(
                prompt,
                context.get("scene_image_path"),
                max_tokens=4096
            )
            
            result = {
                "final_screenplay": final_screenplay,
                "word_count": len(final_screenplay.split()),
                "character_count": len(final_screenplay),
                "formatted": include_formatting
            }
            
            logger.info(f"✓ Generated final screenplay ({result['word_count']} words)")
            return result
            
        except Exception as e:
            logger.error(f"Final screenplay generation failed: {e}")
            raise
    
    async def _generate_with_qwen(
        self,
        prompt: str,
        image_path: Optional[str] = None,
        max_tokens: int = 512
    ) -> str:
        """Generate text with Qwen2-VL"""
        
        try:
            # Prepare messages
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert screenplay writer and dialogue coach."
                },
                {
                    "role": "user",
                    "content": []
                }
            ]
            
            # Add image if provided
            if image_path:
                try:
                    messages[1]["content"].append({
                        "type": "image",
                        "image": image_path
                    })
                except Exception as e:
                    logger.warning(f"Failed to load image: {e}")
            
            # Add text prompt
            messages[1]["content"].append({
                "type": "text",
                "text": prompt
            })
            
            # Process with Qwen processor
            text_prompt = self.processor.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
            
            # Prepare inputs
            inputs = self.processor(
                text=[text_prompt],
                images=[Image.open(image_path)] if image_path else None,
                padding=True,
                return_tensors="pt"
            )
            
            # Move to device
            inputs = inputs.to(self.model.device)
            
            # Generate
            with torch.no_grad():
                output_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9
                )
            
            # Decode
            generated_text = self.processor.batch_decode(
                output_ids,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=True
            )[0]
            
            # Extract response (remove prompt)
            response = generated_text.split("assistant\n")[-1].strip()
            
            return response
            
        except Exception as e:
            logger.error(f"Qwen generation failed: {e}")
            raise
    
    def _build_enhancement_prompt(
        self,
        dialogues: List[Dict[str, Any]],
        characters: List[str],
        tone_target: Optional[str],
        product_context: Optional[str],
        base_prompt: str
    ) -> str:
        """Build prompt for dialogue enhancement"""
        
        prompt = base_prompt + "\n\n"
        
        if tone_target:
            prompt += f"TARGET TONE: {tone_target}\n\n"
        
        if product_context:
            prompt += f"PRODUCT CONTEXT: {product_context}\n\n"
        
        prompt += "CHARACTERS: " + ", ".join(characters) + "\n\n"
        prompt += "DIALOGUES TO ENHANCE:\n\n"
        
        for i, dialogue in enumerate(dialogues):
            prompt += f"{i+1}. {dialogue.get('character')}: {dialogue.get('text')}\n"
        
        prompt += "\nProvide enhanced versions that improve emotion, naturalness, and engagement."
        
        return prompt
    
    def _build_final_prompt(
        self,
        context: Dict[str, Any],
        tone_target: Optional[str],
        include_formatting: bool,
        base_prompt: str
    ) -> str:
        """Build prompt for final screenplay generation"""
        
        prompt = base_prompt + "\n\n"
        
        if tone_target:
            prompt += f"TARGET TONE: {tone_target}\n\n"
        
        parsed = context.get("parsed_structure", {})
        prompt += f"SCENES: {parsed.get('total_scenes', 0)}\n"
        prompt += f"CHARACTERS: {', '.join(parsed.get('characters', []))}\n"
        prompt += f"DIALOGUES: {parsed.get('total_dialogues', 0)}\n\n"
        
        if include_formatting:
            prompt += "Format the screenplay using standard screenplay formatting (scene headings, character names, dialogues, action lines).\n\n"
        
        # Add enhanced dialogues
        enhanced = context.get("enhanced_dialogues", [])
        if enhanced:
            prompt += "ENHANCED DIALOGUES:\n"
            for dialogue in enhanced[:10]:  # Include sample
                prompt += f"{dialogue.get('character')}: {dialogue.get('enhanced_text', dialogue.get('text'))}\n"
        
        prompt += "\nGenerate the complete, polished screenplay."
        
        return prompt
    
    def _parse_enhanced_dialogues(
        self,
        generated_text: str,
        original_dialogues: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Parse enhanced dialogues from generated text"""
        
        enhanced = []
        lines = generated_text.split('\n')
        
        for i, original in enumerate(original_dialogues):
            enhanced.append({
                **original,
                "enhanced_text": generated_text,  # Simplified parsing
                "was_enhanced": True
            })
        
        return enhanced
    
    def _generate_suggestions(self, enhanced_dialogues: List[Dict[str, Any]]) -> List[str]:
        """Generate improvement suggestions"""
        return [
            "Consider adding more emotional depth to character interactions",
            "Ensure dialogue reflects character backgrounds",
            "Maintain consistent tone throughout the screenplay"
        ]
    
    def _generate_basic_screenplay(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate basic screenplay without Qwen (fallback)"""
        
        parsed = context.get("parsed_structure", {})
        dialogues = parsed.get("dialogues", [])
        scenes = parsed.get("scenes", [])
        
        screenplay = "SCREENPLAY\n\n"
        
        for scene in scenes:
            screenplay += f"{scene.get('heading', '')}\n\n"
        
        for dialogue in dialogues:
            screenplay += f"{dialogue.get('character')}\n"
            screenplay += f"{dialogue.get('text')}\n\n"
        
        return {
            "final_screenplay": screenplay,
            "word_count": len(screenplay.split()),
            "character_count": len(screenplay),
            "formatted": False
        }

# Global service instance
qwen_service = QwenService()
