const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ProcessScriptRequest {
  raw_script: string;
  tone_target?: string;
  product_context?: string;
}

export interface Stage1Response {
  session_id: string;
  stage: string;
  status: string;
  model_used: string;
  enhanced_screenplay: string;
  message: string;
}

export interface Stage2Response {
  session_id: string;
  stage: string;
  status: string;
  model_used: string;
  visual_description: string;
  final_screenplay: string;
  message: string;
}

export interface ProcessScriptResponse {
  session_id: string;
  status: string;
  final_screenplay: string;
  pipeline_history: any[];
  parsed_scenes: number;
  parsed_dialogues: number;
  embeddings_generated: number;
}

export interface HealthStatus {
  status: string;
  models_loaded: {
    spacy: boolean;
    minilm: boolean;
    qwen: boolean;
    qwen_processor: boolean;
  };
  gpu_available: boolean;
  ai_enhancement_ready: boolean;
  version: string;
  device: string;
  message: string;
}

/**
 * STAGE 1: Process screenplay with Llama3.2 (Director Mode)
 * This replaces the old full pipeline for text-only enhancement
 */
export async function processScriptStage1(
  request: ProcessScriptRequest
): Promise<Stage1Response> {
  const formData = new FormData();
  formData.append('raw_text', request.raw_script);
  if (request.tone_target) {
    formData.append('tone_target', request.tone_target);
  }

  const response = await fetch(`${API_BASE_URL}/enhanced/stage1-director`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = typeof error.detail === 'string' 
      ? error.detail 
      : JSON.stringify(error.detail || error);
    throw new Error(errorMessage || `API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * STAGE 2: Add visual context with MiniCPM-V (Optional)
 */
export async function processScriptStage2(
  sessionId: string,
  imageFile: File,
  sceneContext?: string
): Promise<Stage2Response> {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('image', imageFile);
  if (sceneContext) {
    formData.append('scene_context', sceneContext);
  }

  const response = await fetch(`${API_BASE_URL}/enhanced/stage2-vision`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = typeof error.detail === 'string' 
      ? error.detail 
      : JSON.stringify(error.detail || error);
    throw new Error(errorMessage || `API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * OLD API: Process a screenplay through the complete pipeline (DEPRECATED)
 * Use processScriptStage1() instead for better results
 */
export async function processScript(
  request: ProcessScriptRequest
): Promise<ProcessScriptResponse> {
  const response = await fetch(`${API_BASE_URL}/process-full-pipeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = typeof error.detail === 'string' 
      ? error.detail 
      : JSON.stringify(error.detail || error);
    throw new Error(errorMessage || `API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check backend health and model status
 */
export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch('http://localhost:8000/health');
  
  if (!response.ok) {
    throw new Error('Backend is not available');
  }
  
  return response.json();
}

/**
 * Check if backend is ready
 */
export async function isBackendReady(): Promise<boolean> {
  try {
    const health = await checkHealth();
    return health.status === 'healthy' || health.status === 'partial';
  } catch {
    return false;
  }
}
