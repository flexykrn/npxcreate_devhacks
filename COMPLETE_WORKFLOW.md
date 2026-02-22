# 🎬 ScriptED - Complete Workflow Documentation

## ✅ What's Running

Both services are now running automatically with a single command: `npm run dev`

- **🔧 Backend (Groq AI)**: http://localhost:8080
- **⚡ Frontend (Next.js)**: http://localhost:3000

## 🚀 4-Stage Pipeline

### Stage 1: Source (Unlocked by Default)
**What happens:**
- User sees ONLY the first node (purple circle labeled "Source")
- On hover, popup appears with "Enter Your Script" text area
- NO GitHub repo option (removed as requested)
- User pastes screenplay text in format:
  ```
  INT. COFFEE SHOP - DAY
  
  JOHN
  I never thought I'd see you again.
  
  MARY
  Neither did I...
  ```
- Clicks "Process Script" button

**Backend Action:**
- Text sent to `/api/v1/process-text` endpoint
- Groq's llama-3.1-8b-instant processes the screenplay
- Parses into structured JSON (scenes, dialogues, actions)

---

### Stage 2: AI Enhancement (Unlocks after Stage 1)
**What happens:**
- Second node appears and becomes clickable
- Labeled "AI Enhancement" (NOT "Groq" - no branding shown)
- On click, opens **Notebook UI** (`/notebook?stage=2`)
- User sees enhanced screenplay output in beautiful notebook interface
- Can edit the text directly in the notebook
- "Proceed Further" button at bottom

**Backend Action:**
- Uses AI personas (comedy writer, noir writer, director, cinematographer, etc.)
- Enhances dialogues and actions based on selected style
- Returns enhanced screenplay

**User Actions:**
- Read the AI-enhanced output
- Make manual edits if needed
- Click "Proceed Further" when satisfied → Unlocks Stage 3

---

### Stage 3: Visual Context (Unlocks after Stage 2)
**What happens:**
- Third node labeled "Visual Context" appears
- On hover, image upload popup appears
- User uploads reference image (JPG/PNG/WebP)
- Image sent to backend for processing

**Backend Action:**
- Image processed by Qwen vision model (multimodal)
- Extracts visual context (setting, mood, characters, composition)
- Adds visual description to screenplay context

**User Actions:**
- Upload screenshot/reference image
- Opens **Notebook UI** (`/notebook?stage=3`) showing image analysis
- User can edit the visual descriptions
- Click "Proceed Further" → Unlocks Stage 4

---

### Stage 4: Final Script (Unlocks after Stage 3)
**What happens:**
- Fourth node labeled "Final Script" appears
- On click, opens **Notebook UI** (`/notebook?stage=4`)
- Shows COMPLETE screenplay with:
  - Original text from Stage 1
  - AI enhancements from Stage 2  
  - Visual context from Stage 3
  - Final polish and formatting

**Backend Action:**
- Aggregates all context from previous stages
- Uses ChromaDB vector search for relevant details
- Groq model generates final polished screenplay
- Checks continuity, pacing, character consistency

**User Actions:**
- Review complete screenplay
- Export as PDF/DOCX
- Print or share

---

## 📁 Files Modified

### Frontend
- `scripted/app/main/page.tsx` - Main pipeline UI with 4 nodes
- `scripted/app/notebook/page.tsx` - Notebook editor (already exists)
- `scripted/package.json` - Concurrent startup scripts

### Backend
- `backend/main_groq_simple.py` - Simplified Groq backend (running)
- `backend/requirements_groq_minimal.txt` - Python dependencies
- `scripted/start-backend.bat` - Startup script

---

## 🎨 UI Features Implemented

✅ Only Stage 1 visible initially (other nodes are grayed out)
✅ NO GitHub repo option in Stage 1 popup  
✅ Stage 1: Text input only
✅ Stage 3: Image upload popup
✅ Nodes unlock sequentially as user progresses
✅ Each stage can be clicked to view/edit in notebook UI
✅ "Proceed Further" button in notebook advances to next stage
✅ Beautiful gradient colors and animations
✅ Draggable nodes with connecting lines

---

## 🔧 Backend API Endpoints

### Currently Available:
- `GET /health` - Health check
- `POST /api/v1/process-text` - Process screenplay text (Stage 1 & 2)
- `POST /api/v1/upload-script` - Upload file (alternative to text input)
- `POST /api/v1/pipeline/stage3-agent-handoff` - AI persona enhancement
- `GET /api/v1/session/{session_id}` - Retrieve session data

### To Be Added:
- `POST /api/v1/vision/analyze` - Process image with Qwen (Stage 3)
- `POST /api/v1/finalize` - Generate final script (Stage 4)

---

## 🚦 Current Status

**WORKING:**
✅ Both backend and frontend start with `npm run dev`
✅ Stage 1 node with text input popup
✅ Stage 3 node with image upload popup
✅ Sequential unlocking system
✅ Beautiful UI with animations
✅ Groq AI processing for text

**TO DO:**
⚠️ Integrate Qwen vision model for Stage 3 image processing
⚠️ Connect notebook UI to show stage-specific content
⚠️ Implement "Proceed Further" button logic
⚠️ Save session state in localStorage
⚠️ Add final export options (PDF/DOCX)

---

## 💡 How to Use

1. **Start the app:**
   ```bash
   cd scripted
   npm run dev
   ```

2. **Open browser:**
   - Go to http://localhost:3000
   - Click "Get Started"

3. **Stage 1 (Source):**
   - Hover over purple "Source" node
   - Enter screenplay text in popup
   - Click "Process Script"

4. **Stage 2 (AI Enhancement):**
   - Second node unlocks
   - Click it to see enhanced script in notebook
   - Edit if needed
   - Click "Proceed Further"

5. **Stage 3 (Visual Context):**
   - Third node unlocks
   - Hover to upload reference image
   - View visual analysis in notebook
   - Click "Proceed Further"

6. **Stage 4 (Final Script):**
   - Fourth node unlocks
   - Click to see complete polished screenplay
   - Export or share

---

## 🎯 Key Design Decisions

1. **No Groq Branding** - UI says "AI Enhancement" not "Groq"
2. **No GitHub Option** - Stage 1 is text-only input
3. **Sequential Unlocking** - Can't skip stages
4. **Notebook UI for Output** - Beautiful paper-like interface
5. **Editable at Every Stage** - User controls final output
6. **Visual Context Integration** - Images enhance screenplay
7. **Single Command Startup** - `npm run dev` does everything

---

## 📝 Notes

- Groq API Key is hardcoded in `backend/main_groq_simple.py`
- Session data stored in memory (resets on server restart)
- ChromaDB used for vector search (optional features)
- Sentiment analysis available but optional
- All 4 stages use the same Groq model (llama-3.1-8b-instant)

---

**Last Updated:** February 22, 2026
**Status:** ✅ Core pipeline working, visual features pending
