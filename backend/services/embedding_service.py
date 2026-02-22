import logging
import numpy as np
from typing import Dict, Any, List, Optional
from model_loader import model_registry

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Service for generating embeddings and computing similarities using MiniLM.
    Analyzes screenplay semantics and relationships.
    """
    
    def __init__(self):
        self.model = None
    
    def _ensure_model_loaded(self):
        """Ensure MiniLM model is available"""
        if self.model is None:
            self.model = model_registry.get_model('minilm')
    
    async def generate_embeddings(self, parsed_structure: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate embeddings for dialogues and scenes.
        
        Args:
            parsed_structure: Parsed screenplay structure from spaCy
            
        Returns:
            Dictionary with embeddings and analysis results
        """
        self._ensure_model_loaded()
        logger.info("Generating embeddings...")
        
        try:
            dialogues = parsed_structure.get("dialogues", [])
            scenes = parsed_structure.get("scenes", [])
            action_lines = parsed_structure.get("action_lines", [])
            
            # Generate dialogue embeddings
            dialogue_embeddings = []
            dialogue_texts = []
            
            for dialogue in dialogues:
                text = dialogue.get("text", "")
                if text:
                    dialogue_texts.append(text)
            
            if dialogue_texts:
                dialogue_embeddings = self.model.encode(
                    dialogue_texts,
                    convert_to_numpy=True,
                    show_progress_bar=False
                )
            
            # Generate scene embeddings (using scene descriptions)
            scene_embeddings = []
            scene_texts = []
            
            for scene in scenes:
                scene_text = f"{scene.get('heading', '')} {scene.get('location', '')} {scene.get('time', '')}"
                scene_texts.append(scene_text)
            
            if scene_texts:
                scene_embeddings = self.model.encode(
                    scene_texts,
                    convert_to_numpy=True,
                    show_progress_bar=False
                )
            
            # Generate action line embeddings
            action_embeddings = []
            if action_lines:
                action_embeddings = self.model.encode(
                    action_lines[:50],  # Limit to first 50 for performance
                    convert_to_numpy=True,
                    show_progress_bar=False
                )
            
            # Compute similarity metrics
            similarity_analysis = await self._analyze_similarities(
                dialogue_embeddings,
                scene_embeddings,
                dialogues,
                scenes
            )
            
            result = {
                "dialogue_embeddings": dialogue_embeddings.tolist() if len(dialogue_embeddings) > 0 else [],
                "scene_embeddings": scene_embeddings.tolist() if len(scene_embeddings) > 0 else [],
                "action_embeddings": action_embeddings.tolist() if len(action_embeddings) > 0 else [],
                "similarity_analysis": similarity_analysis,
                "total_embeddings": len(dialogue_embeddings) + len(scene_embeddings) + len(action_embeddings)
            }
            
            logger.info(f"✓ Generated {result['total_embeddings']} embeddings")
            return result
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise
    
    async def _analyze_similarities(
        self,
        dialogue_embeddings: np.ndarray,
        scene_embeddings: np.ndarray,
        dialogues: List[Dict[str, Any]],
        scenes: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze semantic similarities in the screenplay"""
        
        analysis = {
            "dialogue_coherence": 0.0,
            "scene_coherence": 0.0,
            "character_consistency": {},
            "thematic_clusters": []
        }
        
        try:
            # Dialogue coherence (average pairwise similarity)
            if len(dialogue_embeddings) > 1:
                from sklearn.metrics.pairwise import cosine_similarity
                dialogue_sim_matrix = cosine_similarity(dialogue_embeddings)
                
                # Get upper triangle (excluding diagonal)
                upper_triangle = dialogue_sim_matrix[np.triu_indices_from(dialogue_sim_matrix, k=1)]
                analysis["dialogue_coherence"] = float(np.mean(upper_triangle))
            
            # Scene coherence
            if len(scene_embeddings) > 1:
                from sklearn.metrics.pairwise import cosine_similarity
                scene_sim_matrix = cosine_similarity(scene_embeddings)
                upper_triangle = scene_sim_matrix[np.triu_indices_from(scene_sim_matrix, k=1)]
                analysis["scene_coherence"] = float(np.mean(upper_triangle))
            
            # Character consistency (dialogues by same character should be similar)
            if len(dialogue_embeddings) > 0 and dialogues:
                character_groups = {}
                for i, dialogue in enumerate(dialogues):
                    char = dialogue.get("character")
                    if char:
                        if char not in character_groups:
                            character_groups[char] = []
                        if i < len(dialogue_embeddings):
                            character_groups[char].append(dialogue_embeddings[i])
                
                for char, embs in character_groups.items():
                    if len(embs) > 1:
                        from sklearn.metrics.pairwise import cosine_similarity
                        char_sim_matrix = cosine_similarity(embs)
                        upper_triangle = char_sim_matrix[np.triu_indices_from(char_sim_matrix, k=1)]
                        analysis["character_consistency"][char] = float(np.mean(upper_triangle))
            
        except Exception as e:
            logger.warning(f"Similarity analysis partially failed: {e}")
        
        return analysis
    
    async def find_similar_dialogues(
        self,
        query_text: str,
        dialogue_embeddings: List[List[float]],
        dialogues: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Find dialogues similar to a query text"""
        self._ensure_model_loaded()
        
        if not dialogue_embeddings or not dialogues:
            return []
        
        try:
            # Encode query
            query_embedding = self.model.encode([query_text], convert_to_numpy=True)[0]
            
            # Compute similarities
            from sklearn.metrics.pairwise import cosine_similarity
            dialogue_embeddings_array = np.array(dialogue_embeddings)
            similarities = cosine_similarity([query_embedding], dialogue_embeddings_array)[0]
            
            # Get top-k
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            
            results = []
            for idx in top_indices:
                if idx < len(dialogues):
                    results.append({
                        "dialogue": dialogues[idx],
                        "similarity": float(similarities[idx])
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Similar dialogue search failed: {e}")
            return []

# Global service instance
embedding_service = EmbeddingService()
