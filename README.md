# 🎬 ScriptED - AI-Powered Screenplay Enhancement

AI screenplay processing with Next.js frontend + FastAPI backend. Models load once at startup, persistent context across pipeline stages.

## ✅ ALL ISSUES FIXED! Ready to Use

### What Was Fixed:
1. ✅ **ModelRegistry Error** - Changed `.get()` to `.get_model()` in main.py
2. ✅ **Router Imports** - Updated enhance.py and finalize.py
3. ✅ **Ollama Integration** - Fixed response handling
4. ✅ **Startup Scripts** - Created reliable batch files with full Ollama path

## 🚀 Quick Start (Choose One Method)

### Method 1: Automatic ⭐ RECOMMENDED
```batch
# Just double-click this file:
START_EVERYTHING.bat

# Then open browser to:
http://localhost:3000/main
```
**That's it!** 4 windows will open automatically. Wait 2-3 minutes for Qwen model to load.

### Method 2: Manual (Step-by-Step)
```batch
1. Double-click: 1_START_OLLAMA.bat (wait 10 sec)
2. Double-click: 2_PRELOAD_QWEN.bat (wait 2 min)
3. Double-click: 3_START_BACKEND.bat (wait for "ready")
4. Double-click: 4_START_FRONTEND.bat (wait for "ready")
5. Open browser: http://localhost:3000/main
```

### Stopping Everything
```batch
# Double-click this file:
CLEANUP.bat
```

## Features

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **CUDA-capable GPU** (optional, for Qwen2-VL)
- **6GB+ VRAM** (for RTX 4050)

### Installation

#### 1. Clone Repository
```powershell
cd d:\SEM6\npxcreate_devhacks
```

#### 2. Backend Setup
```powershell
cd backend
.\setup.ps1
```

This script will:
- Create virtual environment
- Install dependencies
- Download spaCy model
- Create necessary directories
- Set up configuration

#### 3. Frontend Setup
```powershell
cd ..\scripted
npm install
```

### Running the Application

#### Option 1: Full Stack (Recommended)
```powershell
# From project root
.\start.ps1
```

This opens both backend and frontend in separate windows and launches the app in your browser.

#### Option 2: Manual Start

**Backend:**
```powershell
cd backend
& .\venv\Scripts\Activate.ps1
python main.py
```

**Frontend:**
```powershell
cd scripted
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📖 Usage

### Via Frontend UI

1. Navigate to http://localhost:3000
2. Go to "Main" section
3. Enter your screenplay text
4. (Optional) Upload scene image
5. (Optional) Add product context
6. Watch the pipeline visualization
7. Receive enhanced screenplay

### Via API

#### Simple Processing
```bash
curl -X POST "http://localhost:8000/api/v1/process-full-pipeline" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_script": "INT. COFFEE SHOP - DAY...",
    "tone_target": "dramatic"
  }'
```

#### Stage-by-Stage Processing

1. **Create Session**
```bash
curl -X POST "http://localhost:8000/api/v1/session/create" \
  -F "raw_script=INT. COFFEE SHOP - DAY..." \
  -F "tone_target=dramatic"
```

2. **Parse**
```bash
curl -X POST "http://localhost:8000/api/v1/parse/" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "your-session-id"}'
```

3. **Analyze, Enhance, Finalize**
(Similar pattern for `/analyze/`, `/enhance/`, `/finalize/`)

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# GPU Settings
USE_GPU=true
LOAD_IN_4BIT=true
GPU_MEMORY_FRACTION=0.85

# Model Selection
SPACY_MODEL=en_core_web_lg
MINILM_MODEL=sentence-transformers/all-MiniLM-L6-v2
QWEN_MODEL=Qwen/Qwen2-VL-7B-Instruct

# CORS
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend Configuration

Create `scripted/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 🎯 API Endpoints

### Health & Status
- `GET /health` - Check backend health and model status
- `GET /` - Root endpoint

### Session Management
- `POST /api/v1/session/create` - Create new session
- `GET /api/v1/session/{id}` - Get session status
- `GET /api/v1/session/{id}/result` - Get final result
- `DELETE /api/v1/session/{id}` - Delete session

### Pipeline Stages
- `POST /api/v1/parse/` - Parse screenplay
- `POST /api/v1/analyze/` - Analyze with embeddings
- `POST /api/v1/enhance/` - Enhance dialogues
- `POST /api/v1/finalize/` - Generate final screenplay

### Convenience
- `POST /api/v1/process-full-pipeline` - Run all stages at once

## 🧠 How It Works

### Context Persistence

The backend maintains a **persistent context** that evolves through each pipeline stage:

```python
Session Created → Parse → Analyze → Enhance → Finalize
      ↓            ↓        ↓          ↓          ↓
  Initialize   Add      Add       Add        Add
  Context   Structure Embeddings Enhanced  Final
                                 Dialogues Screenplay
```

Each stage:
1. Reads the full context
2. Processes with its model
3. Updates context with new data
4. Saves to disk

**Result**: No data loss, complete traceability, models never lose context.

### Model Loading Strategy

**Startup** (once, 2-3 minutes):
```
spaCy (CPU) → MiniLM (CPU) → Qwen2-VL (GPU, 4-bit) → Ready
```

**Per Request** (fast):
```
Retrieve models from registry → Process → Return
```

Models stay in memory throughout the application lifecycle.

## 📊 Performance

### Startup Times
- Backend initialization: **2-3 minutes** (one-time)
- Frontend build: **30-60 seconds**

### Processing Times (per screenplay)
- Parse: **1-2 seconds**
- Analyze: **2-3 seconds**
- Enhance: **5-10 seconds** (per batch)
- Finalize: **10-30 seconds**

### Memory Usage
- spaCy: ~500MB RAM
- MiniLM: ~80MB RAM
- Qwen2-VL: ~4GB VRAM (4-bit quantized)
- **Total**: ~600MB RAM + ~4GB VRAM

## 🐛 Troubleshooting

### Backend Won't Start

**Issue**: Models fail to load
```bash
# Solution: Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"

# If False, use CPU mode
# In backend/.env set: USE_GPU=false
```

**Issue**: CUDA Out of Memory
```bash
# Solution: Reduce GPU memory fraction
# In backend/.env set: GPU_MEMORY_FRACTION=0.7
```

### Frontend Can't Connect

**Issue**: CORS errors
```bash
# Solution: Update CORS_ORIGINS in backend/.env
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

**Issue**: Connection refused
```bash
# Check if backend is running
curl http://localhost:8000/health
```

### Slow Performance

**Issue**: Processing is slow
- Verify GPU is being used: Check `/health` endpoint
- Close other GPU applications
- Reduce batch sizes in services

## 📝 Development

### Adding New Pipeline Stages

1. Create service in `backend/services/`
2. Create router in `backend/routers/`
3. Add prompt in `backend/prompts/`
4. Update context manager if needed
5. Register router in `main.py`

### Frontend Development

```bash
cd scripted
npm run dev
```

Hot reload enabled. Edit components in `app/` and `components/`.

### Backend Development

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🚢 Deployment

### Docker Deployment

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN python -m spacy download en_core_web_lg
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t scripted-backend ./backend
docker run -p 8000:8000 scripted-backend
```

### Production Considerations

- Use **Gunicorn** with Uvicorn workers
- Enable **Redis** for distributed context storage
- Implement **rate limiting**
- Add **authentication**
- Use **HTTPS**
- Monitor with **Prometheus** + **Grafana**

## 📚 Documentation

- **Integration Guide**: `INTEGRATION_GUIDE.md`
- **Backend README**: `backend/README.md`
- **API Docs**: http://localhost:8000/docs (when running)

## 🤝 Contributing

This is a hackathon project. Feel free to:
- Report issues
- Suggest enhancements
- Submit pull requests

## 📄 License

MIT License

## 👥 Team

Built for ScriptED Hackathon Project

## 🎉 Acknowledgments

- **spaCy** - NLP processing
- **Sentence Transformers** - Embeddings
- **Qwen2-VL** - Multimodal AI
- **FastAPI** - Backend framework
- **Next.js** - Frontend framework

---

**Note**: First run downloads models (~5GB). Ensure stable internet connection.

For questions or issues, check the troubleshooting section or API documentation.
