import re
import json
import spacy
import chromadb
from chromadb.utils import embedding_functions
from transformers import pipeline

print("Loading spaCy NLP engine...")
nlp = spacy.load("en_core_web_sm")

print("Loading local ChromaDB Client...")
chroma_client = chromadb.PersistentClient(path="./chroma_storage")
default_ef = embedding_functions.DefaultEmbeddingFunction()

def stage1_parser(raw_script: str) -> dict:
    """Parses strictly formatted text into the master JSON structure."""
    print("Stage 1: Parsing raw screenplay...")
    master_data = {"scenes": [], "metadata": {"total_word_count": len(raw_script.split())}}
    current_scene = None
    current_character = None
    lines = raw_script.splitlines()
    
    for line in lines:
        line = line.strip()
        if not line: continue
            
        if line.startswith("INT.") or line.startswith("EXT."):
            if current_scene: master_data["scenes"].append(current_scene)
            parts = line.split(" - ")
            current_scene = {
                "scene_id": len(master_data["scenes"]) + 1,
                "location": parts[0],
                "time": parts[1] if len(parts) > 1 else "UNKNOWN",
                "dialogues": [], "actions": []
            }
            current_character = None
            
        elif line.isupper() and len(line.split()) < 4 and not re.search(r'[.,;!?]', line):
            current_character = line
            
        elif line.startswith("(") and line.endswith(")"):
            continue 
            
        elif current_character and current_scene:
            current_scene["dialogues"].append({"character": current_character, "text": line})
            current_character = None
            
        elif current_scene and not current_character:
            current_scene["actions"].append(line)
            
    if current_scene:
        master_data["scenes"].append(current_scene)
    return master_data

def stage1_5_vectorize(session_id: str, parsed_json: dict) -> dict:
    """Embeds the parsed JSON into ChromaDB for Qwen's long-term RAG memory."""
    print(f"Stage 1.5: Vectorizing data for session {session_id[:8]} into ChromaDB...")
    
    safe_session_id = session_id.replace("-", "")
    collection = chroma_client.get_or_create_collection(
        name=f"script_{safe_session_id}",
        embedding_function=default_ef
    )
    
    documents, metadatas, ids = [], [], []
    global_id = 0
    
    for scene in parsed_json.get("scenes", []):
        scene_context = f"{scene['location']} - {scene['time']}"
        
        for action in scene.get("actions", []):
            documents.append(action)
            metadatas.append({"type": "action", "scene_id": str(scene["scene_id"]), "context": scene_context})
            ids.append(f"id_{global_id}")
            global_id += 1
            
        for dialogue in scene.get("dialogues", []):
            text = f"{dialogue['character']}: {dialogue['text']}"
            documents.append(text)
            metadatas.append({"type": "dialogue", "character": dialogue["character"], "scene_id": str(scene["scene_id"]), "context": scene_context})
            ids.append(f"id_{global_id}")
            global_id += 1
            
    if documents:
        collection.add(documents=documents, metadatas=metadatas, ids=ids)
    print(f"✅ Successfully vectorized {len(documents)} elements into ChromaDB.")
    return parsed_json

print("Loading DistilBERT Sentiment Analyzer...")
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

def stage2_analyzer(parsed_json: dict) -> dict:
    """Injects emotional sentiment analysis into the parsed dialogue."""
    print("Stage 2: Analyzing narrative sentiment...")
    for scene in parsed_json["scenes"]:
        action_density = len(scene["actions"])
        dialogue_density = len(scene["dialogues"])
        scene["pacing"] = "Fast / Action-Heavy" if action_density > dialogue_density else "Character-Driven / Dialogue-Heavy"
            
        for dialogue in scene["dialogues"]:
            if dialogue["text"]: 
                sentiment = sentiment_analyzer(dialogue["text"])[0]
                dialogue["emotion"] = sentiment["label"]
    return parsed_json