/**
 * lib/types.ts
 * Complete type definitions for IDSS IBL Lesson Planner v2.0
 */

import { SUBJECTS } from './constants';

export type Language = 'bosnian' | 'german' | 'english';
export type Tier = 'MICRO' | 'STANDARD' | 'EXTENDED';
export type MessageRole = 'user' | 'model';
export type ChatMode = 'onboarding' | 'generate' | 'chat';
export type DocxExportStatus = 'idle' | 'loading' | 'success' | 'error';

export interface PlanRecord {
  id: string;
  created_at: string;
  updated_at: string;
  language: Language;
  subject: string;
  grade: number;
  topic: string;
  duration_min: number;
  tier: Tier;
  prior_knowledge?: string | null;
  notes?: string | null;
  plan_text: string;
  inquiry_question?: string | null;
  generation_time_ms?: number | null;
  gemini_key_index?: number | null;
  is_favourite: boolean;
  is_deleted: boolean;
  docx_export_count: number;
}

export type PlanCardData = Pick<
  PlanRecord,
  | 'id' | 'subject' | 'grade' | 'topic' | 'created_at'
  | 'duration_min' | 'tier' | 'language' | 'inquiry_question' | 'is_favourite'
>;

export interface GenerateParams {
  language: Language;
  subject: string;
  grade: number;
  topic: string;
  duration_min: number;
  tier: Tier;
  prior_knowledge?: string;
  notes?: string;
  zpd_calibration?: string;
}

export interface PlanFormData {
  language?: Language;
  subject?: string;
  grade?: number;
  topic?: string;
  duration_min: number;
  prior_knowledge?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isPlan?: boolean;
  plan_id?: string;
}

export interface ConversationState {
  mode: ChatMode;
  messages: ChatMessage[];
  activePlanId: string | null;
  activePlan: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface OnboardingState {
  step: number;
  language?: Language;
  subject?: string;
  grade?: number;
  topic?: string;
  duration_min?: number;
  prior_knowledge?: string;
  notes?: string;
  confirmed: boolean;
}

export interface DocxExportState {
  status: DocxExportStatus;
  filename?: string;
  error?: string;
}

export interface GenerateResponse {
  success: true;
  text: string;
  mode: ChatMode;
  plan_id: string | null;
  keyIndex: number;
  durationMs: number;
}

export interface PlansListResponse {
  plans: PlanCardData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  details?: Record<string, unknown>;
  status?: number;
}

export interface DashboardFilters {
  subject?: string;
  grade?: number | null;
  language?: Language | null;
  tier?: Tier | null;
  isFavourite?: boolean;
  searchQuery?: string;
  sortBy?: 'created_at' | 'updated_at' | 'subject' | 'grade';
  sortOrder?: 'asc' | 'desc';
}

export type Subject = typeof SUBJECTS[number];
