# 🎬 DUAL-MODEL SCREENPLAY ENHANCEMENT SYSTEM

## 🎯 Overview

Your screenplay enhancement system now uses **TWO AI models** working in tandem:

1. **Llama3.2** (2GB) - Text enhancement, acts as professional director
2. **MiniCPM-V** (2.4GB) - Vision model for image analysis

---

## 🔄 Two-Stage Workflow

### **STAGE 1: Director Enhancement** (Text Only)
- **Model**: Llama3.2 (text-focused)
- **Input**: User's raw screenplay text
- **Process**: AI acts as a professional Hollywood director
- **Output**: Industry-standard formatted screenplay with enhanced dialogue

### **STAGE 2: Vision Integration** (Optional)
- **Model**: MiniCPM-V (vision-capable)
- **Input**: Image file + Stage 1 output
- **Process**: Analyzes image and integrates visual context
- **Output**: Final screenplay with visual descriptions added

---

## 📡 API Endpoints

### 1. Stage 1: Text Enhancement
```
POST /api/v1/enhanced/stage1-director
Content-Type: application/x-www-form-urlencoded

Body:
  raw_text: "Your screenplay text here"
  tone_target: "Dramatic" (optional)

Response:
{
  "session_id": "uuid",
  "stage": "stage1_director",
  "model_used": "llama3.2:latest",
  "enhanced_screenplay": "...",
  "message": "Stage 1 complete!"
}
```

### 2. Stage 2: Vision Enhancement
```
POST /api/v1/enhanced/stage2-vision
Content-Type: multipart/form-data

Body:
  session_id: "uuid from stage 1"
  image: [file upload]
  scene_context: "Beach scene" (optional)

Response:
{
  "session_id": "uuid",
  "stage": "stage2_vision", 
  "model_used": "minicpm-v:latest",
  "visual_description": "...",
  "final_screenplay": "...",
  "message": "Stage 2 complete!"
}
```

### 3. Get Session Results
```
GET /api/v1/enhanced/session/{session_id}

Response:
{
  "session_id": "uuid",
  "status": "completed",
  "stage1_complete": true,
  "stage2_complete": true,
  "stage1_output": "...",
  "stage2_output": "...",
  "visual_description": "...",
  "final_screenplay": "..."
}
```

---

## 🎭 How It Works

### Stage 1: Director Enhancement

**User Input:**
```
EXT. BEACH - DAY

One sunny day, SARAH walks along the beach.

SARAH
This is nice.
```

**Llama3.2 Enhances To:**
```
EXT. BEACH - DAY

The morning sun casts long shadows across the pristine sand. 
SARAH, late 20s, walks barefoot along the water's edge, lost 
in thought.

                    SARAH
          (breathing deeply)
This is exactly what I needed.
```

### Stage 2: Vision Enhancement

**User Uploads:** Beach photo with sunset

**MiniCPM-V Analyzes:** 
- "Golden hour lighting, warm orange tones"
- "Waves crashing gently on shore"
- "Peaceful, contemplative atmosphere"

**Integrated Result:**
```
EXT. BEACH - GOLDEN HOUR

The setting sun paints the sky in brilliant oranges and pinks. 
Waves crash gently against the shore as SARAH, late 20s, walks 
barefoot along the water's edge, lost in thought.

                    SARAH
          (breathing deeply)
This is exactly what I needed.
```

---

## 🚀 Quick Start

### Test Stage 1 Only:
```powershell
.\TEST_DUAL_MODEL.ps1
```

### Test Full Pipeline (with image):

```powershell
# Stage 1
$stage1 = Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/enhanced/stage1-director" `
    -Method Post `
    -Body @{raw_text="Your screenplay"; tone_target="Dramatic"} `
    -ContentType "application/x-www-form-urlencoded"

$sessionId = $stage1.session_id

# Stage 2 (optional)
$stage2 = Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/enhanced/stage2-vision" `
    -Method Post `
    -Form @{
        session_id=$sessionId
        image=Get-Item "path/to/image.jpg"
        scene_context="Beach scene"
    }
```

---

## 📁 File Structure

```
backend/
├── .env                          # Model configuration
├── config.py                     # Settings with TEXT_MODEL + VISION_MODEL
├── services/
│   └── dual_model_service.py    # New dual-model service
├── routers/
│   └── enhanced_pipeline.py     # New API endpoints
├── prompts/
│   ├── director_enhancement_prompt.txt  # Llama3.2 prompt
│   └── vision_analysis_prompt.txt       # MiniCPM-V prompt
└── context_manager.py           # Updated with stage1/stage2 fields
```

---

## 🎨 UI Integration Guide

### **Stage 1 UI:**
```typescript
// Text input area
<textarea placeholder="Enter your screenplay..."></textarea>
<select name="tone">
  <option>Dramatic</option>
  <option>Comedy</option>
  <option>Uplifting</option>
</select>
<button onClick={submitStage1}>Enhance with AI Director</button>

// Display result
<div className="enhanced-output">
  {stage1Response.enhanced_screenplay}
</div>
```

### **Stage 2 UI (Optional hover/button):**
```typescript
// Show after Stage 1 completes
{stage1Complete && (
  <div className="vision-enhancement">
    <p>Want to add visual context?</p>
    <input 
      type="file" 
      accept="image/*"
      onChange={handleImageUpload}
    />
    <button onClick={submitStage2}>
      Analyze Image
    </button>
  </div>
)}
```

---

## ⚙️ Configuration

**backend/.env:**
```properties
# Dual Model Configuration
TEXT_MODEL=llama3.2:latest       # For dialogue/structure
VISION_MODEL=minicpm-v:latest    # For image analysis
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 🎯 Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Text Enhancement** | minicpm-v (vision model) hallucinated content | Llama3.2 (text model) preserves & enhances |
| **Image Support** | None | MiniCPM-V analyzes and integrates visuals |
| **Director Quality** | Generic prompts | Professional director-style prompts |
| **Flexibility** | All-or-nothing | Optional 2-stage workflow |
| **Model Specialization** | One model does everything | Right model for right task |

---

## 🧪 Testing

1. **Test Backend:**
   ```powershell
   curl http://localhost:8000/docs
   ```

2. **Test Stage 1:**
   ```powershell
   .\TEST_DUAL_MODEL.ps1
   ```

3. **View API Docs:**
   Open: http://localhost:8000/docs
   Look for `/enhanced` endpoints

---

## 🐛 Troubleshooting

**Issue**: Stage 1 returns original text unchanged
- **Solution**: Check Backend window for Llama3.2 loading errors

**Issue**: Stage 2 says "vision analysis unavailable"
- **Solution**: Verify MiniCPM-V model is downloaded: `ollama list`

**Issue**: Models not found
- **Solution**: 
  ```powershell
  ollama pull llama3.2:latest
  ollama pull minicpm-v:latest
  ```

---

## 📞 API Response Examples

### Success Response (Stage 1):
```json
{
  "session_id": "a1b2c3d4-...",
  "stage": "stage1_director",
  "status": "success",
  "model_used": "llama3.2:latest",
  "enhanced_screenplay": "EXT. BEACH - DAY\n\nThe morning sun...",
  "message": "✅ Stage 1 complete! Text enhanced by AI director."
}
```

### Success Response (Stage 2):
```json
{
  "session_id": "a1b2c3d4-...",
  "stage": "stage2_vision",
  "status": "success",
  "model_used": "minicpm-v:latest",
  "visual_description": "Golden hour lighting with warm tones...",
  "final_screenplay": "EXT. BEACH - GOLDEN HOUR\n\nThe setting sun...",
  "message": "✅ Stage 2 complete! Visual context added."
}
```

---

## 🎬 Ready to Use!

Your system is now configured with:
- ✅ Llama3.2 for professional text enhancement
- ✅ MiniCPM-V for optional image analysis
- ✅ Industry-standard screenplay formatting
- ✅ Flexible 2-stage workflow
- ✅ Specialized prompts for each model

**Backend URL:** http://localhost:8000
**API Docs:** http://localhost:8000/docs
**Frontend:** http://localhost:3001/main
