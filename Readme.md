# 🎬 ScriptED - Complete User Guide

## 📖 Table of Contents
1. [System Overview](#system-overview)
2. [Installation](#installation)
3. [Pipeline Workflow](#pipeline-workflow)
4. [Node UI Guide](#node-ui-guide)
5. [Notebook Editor](#notebook-editor)
6. [AI Agents](#ai-agents)
7. [API Reference](#api-reference)

---

## 🎯 System Overview

ScriptED is an AI-powered screenplay enhancement tool that uses a **3-stage pipeline**:

1. **STAGE 1**: Upload & Parse - Convert messy text into Hollywood format
2. **STAGE 2**: Analyze & Review - Add sentiment analysis, review in notebook
3. **STAGE 3**: AI Enhancement - Use specialized agents to enhance specific elements

### 🤖 Core Technology
- **LLM**: Local Llama-3.1-8b running on CPU (fully offline)
- **Vector DB**: ChromaDB for semantic search
- **Sentiment Analysis**: DistilBERT
- **NLP**: spaCy for text processing
- **Frontend**: Next.js 16 with Framer Motion
- **Backend**: FastAPI with Python 3.13

---

## 🛠️ Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- 4GB RAM minimum
- Windows 10/11 (or WSL2)

### Step 1: Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Test backend
python main.py
```

**Expected Output**:
```
🚀 Booting up ScriptED Backend (Local Mode)...
Loading spaCy NLP engine...
Loading local ChromaDB Client...
Loading DistilBERT Sentiment Analyzer...
Loading Local LLM Model...
INFO:     Uvicorn running on http://127.0.0.1:8080
```

### Step 2: Frontend Setup

```powershell
# Navigate to frontend
cd scripted

# Install dependencies
npm install

# Run development server
npm run dev
```

**Expected Output**:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Turbopack:    ✓ Enabled
```

### Step 3: Verify Installation

Open browser: `http://localhost:3000/pipeline`

You should see a **single blue node** labeled "Upload Script".

---

## 🚀 Pipeline Workflow

### Phase 1: Upload Script

**Option A: Text Input**
1. Click the blue "Upload Script" node
2. Paste screenplay text:
   ```
   INT. SUBWAY CAR - MIDNIGHT

   The fluorescent lights flicker wildly, casting eerie shadows on the
   walls. ELIAS sits in the corner, clutching a black briefcase to his
   chest. He's sweating profusely and scanning the car nervously.

   MARA walks down the aisle and sits beside him.

   MARA
   Why are you sweating so much, Elias?

   ELIAS
   I think they're following us. They know about the drive.
   ```
3. Click "Process Script"

**Option B: File Upload**
1. Click "Upload File (PDF, DOCX, TXT)"
2. Select your screenplay file
3. Click "Process Script"

**What Happens**:
- Local LLM cleans and formats the text
- Parser extracts scenes, dialogues, and actions
- ChromaDB creates vector embeddings
- Sentiment analysis adds emotion tags
- New "Stage 1: Parse" node appears

### Phase 2: Review & Edit

1. **Click the Purple "Stage 1: Parse" node**
2. **Notebook UI opens** with two panels:
   - **Left Panel**: Formatted preview
   - **Right Panel**: Editable JSON
3. **Edit the JSON** if needed:
   - Fix character names
   - Adjust scene headings
   - Modify dialogue
4. **Click "Save Changes"**
5. **Click "Download"** to export

**JSON Structure**:
```json
{
  "scenes": [
    {
      "scene_id": 1,
      "location": "INT. SUBWAY CAR",
      "time": "MIDNIGHT",
      "actions": [
        "The fluorescent lights flicker wildly..."
      ],
      "dialogues": [
        {
          "character": "MARA",
          "text": "Why are you sweating so much, Elias?",
          "emotion": "NEGATIVE"
        }
      ],
      "pacing": "Character-Driven / Dialogue-Heavy"
    }
  ],
  "metadata": {
    "total_word_count": 87
  }
}
```

### Phase 3: AI Enhancement (Optional)

**Use the API** to enhance specific elements:

```powershell
# Example: Rewrite dialogue as comedy
curl -X POST http://localhost:8080/api/v1/pipeline/stage3-agent-handoff `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "session_id=session_123&persona=writer_comedy"

# Example: Add horror atmosphere
curl -X POST http://localhost:8080/api/v1/pipeline/stage3-agent-handoff `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "session_id=session_123&persona=director_horror&user_feedback=Make it terrifying"

# Note: All processing happens locally on your machine
```

---

## 🎨 Node UI Guide

### Node Types (Color Coded)

| Color | Stage | Description |
|-------|-------|-------------|
| 🔵 Blue | Upload | File/text input |
| 🟣 Purple | Stage 1 | Parsing complete |
| 🟡 Pink | Stage 2 | Analysis complete |
| 🟠 Orange | Stage 3 | AI enhancement |
| 🟢 Green | Final | Output ready |

### Node Actions

**Hover on Node** → See 3 buttons:
- **Green +**: Add child node (next stage)
- **Red ×**: Delete node + children
- **Blue "Connect"**: Link to another node

**Click Node** → Opens Notebook UI (if data available)

**Drag Node** → Move anywhere on canvas

### Connecting Nodes

1. Click "Connect" button on source node
2. Click on target node
3. Purple dashed line appears
4. Target node becomes child of source

### Recycle Bin

- **Bottom Right** → Trash icon with counter
- Click → See deleted nodes
- Click "Restore" → Bring back node (if parent exists)

---

## 📝 Notebook Editor

### Layout

```
+------------------+------------------+
|   Preview Panel  |   Edit Panel     |
|   (Formatted)    |   (JSON Editor)  |
+------------------+------------------+
|       Metadata Bar                  |
+-------------------------------------+
```

### Features

1. **Preview Panel**:
   - Shows formatted screenplay
   - Scene headings in bold
   - Character names in CAPS
   - Actions in regular text

2. **Edit Panel**:
   - Editable JSON
   - Syntax highlighting
   - Auto-validation

3. **Toolbar**:
   - **Back to Pipeline**: Return to node view
   - **Save Changes**: Update session
   - **Download**: Export JSON

4. **Metadata**:
   - Session ID
   - Scene count
   - Word count
   - Processing status

---

## 🤖 AI Agents

### Dialogue Agents

#### 1. Comedy Writer (`writer_comedy`)
**Transforms**: Serious → Sarcastic & Witty
```
Before: "We need to leave now."
After:  "Oh sure, let's just casually waltz out the door with half the city's goons on our tail. Great plan, Einstein."
```

#### 2. Noir Writer (`writer_noir`)
**Transforms**: Modern → 1940s Hardboiled
```
Before: "I don't trust you."
After:  "You're trouble, doll. The kind that wears lipstick and leaves a trail of broken hearts."
```

#### 3. Character Psychologist (`character_psychologist`)
**Adds**: Subtext & Hidden Motivations
```
Before: "I'm fine."
After:  "I'm fine. (beat) Though 'fine' is what you say when the truth would crack you open."
```

### Action/Visual Agents

#### 4. Action Director (`director_action`)
**Adds**: Dynamic Camera Moves
```
Before: "He runs down the hallway."
After:  "WHIP PAN - He EXPLODES down the hallway, camera TRACKING at dutch angle, fluorescent lights STROBING overhead."
```

#### 5. Horror Director (`director_horror`)
**Adds**: Dread & Suspense
```
Before: "She walks into the room."
After:  "She crosses the threshold. The door creaks shut behind her. In the corner, something shifts in the shadows."
```

#### 6. Cinematographer (`cinematographer`)
**Adds**: Lens & Lighting Details
```
Before: "They sit at the table."
After:  "85mm lens, f/2.8. Chiaroscuro lighting carves their faces in half. The table sits in a pool of amber tungsten."
```

#### 7. World Builder (`world_builder`)
**Adds**: Production Design
```
Before: "A messy apartment."
After:  "The apartment reeks of stale cigarettes. Peeling wallpaper. A vintage rotary phone on a water-stained side table. Dust motes swim in slatted light."
```

#### 8. Sound Designer (`sound_designer`)
**Adds**: Auditory Details
```
Before: "The train stops."
After:  "The train SCREECHES to a halt, metal-on-metal SCREAMING. Low-frequency rumble fades. Distant drip. Eerie silence."
```

### Analysis Agents

#### 9. Script Doctor (`script_doctor`)
**Provides**: Pacing Critique
```
Output: "Scene drags in Act 2. Stakes unclear. Protagonist passive. CUT 30 seconds or add conflict beat."
```

#### 10. Continuity Checker (`continuity_checker`)
**Finds**: Logic Errors
```
Output: "Timeline issue: Character mentions 'tomorrow' but next scene shows '3 days later'. Spatial error: Gun disappears from table between cuts."
```

### Usage Example

```bash
# Rewrite all dialogue as noir
curl -X POST http://localhost:8080/api/v1/pipeline/stage3-agent-handoff \
  -d "session_id=session_123" \
  -d "persona=writer_noir"

# Add horror atmosphere with custom feedback
curl -X POST http://localhost:8080/api/v1/pipeline/stage3-agent-handoff \
  -d "session_id=session_123" \
  -d "persona=director_horror" \
  -d "user_feedback=Focus on psychological terror, not jump scares"
```

---

## 📡 API Reference

### Base URL
```
http://localhost:8080/api/v1
```

### Endpoints

#### 1. Health Check
```http
GET /health
```
**Response**:
```json
{
  "status": "healthy",
  "model": "llama-3.1-8b-local",
  "local_llm_loaded": true,
  "spacy_loaded": true,
  "sentiment_loaded": true
}
```

#### 2. Upload Script File
```http
POST /upload-script
Content-Type: multipart/form-data

file: <PDF/DOCX/TXT>
session_id: "session_123"
```

#### 3. Process Raw Text
```http
POST /process-text
Content-Type: application/x-www-form-urlencoded

raw_text: "INT. SUBWAY CAR - MIDNIGHT..."
session_id: "session_123"
```

#### 4. AI Agent Enhancement
```http
POST /pipeline/stage3-agent-handoff
Content-Type: application/x-www-form-urlencoded

session_id: "session_123"
persona: "writer_comedy"
user_feedback: "Make it funnier!" (optional)
```

#### 5. Get Session Data
```http
GET /session/{session_id}
```

### Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid persona, missing fields) |
| 404 | Session Not Found |
| 500 | Server Error (LLM failure, parsing error) |

---

## 🎯 Best Practices

### 1. Input Formatting
- Use proper scene headings: `INT. LOCATION - TIME`
- Character names in ALL CAPS on separate line
- One blank line between paragraphs

### 2. Session Management
- Use unique session IDs
- Sessions are in-memory (restart clears them)
- Download JSON after each stage

### 3. AI Enhancement
- Start with one agent per session
- Review output before applying next agent
- Use `user_feedback` for specific requests

### 4. Performance
- Files > 10MB may be slow
- Use text input for faster processing
- All processing happens locally (no internet required)

---

## 🐛 Troubleshooting

### Backend Won't Start
**Error**: `ModuleNotFoundError: No module named 'transformers'`
```powershell
pip install -r requirements.txt
```

**Error**: `Can't find model 'en_core_web_sm'`
```powershell
python -m spacy download en_core_web_sm
```

### Frontend Won't Load
**Error**: `Module not found: Can't resolve '@/lib/api'`
```powershell
npm install
```

### API Errors
**Error**: `404 Session Not Found`
- Check session ID is correct
- Restart backend (sessions are in-memory)

**Error**: `500 LLM Loading Error`
- Ensure you have at least 8GB RAM free
- Local LLM model takes 30-60 seconds to load on first run

### Node UI Issues
**Problem**: Nodes not draggable
- Refresh page
- Clear localStorage: `localStorage.clear()` in console

---
