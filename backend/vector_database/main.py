import os
import io
import json
import uuid
import fitz
import docx
from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from pipeline_cpu import stage1_parser, stage1_5_vectorize, stage2_analyzer

app = FastAPI(title="SCRIPTED AI Pipeline - Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_STORE = {}

async def extract_text_from_file(file: UploadFile) -> str:
    """Rips raw text out of PDF, DOCX, or TXT files while preserving visual layout."""
    content = await file.read()
    raw_text = ""
    filename = file.filename.lower()
    
    if filename.endswith('.pdf'):
        print(f"📄 Extracting text from PDF (Visual Layout Engine): {filename}")
        # PyMuPDF reads the physical page layout, stopping the "single word per line" glitch
        pdf_document = fitz.open(stream=content, filetype="pdf")
        for page in pdf_document:
            raw_text += page.get_text("text") + "\n"
            
    elif filename.endswith('.docx'):
        print(f"📝 Extracting text from DOCX: {filename}")
        doc = docx.Document(io.BytesIO(content))
        for para in doc.paragraphs: 
            raw_text += para.text + "\n"
            
    else:
        print(f"🔤 Extracting text from TXT: {filename}")
        raw_text = content.decode('utf-8', errors='ignore')
        
    return raw_text

@app.post("/api/v1/pipeline/stage1-parse")
async def run_stage_1(script_file: UploadFile = File(...)):
    print(f"\n🚀 [STAGE 1] Extracting text from {script_file.filename}...")
    
    raw_text = await extract_text_from_file(script_file)
    clean_script = raw_text.replace("\\n", "\n").replace("\\r", "")
    
    parsed_json = stage1_parser(clean_script)
    
    if not parsed_json["scenes"]:
        raise HTTPException(status_code=400, detail="Could not detect screenplay formatting in the document.")
    
    session_id = str(uuid.uuid4())
    stage1_5_vectorize(session_id, parsed_json)
    
    SESSION_STORE[session_id] = {
        "raw_script": clean_script,
        "stage1_data": parsed_json,
        "stage2_data": None
    }
    
    return {
        "status": "success",
        "session_id": session_id,
        "message": "File extracted, parsed, and vectorized.",
        "data": parsed_json
    }

@app.post("/api/v1/pipeline/stage2-analyze")
async def run_stage_2(session_id: str = Form(...), action: str = Form(...)):
    print(f"\n🧠 [STAGE 2] Action: {action.upper()} | Session: {session_id}")
    
    context = SESSION_STORE.get(session_id)
    if not context:
        raise HTTPException(status_code=404, detail="Session expired or not found.")
        
    stage1_json = context["stage1_data"]
    analyzed_json = stage2_analyzer(stage1_json)
    SESSION_STORE[session_id]["stage2_data"] = analyzed_json
    
    return {
        "status": "success",
        "session_id": session_id,
        "message": "Stage 2 complete.",
        "data": analyzed_json
    }

@app.post("/api/v1/pipeline/stage3-qwen-persona")
async def run_stage_3_qwen(
    session_id: str = Form(...),
    persona: str = Form(...), 
    user_feedback: str = Form(None) 
):
    print(f"\n🎬 [STAGE 3] Sending context to Qwen GPU as {persona.upper()}...")
    context = SESSION_STORE.get(session_id)
    if not context:
        raise HTTPException(status_code=404, detail="Session expired or not found.")
        
    pipeline_data = context["stage2_data"] or context["stage1_data"]
    
    mock_qwen_output = {
        "persona_applied": persona,
        "scene_id": pipeline_data["scenes"][0]["scene_id"] if pipeline_data["scenes"] else "Unknown",
        "gpu_output": f"[MOCK: Qwen has rewritten the JSON acting as the {persona}. Feedback applied: {user_feedback}]"
    }
    
    return {
        "status": "success",
        "session_id": session_id,
        "data": mock_qwen_output
    }

if __name__ == "__main__":
    print("Starting SCRIPTED Context Manager...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000)