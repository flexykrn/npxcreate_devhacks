import os
import json
import copy
import re
import shutil
import uvicorn
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from typing import Optional
import uuid

# --- PIPELINE ENGINES ---
import fitz  # PyMuPDF for lightning-fast PDF extraction
import docx
try:
    import spacy
except ImportError:
    spacy = None
import chromadb
from chromadb.utils import embedding_functions
from transformers import pipeline

# ==========================================
# 1. SETUP & INITIALIZATION
# ==========================================
print("🚀 Booting up ScriptED Backend with Groq...")

app = FastAPI(title="ScriptED Backend - Groq Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API KEY - Use from environment or hardcoded
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
groq_client = Groq(api_key=GROQ_API_KEY)

# THE ONE TRUE MODEL
MODEL_NAME = "llama-3.1-8b-instant"  

# Load Heavy ML Models Globally
print("Loading spaCy NLP engine...")
nlp = None
if spacy:
    try:
        nlp = spacy.load("en_core_web_sm")
    except:
        print("⚠️ spaCy model not found, run: python -m spacy download en_core_web_sm")
else:
    print("⚠️ spaCy not installed, skipping NLP features")

print("Loading local ChromaDB Client...")
chroma_client = chromadb.PersistentClient(path="./chroma_storage")
default_ef = embedding_functions.DefaultEmbeddingFunction()

print("Loading DistilBERT Sentiment Analyzer...")
try:
    sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
except:
    print("⚠️ Sentiment analyzer not loaded")
    sentiment_analyzer = None

# ==========================================
# 2. GLOBAL DATABASE & CONFIG
# ==========================================
SESSION_STORE = {}

AGENT_CONFIG = {
    "writer_comedy": ("dialogues", "You are an elite comedy writer. Rewrite dialogue to be sarcastic, witty, and darkly comedic."),
    "writer_noir": ("dialogues", "You are a Noir writer. Rewrite dialogue to be gritty, cynical, and 1940s hardboiled."),
    "character_psychologist": ("dialogues", "You are a behavioral psychologist. Rewrite dialogue to reveal deep subtext and hidden fears."),
    
    "director_action": ("actions", "You are an adrenaline-fueled Action Director. Rewrite actions with whip pans, dynamic camera moves, and kinetic energy."),
    "director_horror": ("actions", "You are a Horror Director. Rewrite actions to maximize dread, creeping shadows, and eerie suspense."),
    "cinematographer": ("actions", "You are a Cinematographer. Rewrite actions focusing on 85mm lenses, chiaroscuro lighting, and visual framing."),
    "world_builder": ("actions", "You are a Production Designer. Rewrite actions focusing on gritty textures, set dressing, and environmental storytelling."),
    "sound_designer": ("actions", "You are a Sound Designer. Rewrite actions focusing on low-frequency rumbles, Foley details, and auditory atmosphere."),
    
    "script_doctor": ("analysis", "You are a ruthless Studio Executive. Analyze the scene pacing and stakes. Provide sharp, punchy critique."),
    "continuity_checker": ("analysis", "You are a meticulous Script Supervisor. Scan the scene for logical errors, spatial inconsistencies, or timeline flaws.")
}

# ==========================================
# 3. PIPELINE HELPER FUNCTIONS (Stages 0 - 2)
# ==========================================

def extract_text_from_file(file_path: str) -> str:
    """Extracts raw text using Fitz (PyMuPDF) and python-docx."""
    ext = file_path.split('.')[-1].lower()
    raw_text = ""
    
    if ext == 'pdf':
        with fitz.open(file_path) as doc:
            for page in doc:
                raw_text += page.get_text("text") + "\n"
    elif ext == 'docx':
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            raw_text += para.text + "\n"
    elif ext == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            raw_text = f.read()
    else:
        raise ValueError("Unsupported format! Upload PDF, DOCX, or TXT.")
    return raw_text

def stage0_clean_gibberish(raw_text: str) -> str:
    """Uses Llama to format gibberish/messy text into strict Hollywood format."""
    print("Stage 0: LLM Standardizing messy text...")
    prompt = """You are a Script Format strictness engine. Convert this messy/gibberish text into PERFECT Hollywood screenplay format.
    RULES:
    1. Scene headings: 'INT. LOCATION - TIME' or 'EXT. LOCATION - TIME'
    2. Character names on their own line in ALL CAPS.
    3. Action lines capitalized normally.
    4. Output ONLY the formatted script text."""
    
    completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": raw_text[:15000]} 
        ],
        model=MODEL_NAME,
        temperature=0.2 
    )
    return completion.choices[0].message.content.strip()

def stage1_parser(raw_script: str) -> dict:
    """Parses clean text into JSON."""
    print("Stage 1: Parsing screenplay with Rules/Regex...")
    master_data = {"scenes": [], "metadata": {"total_word_count": len(raw_script.split())}}
    current_scene = None
    current_character = None
    
    for line in raw_script.splitlines():
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
            
    if current_scene: master_data["scenes"].append(current_scene)
    return master_data

def stage1_5_vectorize(session_id: str, parsed_json: dict):
    """Embeds chunks into ChromaDB."""
    print(f"Stage 1.5: Vectorizing {session_id[:8]} into ChromaDB...")
    safe_session_id = session_id.replace("-", "")
    collection = chroma_client.get_or_create_collection(name=f"script_{safe_session_id}", embedding_function=default_ef)
    
    docs, metas, ids = [], [], []
    global_id = 0
    
    for scene in parsed_json.get("scenes", []):
        ctx = f"{scene['location']} - {scene['time']}"
        for action in scene.get("actions", []):
            docs.append(action)
            metas.append({"type": "action", "scene_id": str(scene["scene_id"]), "context": ctx})
            ids.append(f"id_{global_id}"); global_id += 1
            
        for dia in scene.get("dialogues", []):
            docs.append(f"{dia['character']}: {dia['text']}")
            metas.append({"type": "dialogue", "character": dia["character"], "scene_id": str(scene["scene_id"]), "context": ctx})
            ids.append(f"id_{global_id}"); global_id += 1
            
    if docs: collection.add(documents=docs, metadatas=metas, ids=ids)
    return parsed_json

def stage2_analyzer(parsed_json: dict) -> dict:
    """Adds sentiment analysis tags."""
    if not sentiment_analyzer:
        return parsed_json
        
    print("Stage 2: Adding Sentiment Analysis...")
    for scene in parsed_json["scenes"]:
        a_den = len(scene["actions"])
        d_den = len(scene["dialogues"])
        scene["pacing"] = "Fast / Action-Heavy" if a_den > d_den else "Character-Driven / Dialogue-Heavy"
            
        for dia in scene["dialogues"]:
            if dia["text"]: 
                sentiment = sentiment_analyzer(dia["text"][:512])[0]
                dia["emotion"] = sentiment["label"]
    return parsed_json

# ==========================================
# 4. API ENDPOINTS
# ==========================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "groq_api_configured": bool(GROQ_API_KEY),
        "spacy_loaded": nlp is not None,
        "sentiment_loaded": sentiment_analyzer is not None
    }

@app.post("/api/v1/upload-script")
async def upload_script(file: UploadFile = File(...), session_id: str = Form(...)):
    """Receives file, runs Stages 0-2, saves to session."""
    print(f"\n📥 Received File: {file.filename}")
    try:
        # Create temp uploads directory if it doesn't exist
        os.makedirs("temp_uploads", exist_ok=True)
        
        temp_path = f"temp_uploads/temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        raw_text = extract_text_from_file(temp_path)
        clean_text = stage0_clean_gibberish(raw_text)
        parsed_json = stage1_parser(clean_text)
        vectorized_json = stage1_5_vectorize(session_id, parsed_json)
        final_data = stage2_analyzer(vectorized_json)
        
        SESSION_STORE[session_id] = {
            "stage1_data": final_data,
            "stage2_data": None,
            "raw_text": raw_text,
            "clean_text": clean_text
        }
        
        os.remove(temp_path)
        print("✅ Pipeline Completed Successfully.")
        return {"status": "success", "data": final_data, "session_id": session_id}
        
    except Exception as e:
        print(f"❌ Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/process-text")
async def process_text(raw_text: str = Form(...), session_id: Optional[str] = Form(None)):
    """Process raw text without file upload."""
    print(f"\n📝 Processing raw text...")
    
    if not session_id:
        session_id = str(uuid.uuid4())
    
    try:
        clean_text = stage0_clean_gibberish(raw_text)
        parsed_json = stage1_parser(clean_text)
        vectorized_json = stage1_5_vectorize(session_id, parsed_json)
        final_data = stage2_analyzer(vectorized_json)
        
        SESSION_STORE[session_id] = {
            "stage1_data": final_data,
            "stage2_data": None,
            "raw_text": raw_text,
            "clean_text": clean_text
        }
        
        print("✅ Text Processing Completed Successfully.")
        return {"status": "success", "data": final_data, "session_id": session_id}
        
    except Exception as e:
        print(f"❌ Processing Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/pipeline/stage3-agent-handoff")
async def run_stage_3_agent(
    session_id: str = Form(...),
    persona: str = Form(...), 
    user_feedback: str = Form(None) 
):
    """Takes a specific persona and rewrites the targeted part of the JSON."""
    print(f"\n🚀 Dispatched: '{persona}'")
    
    session = SESSION_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Upload a script first.")
        
    working_json = copy.deepcopy(session.get("stage2_data") or session["stage1_data"])
    
    if persona not in AGENT_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown persona: {persona}")
        
    surgery_type, base_prompt = AGENT_CONFIG[persona]
    print(f"🧠 Routing to {MODEL_NAME} for {surgery_type.upper()}")

    system_rules = f"{base_prompt}\nCRITICAL RULES:\n1. Output ONLY valid JSON - no explanations before or after.\n2. Do NOT wrap the JSON in markdown blocks like ```json.\n3. Keep the same number of items as the input."
    
    if surgery_type == "dialogues":
        system_rules += '\n4. Output format must be EXACTLY: {"data": [{"character": "NAME", "text": "NEW TEXT"}]}'
    elif surgery_type == "actions":
        system_rules += '\n4. Output format must be EXACTLY: {"data": ["new action 1", "new action 2"]}\n5. Maintain the same scene and characters, just rewrite the style.'
    else:
        system_rules += '\n4. Output format must be EXACTLY: {"data": "your analysis notes here"}\n5. Keep analysis concise - 2-3 sentences max.'

    if user_feedback:
        system_rules += f"\n\nUSER DIRECTIVE: {user_feedback}"

    try:
        for scene in working_json["scenes"]:
            if surgery_type == "dialogues":
                payload = {"dialogues": scene.get("dialogues", [])}
            else:
                payload = {
                    "location": scene.get("location", ""),
                    "time": scene.get("time", ""),
                    "dialogues": scene.get("dialogues", []),
                    "actions": scene.get("actions", [])
                }
                
            completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_rules},
                    {"role": "user", "content": json.dumps(payload)}
                ],
                model=MODEL_NAME,
                temperature=0.7 
            )
            
            raw_response = completion.choices[0].message.content.strip()
            
            if raw_response.startswith("```"):
                raw_response = re.sub(r'^```(json)?|```$', '', raw_response, flags=re.MULTILINE).strip()
            
            parsed_output = json.loads(raw_response)
            new_data = parsed_output.get("data")
            
            if new_data:
                if surgery_type == "dialogues":
                    scene["dialogues"] = new_data
                elif surgery_type == "actions":
                    scene["actions"] = new_data
                elif surgery_type == "analysis":
                    scene[f"{persona}_notes"] = new_data

        session["stage2_data"] = working_json
        print("✅ Success! Payload updated.")
        return {"status": "success", "data": working_json}
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/session/{session_id}")
async def get_session(session_id: str):
    """Retrieve session data."""
    session = SESSION_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "success", "data": session}

if __name__ == "__main__":
    uvicorn.run("main_groq:app", host="127.0.0.1", port=8080, reload=True)
