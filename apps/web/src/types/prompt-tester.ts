import { z } from 'zod';

export const EvaluateRequestSchema = z.object({
  prompt: z.string(),
  models: z.array(z.string().min(1)).min(1),
  inputs: z.array(
    z.object({
      input_id: z.string().min(1),
      content: z.string(),
    })
  ).min(1),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type EvaluateRequest = z.infer<typeof EvaluateRequestSchema>;

export interface ListItem {
  id: string;
  name: string;
}

export interface InputItem extends ListItem {
  content: string;
}

export interface PromptItem extends ListItem {
  prompt: string;
  results: Record<string, Record<string, CellResult>>;
}

export interface ModelItem extends ListItem {
  modelId: string;
  enabled: boolean;
}

export interface CellResult {
  output: string | null;
  error: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

export interface TestConfig {
  id: string;
  name: string;
  inputs: InputItem[];
  prompts: PromptItem[];
  models: ModelItem[];
  temperature: number;
}

export interface ResultSnapshot {
  inputs: InputItem[];
  prompts: PromptItem[];
  models: ModelItem[];
}

export type SectionAccent = 'teal' | 'blue' | 'violet' | 'neutral';

export const accentStyles: Record<SectionAccent, { active: string; hover: string; add: string; title: string }> = {
  teal:    { active: 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-900 dark:text-teal-100', hover: 'hover:border-teal-300 dark:hover:border-teal-600', add: 'hover:border-teal-300 dark:hover:border-teal-600', title: 'text-teal-600 dark:text-teal-400' },
  blue:    { active: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100', hover: 'hover:border-blue-300 dark:hover:border-blue-600', add: 'hover:border-blue-300 dark:hover:border-blue-600', title: 'text-blue-600 dark:text-blue-400' },
  violet:  { active: 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-900 dark:text-violet-100', hover: 'hover:border-violet-300 dark:hover:border-violet-600', add: 'hover:border-violet-300 dark:hover:border-violet-600', title: 'text-violet-600 dark:text-violet-400' },
  neutral: { active: 'border-primary bg-primary/10 text-foreground', hover: 'hover:border-primary/40', add: 'hover:border-primary/40', title: 'text-muted-foreground' },
};

export const DEFAULT_MODELS: ModelItem[] = [
  { id: 'm1', name: 'mistral-small-3.2-24b-instruct', modelId: 'mistralai/mistral-small-3.2-24b-instruct', enabled: true },
  { id: 'm2', name: 'gemini-2.5-flash-lite', modelId: 'google/gemini-2.5-flash-lite', enabled: true },
  { id: 'm3', name: 'gemini-3-flash-preview', modelId: 'google/gemini-3-flash-preview', enabled: true },
  { id: 'm4', name: 'claude-opus-4.6', modelId: 'anthropic/claude-opus-4.6', enabled: true },
  { id: 'm5', name: 'claude-opus-4.5', modelId: 'anthropic/claude-opus-4.5', enabled: true },
  { id: 'm6', name: 'gpt-5.2-chat', modelId: 'openai/gpt-5.2-chat', enabled: true },
];

let nextId = 1;
export function genId(prefix: string): string {
  return `${prefix}${Date.now()}-${nextId++}`;
}

export function makeDefaultTest(id: string, name: string): TestConfig {
  return {
    id,
    name,
    inputs: [{ id: 'i1', name: 'Input 1', content: '' }],
    prompts: [{ id: 'p1', name: 'Prompt 1', prompt: '', results: {} }],
    models: [...DEFAULT_MODELS],
    temperature: 0.7,
  };
}
