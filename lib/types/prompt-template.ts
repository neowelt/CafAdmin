/**
 * Prompt Template types matching backend models
 */

export interface PromptTemplate {
  promptId: string;
  name: string;
  description: string;
  prompt: string;
  promptType: 'text' | 'json';
  beforeImageKey?: string;
  afterImageKey?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptTemplateRequest {
  name: string;
  description: string;
}

export interface UpdatePromptTemplateRequest {
  name?: string;
  description?: string;
  prompt?: string;
  promptType?: 'text' | 'json';
  beforeImageKey?: string;
  afterImageKey?: string;
  published?: boolean;
}

export interface TestPromptResponse {
  success: boolean;
  generatedImageBase64?: string;
  error?: string;
}
