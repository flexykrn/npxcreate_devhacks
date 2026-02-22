const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface SessionResponse {
  session_id: string;
  status: string;
  message: string;
  created_at: string;
}

export interface StageResponse {
  session_id: string;
  stage: string;
  status: string;
  message: string;
  data?: any;
  errors?: string[];
}

export interface ParseResponse extends StageResponse {
  parsed_scenes?: number;
  parsed_dialogues?: number;
}

export interface AnalyzeResponse extends StageResponse {
  embeddings_generated?: number;
  similarity_scores?: {
    dialogue_coherence: number;
    scene_coherence: number;
  };
}

export interface EnhanceResponse extends StageResponse {
  dialogues_enhanced?: number;
}

export interface FinalizeResponse extends StageResponse {
  final_screenplay?: string;
  word_count?: number;
}

export interface SessionStatus {
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  pipeline_history: any[];
  errors: any[];
  has_parsed_structure: boolean;
  has_embeddings: boolean;
  has_enhanced_dialogues: boolean;
  has_final_screenplay: boolean;
}

export interface FinalResult {
  session_id: string;
  status: string;
  final_screenplay: string;
  parsed_structure: any;
  analysis_results: any;
  enhanced_dialogues: any[];
  pipeline_history: any[];
}

/**
 * ScriptPipeline class for stage-by-stage screenplay processing
 */
export class ScriptPipeline {
  private sessionId: string | null = null;
  private onProgress?: (stage: string, data: any) => void;

  constructor(onProgress?: (stage: string, data: any) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Create a new session
   */
  async createSession(
    rawScript: string,
    toneTarget?: string,
    productContext?: string,
    sceneImage?: File
  ): Promise<string> {
    const formData = new FormData();
    formData.append('raw_script', rawScript);
    
    if (toneTarget) formData.append('tone_target', toneTarget);
    if (productContext) formData.append('product_context', productContext);
    if (sceneImage) formData.append('scene_image', sceneImage);

    const response = await fetch(`${API_BASE_URL}/session/create`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data: SessionResponse = await response.json();
    this.sessionId = data.session_id;
    
    this.onProgress?.('session_created', data);
    
    return this.sessionId;
  }

  /**
   * Parse screenplay structure
   */
  async parse(): Promise<ParseResponse> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(`${API_BASE_URL}/parse/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: this.sessionId }),
    });

    if (!response.ok) {
      throw new Error(`Parse failed: ${response.statusText}`);
    }

    const data: ParseResponse = await response.json();
    this.onProgress?.('parse', data);
    
    return data;
  }

  /**
   * Analyze screenplay with embeddings
   */
  async analyze(): Promise<AnalyzeResponse> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(`${API_BASE_URL}/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: this.sessionId }),
    });

    if (!response.ok) {
      throw new Error(`Analyze failed: ${response.statusText}`);
    }

    const data: AnalyzeResponse = await response.json();
    this.onProgress?.('analyze', data);
    
    return data;
  }

  /**
   * Enhance dialogues with AI
   */
  async enhance(): Promise<EnhanceResponse> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(`${API_BASE_URL}/enhance/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: this.sessionId }),
    });

    if (!response.ok) {
      throw new Error(`Enhance failed: ${response.statusText}`);
    }

    const data: EnhanceResponse = await response.json();
    this.onProgress?.('enhance', data);
    
    return data;
  }

  /**
   * Generate final screenplay
   */
  async finalize(includeFormatting: boolean = true): Promise<FinalizeResponse> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(`${API_BASE_URL}/finalize/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: this.sessionId,
        include_formatting: includeFormatting,
      }),
    });

    if (!response.ok) {
      throw new Error(`Finalize failed: ${response.statusText}`);
    }

    const data: FinalizeResponse = await response.json();
    this.onProgress?.('finalize', data);
    
    return data;
  }

  /**
   * Get session status
   */
  async getStatus(): Promise<SessionStatus> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(`${API_BASE_URL}/session/${this.sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get final result
   */
  async getResult(): Promise<FinalResult> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await fetch(
      `${API_BASE_URL}/session/${this.sessionId}/result`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get result: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Run complete pipeline
   */
  async runFullPipeline(): Promise<FinalResult> {
    await this.parse();
    await this.analyze();
    await this.enhance();
    await this.finalize();
    return this.getResult();
  }

  /**
   * Delete session
   */
  async deleteSession(): Promise<void> {
    if (!this.sessionId) return;

    await fetch(`${API_BASE_URL}/session/${this.sessionId}`, {
      method: 'DELETE',
    });

    this.sessionId = null;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

/**
 * Helper function for safe API calls
 */
export async function safeApiCall<T>(
  apiFunction: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await apiFunction();
    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
