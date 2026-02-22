# 🎬 ScriptED - AI Screenplay Enhancement Pipeline

## 🚀 New Groq-Powered Architecture

This is a **complete rebuild** with a clean, sequential 3-stage pipeline using **Groq's llama-3.1-8b-instant** model.

## 📋 Pipeline Flow

```
STAGE 1: Upload Script (Text/File) → Groq LLM Processing → Parse & Clean
         ↓
STAGE 2: Review in Notebook UI → Edit & Save → User Approval
         ↓
STAGE 3: AI Agent Enhancement (Multiple Personas) → Final Output
```

## 🎯 Key Features

✅ **File Upload**: PDF, DOCX, TXT  
✅ **Text Input**: Direct screenplay text entry  
✅ **Groq Integration**: Fast inference with llama-3.1-8b-instant  
✅ **Node-Based UI**: Visual pipeline with draggable nodes  
✅ **Notebook Editor**: Review & edit screenplay before proceeding  
✅ **AI Agents**: 10+ specialized personas (Comedy Writer, Noir Writer, Horror Director, etc.)  
✅ **ChromaDB**: Vector embeddings for semantic search  
✅ **Sentiment Analysis**: Emotion detection in dialogues  

## 🛠️ Installation

### Backend Setup

```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-multipart groq
pip install PyMuPDF python-docx spacy chromadb transformers torch

# Download spaCy model
python -m spacy download en_core_web_sm

# Set Groq API Key (if not hardcoded)
$env:GROQ_API_KEY="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"

# Run backend
python main_groq.py
```

**Backend will run on**: `http://localhost:8080`

### Frontend Setup

```powershell
cd scripted

# Install dependencies
npm install

# Run frontend
npm run dev
```

**Frontend will run on**: `http://localhost:3000`

## 📱 Usage

1. **Open Frontend**: Navigate to `http://localhost:3000/pipeline`

2. **Create Pipeline**:
   - Click on the first "Upload Script" node
   - Upload a file (PDF/DOCX/TXT) OR paste screenplay text
   - Click "Process Script"

3. **Review Output**:
   - After processing, a new node appears
   - Click the node to open the Notebook UI
   - Review the parsed screenplay
   - Edit JSON directly if needed

4. **Enhance with AI Agents** (Stage 3):
   - Use `/api/v1/pipeline/stage3-agent-handoff` endpoint
   - Available personas:
     - `writer_comedy` - Comedic dialogue rewrite
     - `writer_noir` - Noir-style dialogue
     - `character_psychologist` - Subtext analysis
     - `director_action` - Action-heavy camera moves
     - `director_horror` - Horror atmosphere
     - `cinematographer` - Visual framing
     - `world_builder` - Production design
     - `sound_designer` - Audio atmosphere
     - `script_doctor` - Pacing critique
     - `continuity_checker` - Logic errors

5. **Download**:
   - Click "Download" in the Notebook UI
   - Get JSON output with enhanced screenplay

## 🔧 API Endpoints

### 1. Upload File
```http
POST /api/v1/upload-script
Content-Type: multipart/form-data

{
  "file": <PDF/DOCX/TXT>,
  "session_id": "session_123"
}
```

### 2. Process Text
```http
POST /api/v1/process-text
Content-Type: application/x-www-form-urlencoded

raw_text=INT. SUBWAY CAR - MIDNIGHT...
session_id=session_123
```

### 3. AI Agent Enhancement
```http
POST /api/v1/pipeline/stage3-agent-handoff
Content-Type: application/x-www-form-urlencoded

session_id=session_123
persona=writer_comedy
user_feedback=Make it funnier!
```

### 4. Get Session
```http
GET /api/v1/session/{session_id}
```

## 🎨 Node UI Features

- **Drag & Drop**: Move nodes anywhere on canvas
- **Add Child Nodes**: Green + button creates next stage
- **Remove Nodes**: Red × button deletes node + children
- **Connect Nodes**: Blue "Connect" button links stages
- **Recycle Bin**: Restore deleted nodes
- **Color Coding**:
  - 🔵 Blue: Upload
  - 🟣 Purple: Stage 1 (Parse)
  - 🟡 Pink: Stage 2 (Analyze)
  - 🟠 Orange: Stage 3 (Enhance)
  - 🟢 Green: Final Output

## 📊 Data Flow

```
User Input (Text/File)
  ↓
Stage 0: Groq LLM → Clean & Format (Hollywood standard)
  ↓
Stage 1: Parser → Extract scenes, dialogues, actions
  ↓
Stage 1.5: ChromaDB → Vector embeddings
  ↓
Stage 2: Sentiment Analysis → Emotion tags
  ↓
Stage 3: AI Agents → Persona-based enhancement
  ↓
Final Output: Enhanced Screenplay JSON
```

## 🔥 Quick Start (Single Command)

Create a file `START_ALL_GROQ.bat`:

```batch
@echo off
title ScriptED - Groq Pipeline

echo Starting Backend...
start "Backend" cmd /k "cd backend && venv\Scripts\activate && python main_groq.py"

timeout /t 5

echo Starting Frontend...
start "Frontend" cmd /k "cd scripted && npm run dev"

echo.
echo ✅ All services started!
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000/pipeline
pause
```

## 🐛 Troubleshooting

### Backend Issues:
- **Import Error**: Run `pip install -r requirements.txt`
- **spaCy Error**: Run `python -m spacy download en_core_web_sm`
- **Groq API Error**: Check API key in `main_groq.py` line 31

### Frontend Issues:
- **Module Not Found**: Run `npm install`
- **API Connection Error**: Check backend is running on port 8080
- **CORS Error**: Backend CORS is already configured for all origins

## 📝 Notes

- **Model**: llama-3.1-8b-instant (8B parameters, fast inference)
- **Groq API Key**: Included in code (replace if needed)
- **Storage**: ChromaDB stores embeddings in `./chroma_storage/`
- **Session Storage**: In-memory (restart clears sessions)

## 🎯 Roadmap

- [ ] Image upload for Stage 2 (vision model integration)
- [ ] Persistent session storage (database)
- [ ] Export to PDF/Final Draft format
- [ ] Real-time collaboration
- [ ] Version control for edits

---

**Built with**: FastAPI, Next.js 16, Groq, ChromaDB, spaCy, Transformers  
**License**: MIT  
**Author**: Your Team
