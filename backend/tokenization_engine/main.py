from fastapi import FastAPI, Form, UploadFile, File
from pipeline_cpu import stage1_parser, stage2_analyzer
import uvicorn
import shutil
import os

app = FastAPI(title="SCRIPTED AI Pipeline - CPU Orchestrator")

# Ensure an upload folder exists for the images
os.makedirs("temp_uploads", exist_ok=True)

@app.post("/api/v1/process-script")
async def process_script(
    tone_target: str = Form(...),
    raw_script: str = Form(...),
    scene_image: UploadFile = File(None)
):
    print(f"\n🚀 New Request Received from Insomnia/Frontend!")
    print(f"Target Tone: {tone_target}")
    
    # ==========================================
    # INITIALIZE THE MASTER PAYLOAD
    # ==========================================
    master_payload = {
        "user_settings": {
            "target_tone": tone_target
        },
        "visual_context": "None",
        "narrative_data": {}
    }

    # ==========================================
    # 1. HANDLE IMAGE UPLOAD (Preparing for Stage 4)
    # ==========================================
    if scene_image:
        print(f"Receiving Image: {scene_image.filename}")
        file_path = f"temp_uploads/{scene_image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(scene_image.file, buffer)
            
        # Since you don't have a GPU, we MOCK your friend's Stage 4 response here
        master_payload["visual_context"] = f"[MOCK: GPU will extract vibe from {scene_image.filename} here]"
    
    # ==========================================
    # 2. RUN YOUR REAL CPU PIPELINE (Stages 1 & 2)
    # ==========================================
    print("Sanitizing text from Insomnia...")
    # FIX: Restore actual line breaks if Insomnia squashed or escaped them
    clean_script = raw_script.replace("\\n", "\n").replace("\\r", "")
    
    print("Running Stage 1 (spaCy Parser)...")
    parsed_json = stage1_parser(clean_script)
    
    print("Running Stage 2 (Narrative Analyzer)...")
    analyzed_json = stage2_analyzer(parsed_json)
    
    # Attach your finished work to the master payload
    master_payload["narrative_data"] = analyzed_json
    
    # ==========================================
    # 3. RETURN DATA (Ready for Stage 6 Qwen)
    # ==========================================
    # This massive, perfectly organized JSON is what you will eventually send to 
    # your friend's GPU for the final rewrite.
    return {
        "status": "success",
        "message": "CPU Pipeline complete. Ready for GPU.",
        "final_pipeline_json": master_payload
    }

if __name__ == "__main__":
    print("Starting FastAPI Server...")
    # FIX: Remove reload=True to prevent multiprocessing crashes on Windows with heavy ML models
    uvicorn.run("main:app", host="127.0.0.1", port=8000)