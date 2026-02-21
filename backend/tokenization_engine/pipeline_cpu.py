import re
import json
import spacy
from transformers import pipeline

print("Loading spaCy NLP engine...")
nlp = spacy.load("en_core_web_sm")

def stage1_parser(raw_script: str) -> dict:
    """
    A robust state-machine parser designed to handle massive, multi-page screenplays.
    """
    print("Stage 1: Parsing raw screenplay...")
    
    # The master JSON structure we will pass down the pipeline
    master_data = {
        "scenes": [],
        "metadata": {"total_word_count": len(raw_script.split())}
    }
    
    current_scene = None
    current_character = None
    
    # Split the massive script into readable lines
    lines = raw_script.splitlines()
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # 1. Detect Scene Headings (Sluglines)
        if line.startswith("INT.") or line.startswith("EXT."):
            if current_scene:
                master_data["scenes"].append(current_scene)
            
            parts = line.split(" - ")
            current_scene = {
                "scene_id": len(master_data["scenes"]) + 1,
                "location": parts[0],
                "time": parts[1] if len(parts) > 1 else "UNKNOWN",
                "dialogues": [],
                "actions": []
            }
            current_character = None # Reset character
            
        # 2. Detect Characters (ALL CAPS, short lines)
        elif line.isupper() and len(line.split()) < 4 and not re.search(r'[.,;!?]', line):
            current_character = line
            
        # 3. Detect Parentheticals (e.g., "(whispering)")
        elif line.startswith("(") and line.endswith(")"):
            continue # We skip parentheticals for the basic JSON structure
            
        # 4. Detect Dialogue (If a character was just declared)
        elif current_character and current_scene:
            current_scene["dialogues"].append({
                "character": current_character,
                "text": line
            })
            current_character = None # Reset so next line isn't assumed to be dialogue
            
        # 5. Detect Action Lines (Everything else goes to action)
        elif current_scene and not current_character:
            current_scene["actions"].append(line)
            
    # Append the final scene when the loop ends
    if current_scene:
        master_data["scenes"].append(current_scene)
        
    return master_data

print("Loading DistilBERT Sentiment Analyzer (CPU-friendly)...")
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

def stage2_analyzer(parsed_json: dict) -> dict:
    """
    Ingests the Stage 1 JSON and adds emotional sentiment analysis to the dialogue.
    """
    print("Stage 2: Analyzing narrative sentiment...")
    
    for scene in parsed_json["scenes"]:
        # Analyze the overall pacing based on action lines
        action_density = len(scene["actions"])
        dialogue_density = len(scene["dialogues"])
        
        if action_density > dialogue_density:
            scene["pacing"] = "Fast / Action-Heavy"
        else:
            scene["pacing"] = "Character-Driven / Dialogue-Heavy"
            
        # Analyze the emotion of every line of dialogue
        for dialogue in scene["dialogues"]:
            # DistilBERT requires strict text, no empty strings
            if dialogue["text"]: 
                sentiment = sentiment_analyzer(dialogue["text"])[0]
                dialogue["emotion"] = sentiment["label"] # Returns 'POSITIVE' or 'NEGATIVE'
                
    return parsed_json

# ==========================================
# TEST YOUR MICROSERVICE PIPELINE
# ==========================================
# FIX: Wrapped in a main guard so it doesn't trigger when imported by main.py
if __name__ == "__main__":
    massive_test_script = """
INT. ABANDONED WAREHOUSE - NIGHT
Rain hammers against the tin roof. The room is pitch black.
John kicks the door open, sweeping the room with his flashlight.

JOHN
Show yourself! I know you're in here!

A shadow moves in the rafters.

SARAH
You shouldn't have come here, John.

JOHN
I'm not leaving without the drive.
"""

    # Run the pipeline
    step1_output = stage1_parser(massive_test_script)
    final_cpu_output = stage2_analyzer(step1_output)

    # Print the beautifully structured JSON
    print(json.dumps(final_cpu_output, indent=2))