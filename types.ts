export type ThoughtCategory = 'idea' | 'todo' | 'worry' | 'feeling' | 'goal' | 'memory' | 'other';

export type NextStepType = 'do' | 'clarify' | 'reflect';

export type GrowthStage = 'seed' | 'sprout' | 'bloom' | 'fruit';

export interface NextStep {
  text: string;
  type: NextStepType;
  confidence: number;
}

export interface ThoughtMeta {
  emotion: string;
  intent?: string; // Optional/Legacy
  intensity: 'low' | 'medium' | 'high';
  metaphors: string[];
  category: ThoughtCategory;
  topic: string; // Short 3-6 word label
  hasNextStep: boolean;
  nextStep: NextStep | null;
}

export interface GeneratedContent {
  imageUrl: string;
  reflection: string;
  meta: ThoughtMeta;
}

export interface Position {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface ThoughtUpdate {
  id: string;
  timestamp: number;
  text: string;
  aiResponse: string;
  previousStage: GrowthStage;
  newStage: GrowthStage;
}

export interface ThoughtCard extends GeneratedContent {
  id: string;
  originalText: string;
  createdAt: number;
  position: Position;
  hasViewed: boolean;
  growthStage: GrowthStage;
  updates: ThoughtUpdate[];
}

export enum AppView {
  GARDEN = 'GARDEN',
  LIST = 'LIST'
}