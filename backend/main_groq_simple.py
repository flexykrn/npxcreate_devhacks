import os, json, copy, re, shutil, sqlite3, base64, uuid, uvicorn
from dotenv import load_dotenv
load_dotenv()  # loads backend/.env automatically
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from typing import Optional
import fitz       # PyMuPDF
import docx

# ==========================================
# 1. SETUP
# ==========================================
print("Booting ScriptED Backend - Full Pipeline...")

app = FastAPI(title="ScriptED Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY environment variable is not set. Create backend/.env with GROQ_API_KEY=your_key")
groq_client  = Groq(api_key=GROQ_API_KEY)

SCRIPT_MODEL  = "llama-3.1-8b-instant"
VISION_MODEL  = "meta-llama/llama-4-scout-17b-16e-instruct"

# ==========================================
# 2. SQLITE VECTOR STORE (replaces ChromaDB)
# ==========================================
DB_PATH = "script_store.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""CREATE TABLE IF NOT EXISTS chunks (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        session  TEXT,
        chunk_type TEXT,
        character  TEXT,
        scene_id   TEXT,
        context    TEXT,
        content    TEXT
    )""")
    conn.commit(); conn.close()

init_db()

def vectorize_to_db(session_id: str, parsed_json: dict):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM chunks WHERE session=?", (session_id,))
    rows = []
    for scene in parsed_json.get("scenes", []):
        ctx = f"{scene.get('location','')} - {scene.get('time','')}"
        for a in scene.get("actions", []):
            rows.append((session_id, "action", "", str(scene["scene_id"]), ctx, a))
        for d in scene.get("dialogues", []):
            rows.append((session_id, "dialogue", d["character"], str(scene["scene_id"]), ctx,
                         f"{d['character']}: {d['text']}"))
    conn.executemany("INSERT INTO chunks(session,chunk_type,character,scene_id,context,content) VALUES(?,?,?,?,?,?)", rows)
    conn.commit(); conn.close()
    print(f"  Stored {len(rows)} chunks for session {session_id[:8]}")

def query_context(session_id: str, scene_id: str = None) -> list:
    conn = sqlite3.connect(DB_PATH)
    if scene_id:
        rows = conn.execute("SELECT content FROM chunks WHERE session=? AND scene_id=?",
                            (session_id, scene_id)).fetchall()
    else:
        rows = conn.execute("SELECT content FROM chunks WHERE session=?", (session_id,)).fetchall()
    conn.close()
    return [r[0] for r in rows]

# ==========================================
# 3. SESSION STORE
# ==========================================
SESSION_STORE: dict = {}

AGENT_CONFIG = {
    "writer_comedy":          ("dialogues", "You are an elite comedy writer. Rewrite dialogue to be sarcastic, witty, and darkly comedic."),
    "writer_noir":            ("dialogues", "You are a Noir writer. Rewrite dialogue to be gritty, cynical, and 1940s hardboiled."),
    "character_psychologist": ("dialogues", "You are a behavioral psychologist. Rewrite dialogue to reveal deep subtext and hidden fears."),
    "director_action":        ("actions",   "You are an adrenaline-fueled Action Director. Rewrite actions with whip pans, dynamic camera moves, and kinetic energy."),
    "director_horror":        ("actions",   "You are a Horror Director. Rewrite actions to maximize dread, creeping shadows, and eerie suspense."),
    "cinematographer":        ("actions",   "You are a Cinematographer. Rewrite actions focusing on 85mm lenses, chiaroscuro lighting, and visual framing."),
    "world_builder":          ("actions",   "You are a Production Designer. Rewrite actions focusing on gritty textures, set dressing, and environmental storytelling."),
    "sound_designer":         ("actions",   "You are a Sound Designer. Rewrite actions focusing on low-frequency rumbles, Foley details, and auditory atmosphere."),
    "script_doctor":          ("analysis",  "You are a ruthless Studio Executive. Analyze the scene pacing and stakes. Provide sharp, punchy critique."),
    "continuity_checker":     ("analysis",  "You are a meticulous Script Supervisor. Scan for logical errors, spatial inconsistencies, or timeline flaws."),
}

# ==========================================
# 4. PIPELINE HELPERS
# ==========================================

def extract_text(file_path: str) -> str:
    ext = file_path.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        with fitz.open(file_path) as doc:
            return "\n".join(p.get_text("text") for p in doc)
    if ext == "docx":
        return "\n".join(p.text for p in docx.Document(file_path).paragraphs)
    if ext == "txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    raise ValueError("Unsupported format. Use PDF, DOCX, or TXT.")

def stage0_format(raw: str) -> str:
    print("  Stage 0: Groq formatting...")
    r = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": (
                "You are a screenplay formatting engine. Convert ANY text into strict Hollywood format.\n"
                "RULES:\n1. Scene headings: INT./EXT. LOCATION - TIME\n"
                "2. Character names in ALL CAPS on their own line.\n"
                "3. Normal action lines.\n4. Output ONLY the formatted script, no commentary."
            )},
            {"role": "user", "content": raw[:15000]}
        ], model=SCRIPT_MODEL, temperature=0.2)
    return r.choices[0].message.content.strip()

def stage1_parse(script: str) -> dict:
    print("  Stage 1: Parsing scenes...")
    data = {"scenes": [], "metadata": {"total_word_count": len(script.split())}}
    cur_scene, cur_char = None, None
    for raw_line in script.splitlines():
        line = raw_line.strip()
        if not line: continue
        if line.upper().startswith(("INT.", "EXT.")):
            if cur_scene: data["scenes"].append(cur_scene)
            parts = line.split(" - ", 1)
            cur_scene = {"scene_id": len(data["scenes"]) + 1,
                         "location": parts[0], "time": parts[1] if len(parts) > 1 else "DAY",
                         "dialogues": [], "actions": []}
            cur_char = None
        elif line.isupper() and 0 < len(line.split()) < 5 and not re.search(r'[.,;!?]', line):
            cur_char = line
        elif line.startswith("(") and line.endswith(")"):
            continue
        elif cur_char and cur_scene:
            cur_scene["dialogues"].append({"character": cur_char, "text": line})
            cur_char = None
        elif cur_scene:
            cur_scene["actions"].append(line)
    if cur_scene: data["scenes"].append(cur_scene)
    return data

def stage2_analyze(parsed: dict) -> dict:
    print("  Stage 2: Analyzing pacing...")
    for scene in parsed["scenes"]:
        a, d = len(scene["actions"]), len(scene["dialogues"])
        scene["pacing"] = "Action-Heavy" if a > d else "Dialogue-Heavy"
        scene["emotion"] = "NEUTRAL"
        if scene["dialogues"]:
            sample = " ".join(dia["text"] for dia in scene["dialogues"][:3])
            try:
                r = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "Classify the dominant emotion of this dialogue in ONE word (e.g. TENSE, HOPEFUL, ANGRY, FEARFUL, ROMANTIC, COMEDIC, NEUTRAL). Reply with only the word."},
                        {"role": "user", "content": sample[:500]}
                    ], model=SCRIPT_MODEL, temperature=0)
                scene["emotion"] = r.choices[0].message.content.strip().upper()[:20]
            except Exception:
                pass
    return parsed

def run_full_pipeline(raw_text: str, session_id: str) -> dict:
    clean   = stage0_format(raw_text)
    parsed  = stage1_parse(clean)
    final   = stage2_analyze(parsed)
    vectorize_to_db(session_id, final)
    SESSION_STORE[session_id] = {
        "stage1_data": final, "stage2_data": None,
        "raw_text": raw_text, "clean_text": clean, "visual_context": []
    }
    return final, clean

# ==========================================
# 5. ENDPOINTS
# ==========================================

@app.get("/health")
async def health():
    return {"status": "healthy", "script_model": SCRIPT_MODEL, "vision_model": VISION_MODEL}

# ── Process raw text ──────────────────────────────────────────────────────────
@app.post("/api/v1/process-text")
async def process_text(raw_text: str = Form(...), session_id: Optional[str] = Form(None)):
    if not session_id: session_id = str(uuid.uuid4())
    print(f"\n[process-text] session={session_id[:8]}")
    try:
        final, clean = run_full_pipeline(raw_text, session_id)
        return {"status": "success", "data": final, "clean_text": clean, "session_id": session_id}
    except Exception as e:
        raise HTTPException(500, str(e))

# ── Upload file ───────────────────────────────────────────────────────────────
@app.post("/api/v1/upload-script")
async def upload_script(file: UploadFile = File(...), session_id: str = Form(...)):
    print(f"\n[upload-script] {file.filename}")
    os.makedirs("temp_uploads", exist_ok=True)
    tmp = f"temp_uploads/{session_id}_{file.filename}"
    try:
        with open(tmp, "wb") as f: shutil.copyfileobj(file.file, f)
        raw = extract_text(tmp)
        final, clean = run_full_pipeline(raw, session_id)
        return {"status": "success", "data": final, "clean_text": clean, "session_id": session_id}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        if os.path.exists(tmp): os.remove(tmp)

# ── Persona agent rewrite ─────────────────────────────────────────────────────
@app.post("/api/v1/pipeline/stage3-agent-handoff")
async def agent_handoff(session_id: str = Form(...), persona: str = Form(...),
                        user_feedback: Optional[str] = Form(None)):
    print(f"\n[agent] session={session_id[:8]} persona={persona}")
    session = SESSION_STORE.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found. Process text first.")
    if persona not in AGENT_CONFIG:
        raise HTTPException(400, f"Unknown persona: {persona}")

    surgery_type, base_prompt = AGENT_CONFIG[persona]
    working = copy.deepcopy(session.get("stage2_data") or session["stage1_data"])
    visual_ctx = session.get("visual_context", [])

    sys_prompt = base_prompt
    if visual_ctx:
        sys_prompt += f"\n\nVISUAL CONTEXT FROM UPLOADED IMAGES:\n" + "\n".join(visual_ctx)
    if user_feedback:
        sys_prompt += f"\n\nUSER DIRECTIVE: {user_feedback}"

    if surgery_type == "dialogues":
        sys_prompt += '\nOutput ONLY valid JSON: {"data": [{"character": "NAME", "text": "NEW TEXT"}]}'
    elif surgery_type == "actions":
        sys_prompt += '\nOutput ONLY valid JSON: {"data": ["action 1", "action 2"]}'
    else:
        sys_prompt += '\nOutput ONLY valid JSON: {"data": "analysis notes here"}'

    try:
        for scene in working["scenes"]:
            db_chunks = query_context(session_id, str(scene["scene_id"]))
            rag_ctx   = "\n".join(db_chunks[:20]) if db_chunks else ""
            payload   = {"scene": scene, "rag_context": rag_ctx}

            r = groq_client.chat.completions.create(
                messages=[{"role": "system", "content": sys_prompt},
                          {"role": "user",   "content": json.dumps(payload)}],
                model=SCRIPT_MODEL, temperature=0.7)
            raw_resp = r.choices[0].message.content.strip()
            raw_resp = re.sub(r"^```(json)?|```$", "", raw_resp, flags=re.MULTILINE).strip()
            parsed   = json.loads(raw_resp)
            new_data = parsed.get("data")

            if new_data is None: continue
            if surgery_type == "dialogues": scene["dialogues"] = new_data
            elif surgery_type == "actions":  scene["actions"]  = new_data
            else:                             scene[f"{persona}_notes"] = new_data

        session["stage2_data"] = working
        clean_out = scenes_to_text(working)
        return {"status": "success", "data": working, "clean_text": clean_out}
    except Exception as e:
        print(f"  ERROR: {e}")
        raise HTTPException(500, str(e))

# ── Vision: analyze uploaded image with Groq vision ──────────────────────────
@app.post("/api/v1/vision/analyze")
async def analyze_image(file: UploadFile = File(...), session_id: str = Form(...),
                        prompt: Optional[str] = Form(None)):
    print(f"\n[vision] session={session_id[:8]} file={file.filename}")
    try:
        img_bytes  = await file.read()
        b64_img    = base64.b64encode(img_bytes).decode("utf-8")
        media_type = file.content_type or "image/jpeg"

        user_prompt = prompt or (
            "Analyze this image for a screenplay. Describe:\n"
            "1. Setting/Location details (lighting, atmosphere, time of day)\n"
            "2. Key visual elements, props, colors\n"
            "3. Emotional tone and mood\n"
            "4. Camera angle / composition suggestions\n"
            "Be concise and specific for a cinematographer."
        )

        r = groq_client.chat.completions.create(
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url",
                     "image_url": {"url": f"data:{media_type};base64,{b64_img}"}},
                    {"type": "text", "text": user_prompt}
                ]
            }],
            model=VISION_MODEL, temperature=0.3)

        analysis = r.choices[0].message.content.strip()

        # Store in session for RAG context carry-forward
        if session_id not in SESSION_STORE:
            SESSION_STORE[session_id] = {"visual_context": []}
        SESSION_STORE[session_id].setdefault("visual_context", []).append(
            f"[Image: {file.filename}]\n{analysis}")

        return {"status": "success", "analysis": analysis, "session_id": session_id}
    except Exception as e:
        print(f"  VISION ERROR: {e}")
        raise HTTPException(500, str(e))

# ── Get session data ──────────────────────────────────────────────────────────
@app.get("/api/v1/session/{session_id}")
async def get_session(session_id: str):
    s = SESSION_STORE.get(session_id)
    if not s: raise HTTPException(404, "Session not found")
    return {"status": "success", "session": s}

# ── Helpers ───────────────────────────────────────────────────────────────────
def scenes_to_text(data: dict) -> str:
    lines = []
    for scene in data.get("scenes", []):
        lines.append(f"{scene.get('location','INT. SCENE')} - {scene.get('time','DAY')}")
        lines.append("")
        for a in scene.get("actions", []):
            lines.append(a)
        lines.append("")
        for d in scene.get("dialogues", []):
            lines.append(d["character"])
            lines.append(d["text"])
            lines.append("")
        lines.append("")
    return "\n".join(lines).strip()

if __name__ == "__main__":
    uvicorn.run("main_groq_simple:app", host="0.0.0.0", port=8080, reload=False)