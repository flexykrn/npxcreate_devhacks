# ScriptED Backend

Production-ready FastAPI backend for screenplay processing with persistent context management and model preloading.

## 🎬 Architecture Overview

### Pipeline Flow
1. **Session Creation** - Initialize context with raw script
2. **Parse** (spaCy) - Extract structure, scenes, dialogues
3. **Analyze** (MiniLM) - Generate embeddings, similarity analysis
4. **Enhance** (Qwen2-VL) - Improve dialogues with AI
5. **Finalize** (Qwen2-VL) - Generate production-ready screenplay

### Key Features
- ✅ Models preload at startup (no per-request loading)
- ✅ Persistent context across pipeline stages
- ✅ MCP-style context management
- ✅ Async processing for long-running tasks
- ✅ 4-bit quantization for RTX 4050 (6GB VRAM)
- ✅ Modular architecture
- ✅ Production-ready error handling

## 📁 Project Structure

```
backend/
├── main.py                    # FastAPI app with model preloading
├── model_loader.py            # Global model registry (singleton)
├── context_manager.py         # Persistent context management
├── config.py                  # Configuration management
├── requirements.txt           # Dependencies
├── .env.example              # Environment template
│
├── models/                    # Pydantic models
│   ├── requests.py           # Request schemas
│   ├── responses.py          # Response schemas
│   └── context.py            # Context data models
│
├── routers/                   # API endpoints
│   ├── session.py            # Session management
│   ├── parse.py              # spaCy parsing
│   ├── analyze.py            # Embedding analysis
│   ├── enhance.py            # Qwen enhancement
│   └── finalize.py           # Final generation
│
├── services/                  # Business logic
│   ├── spacy_service.py      # spaCy processing
│   ├── embedding_service.py  # MiniLM embeddings
│   └── qwen_service.py       # Qwen multimodal
│
├── prompts/                   # LLM prompts
│   ├── structure_prompt.txt
│   ├── narrative_prompt.txt
│   ├── dialogue_prompt.txt
│   └── final_prompt.txt
│
└── utils/                     # Utilities
    └── helpers.py
```

## 🚀 Installation

### Prerequisites
- Python 3.10+
- CUDA-capable GPU (optional, for Qwen)
- 6GB+ VRAM (for RTX 4050)

### Setup

1. **Clone and navigate**
```powershell
cd backend
```

2. **Create virtual environment**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

3. **Install dependencies**
```powershell
pip install -r requirements.txt
```

4. **Download spaCy model**
```powershell
python -m spacy download en_core_web_lg
```

5. **Configure environment**
```powershell
cp .env.example .env
# Edit .env with your settings
```

## 🎯 Usage

### Start Server

```powershell
python main.py
```

Server runs on: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### Model Loading

Models load **automatically at startup**:
- ✅ spaCy (CPU) - ~500MB
- ✅ MiniLM (CPU) - ~80MB
- ✅ Qwen2-VL (GPU, 4-bit) - ~4GB VRAM

Total startup time: ~2-3 minutes (one-time)

### API Endpoints

#### Health Check
```bash
GET /health
```

#### Create Session
```bash
POST /api/v1/session/create
Content-Type: multipart/form-data

{
  "raw_script": "INT. COFFEE SHOP - DAY...",
  "tone_target": "dramatic",
  "product_context": "Apple MacBook"
}
```

#### Parse Screenplay
```bash
POST /api/v1/parse/
{
  "session_id": "uuid-here"
}
```

#### Analyze
```bash
POST /api/v1/analyze/
{
  "session_id": "uuid-here"
}
```

#### Enhance
```bash
POST /api/v1/enhance/
{
  "session_id": "uuid-here"
}
```

#### Finalize
```bash
POST /api/v1/finalize/
{
  "session_id": "uuid-here",
  "include_formatting": true
}
```

#### Full Pipeline (Convenience)
```bash
POST /api/v1/process-full-pipeline
{
  "raw_script": "...",
  "tone_target": "dramatic"
}
```

## 🧠 Context Management

### How It Works

1. **Session Creation**: Creates unique session ID and initializes context
2. **Context Updates**: Each stage reads full context, processes, and updates
3. **Persistence**: Context saved to disk after each update
4. **No Data Loss**: Models always have access to complete history

### Context Structure
```python
{
  "session_id": "uuid",
  "status": "parsing|analyzed|enhanced|completed",
  "raw_script": "...",
  "parsed_structure": {...},
  "embeddings": [...],
  "analysis_results": {...},
  "enhanced_dialogues": [...],
  "final_screenplay": "...",
  "pipeline_history": [...]
}
```

## 🔧 Configuration

### GPU Memory Optimization

For RTX 4050 (6GB):
```python
# config.py
LOAD_IN_4BIT = True
GPU_MEMORY_FRACTION = 0.85
```

### Model Selection

Change models in `config.py`:
```python
SPACY_MODEL = "en_core_web_lg"
MINILM_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
QWEN_MODEL = "Qwen/Qwen2-VL-7B-Instruct"
```

## 📊 Performance

- **Startup**: ~2-3 minutes (one-time model loading)
- **Parse**: ~1-2 seconds per screenplay
- **Analyze**: ~2-3 seconds per screenplay
- **Enhance**: ~5-10 seconds per batch (5 dialogues)
- **Finalize**: ~10-30 seconds for full screenplay

## 🔗 Frontend Integration

### From Next.js Frontend

```typescript
// Create session
const response = await fetch('http://localhost:8000/api/v1/session/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    raw_script: scriptText,
    tone_target: 'dramatic'
  })
});

const { session_id } = await response.json();

// Process pipeline stages
await fetch(`http://localhost:8000/api/v1/parse/`, {
  method: 'POST',
  body: JSON.stringify({ session_id })
});

// ... repeat for analyze, enhance, finalize

// Get final result
const result = await fetch(`http://localhost:8000/api/v1/session/${session_id}/result`);
const { final_screenplay } = await result.json();
```

## 🐛 Troubleshooting

### CUDA Out of Memory
- Reduce `GPU_MEMORY_FRACTION` in config
- Ensure no other GPU processes running
- Use CPU-only mode: `USE_GPU=false`

### Models Not Loading
- Check internet connection (first run downloads models)
- Verify spaCy model: `python -m spacy download en_core_web_lg`
- Check disk space (~10GB needed)

### Slow Performance
- Verify GPU is being used: Check `/health` endpoint
- Reduce batch sizes in services
- Use CPU-only for spaCy and MiniLM (already configured)

## 📝 Development

### Run in Dev Mode
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing
```powershell
# Test health
curl http://localhost:8000/health

# Test full pipeline
curl -X POST http://localhost:8000/api/v1/process-full-pipeline \
  -H "Content-Type: application/json" \
  -d '{"raw_script": "INT. ROOM - DAY\nJOHN\nHello world."}'
```

## 🚢 Production Deployment

### With Docker (Recommended)
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN python -m spacy download en_core_web_lg
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### With Gunicorn
```powershell
pip install gunicorn
gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📄 License

MIT

## 👥 Contributors

Built for ScriptED Hackathon Project
