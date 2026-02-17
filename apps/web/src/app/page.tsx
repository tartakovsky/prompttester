'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, SignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────

interface ManualPost {
  id: string;
  label: string;
  content: string;
}

interface CellResult {
  score: number | null;
  reasoning: string | null;
  post_recap: string | null;
  actions: string[] | null;
  comment: string | null;
  error: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

interface PromptVariant {
  id: string;
  name: string;
  prompt: string;
  results: Record<string, Record<string, CellResult>>;
}

type TestType = 'scorer' | 'commenter';

// ─── Default Models ──────────────────────────────────────────

const DEFAULT_MODELS = [
  'google/gemini-2.0-flash',
  'deepseek/deepseek-chat-v3',
  'meta-llama/llama-3.3-70b-instruct',
  'anthropic/claude-3.5-haiku',
  'qwen/qwen-2.5-72b-instruct',
];

// ─── Cache Helpers ───────────────────────────────────────────

function cacheLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`prompttester:${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function cacheSave(key: string, value: unknown) {
  try {
    localStorage.setItem(`prompttester:${key}`, JSON.stringify(value));
  } catch { /* ignore */ }
}

function cacheLoadStr(key: string): string | null {
  try {
    return localStorage.getItem(`prompttester:${key}`);
  } catch {
    return null;
  }
}

function cacheSaveStr(key: string, value: string) {
  try {
    localStorage.setItem(`prompttester:${key}`, value);
  } catch { /* ignore */ }
}

// ─── Helpers ─────────────────────────────────────────────────

function truncate(text: string | null | undefined, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

function shortModelName(modelId: string): string {
  const parts = modelId.split('/');
  const name = parts.length > 1 ? parts[1]! : parts[0]!;
  return name.replace(/:.*$/, '');
}

function scoreColor(score: number): string {
  if (score >= 0.8) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 0.6) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  if (score >= 0.4) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

function makeDefaultVariant(): PromptVariant {
  return { id: 'v1', name: 'v1 Default', prompt: '', results: {} };
}

let nextId = 1;
function genId(): string {
  return `p${Date.now()}-${nextId++}`;
}

// ─── Vertical Prompt List ────────────────────────────────────

function PromptList({
  variants,
  activeId,
  onSelect,
  onAdd,
  onRemove,
  onRename,
}: {
  variants: PromptVariant[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const finish = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex w-[160px] min-w-[160px] flex-col gap-0.5">
      {variants.map((v) => (
        <div
          key={v.id}
          className={cn(
            'group flex items-center rounded-md border px-2.5 py-1.5 text-sm cursor-pointer select-none transition-colors',
            v.id === activeId
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
          onClick={() => onSelect(v.id)}
          onDoubleClick={() => {
            setEditingId(v.id);
            setEditName(v.name);
          }}
        >
          {editingId === v.id ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={finish}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finish();
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-full bg-transparent text-sm outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate">{v.name}</span>
          )}
          {variants.length > 1 && editingId !== v.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(v.id);
              }}
              className="ml-1 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
            >
              &times;
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center justify-center rounded-md border border-dashed border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
      >
        +
      </button>
    </div>
  );
}

// ─── Vertical Model List (for prompt-first mode) ─────────────

function ModelList({
  models,
  activeId,
  onSelect,
}: {
  models: string[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex w-[160px] min-w-[160px] flex-col gap-0.5">
      {models.map((model) => (
        <div
          key={model}
          className={cn(
            'flex items-center rounded-md border px-2.5 py-1.5 text-sm font-mono cursor-pointer select-none transition-colors',
            model === activeId
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
          onClick={() => onSelect(model)}
        >
          <span className="flex-1 truncate text-xs">{shortModelName(model)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Result Cell ─────────────────────────────────────────────

function ResultCell({
  cell,
  cellKey,
  isExpanded,
  onToggle,
  testType,
}: {
  cell: CellResult | undefined;
  cellKey: string;
  isExpanded: boolean;
  onToggle: (key: string) => void;
  testType: TestType;
}) {
  if (!cell) {
    return (
      <td className="px-3 py-2 align-top text-xs text-muted-foreground/40 italic">
        No result
      </td>
    );
  }

  if (cell.error) {
    return (
      <td className="px-3 py-2 align-top">
        <p className="text-xs text-destructive">{truncate(cell.error, 150)}</p>
      </td>
    );
  }

  if (testType === 'commenter') {
    return (
      <td className="px-3 py-2 align-top">
        <div className="space-y-1">
          {cell.comment && (
            <button
              onClick={() => onToggle(cellKey)}
              className="text-left text-xs leading-relaxed hover:text-foreground transition-colors"
            >
              <span className={cn('block transition-all duration-200', !isExpanded && 'line-clamp-3')}>
                {cell.comment}
              </span>
              {cell.comment.length > 120 && (
                <span className="text-[10px] text-primary/60 mt-0.5 inline-block">
                  {isExpanded ? 'show less' : 'show more'}
                </span>
              )}
            </button>
          )}
          {cell.input_tokens != null && cell.output_tokens != null && (
            <p className="text-[10px] text-muted-foreground/50">
              {cell.input_tokens}+{cell.output_tokens} tok
            </p>
          )}
        </div>
      </td>
    );
  }

  return (
    <td className="px-3 py-2 align-top">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {cell.score != null && (
            <span
              className={cn(
                'inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-bold tabular-nums',
                scoreColor(cell.score)
              )}
            >
              {cell.score.toFixed(2)}
            </span>
          )}
          {cell.actions && cell.actions.length > 0 && cell.actions.map((a) => (
            <Badge key={a} variant="outline" className="text-[10px] px-1 py-0">
              {a}
            </Badge>
          ))}
        </div>
        {cell.reasoning && (
          <button
            onClick={() => onToggle(cellKey)}
            className="text-left text-xs text-muted-foreground leading-relaxed hover:text-foreground transition-colors"
          >
            <span className={cn('block transition-all duration-200', !isExpanded && 'line-clamp-2')}>
              {cell.reasoning}
            </span>
            {cell.reasoning.length > 80 && (
              <span className="text-[10px] text-primary/60 mt-0.5 inline-block">
                {isExpanded ? 'show less' : 'show more'}
              </span>
            )}
          </button>
        )}
        {cell.input_tokens != null && cell.output_tokens != null && (
          <p className="text-[10px] text-muted-foreground/50">
            {cell.input_tokens}+{cell.output_tokens} tok
          </p>
        )}
      </div>
    </td>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function PromptTesterPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-8">
        <SignIn withSignUp routing="virtual" />
      </div>
    );
  }

  return <PromptTester />;
}

function PromptTester() {
  // API key
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Config state
  const [testType, setTestTypeRaw] = useState<TestType>('scorer');
  const setTestType = (t: TestType) => {
    setTestTypeRaw(t);
    cacheSaveStr('type', t);
  };
  const [thresholdLike, setThresholdLike] = useState(0.5);
  const [thresholdComment, setThresholdComment] = useState(0.7);
  const [thresholdShare, setThresholdShare] = useState(0.9);
  const [thresholdSave, setThresholdSave] = useState(0.8);
  const [temperature, setTemperature] = useState(0.7);

  // Posts
  const [posts, setPosts] = useState<ManualPost[]>([{ id: genId(), label: '', content: '' }]);

  // Multi-prompt variant state
  const [variants, setVariants] = useState<PromptVariant[]>([makeDefaultVariant()]);
  const [activeVariantId, setActiveVariantId] = useState('v1');
  const [viewMode, setViewMode] = useState<'model-first' | 'prompt-first'>('model-first');
  const [activeModelId, setActiveModelId] = useState('');
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const nextVariantNum = useRef(2);

  // Model state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [customModel, setCustomModel] = useState('');

  // Evaluate state
  const [evaluating, setEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState('');
  const [evalError, setEvalError] = useState<string | null>(null);
  const evalAbortRef = useRef<AbortController | null>(null);

  // Model pricing from OpenRouter
  const [modelPricing, setModelPricing] = useState<Record<string, { prompt: number; completion: number }>>({});

  // Refs
  const testTypeRef = useRef(testType);
  useEffect(() => { testTypeRef.current = testType; }, [testType]);

  const activeVariant = variants.find((v) => v.id === activeVariantId) ?? variants[0]!;
  const hasAnyResults = variants.some(v => Object.keys(v.results).length > 0);

  // ─── Load from cache on mount ─────────────────────────────

  useEffect(() => {
    // API key
    const savedKey = cacheLoadStr('apiKey');
    if (savedKey) setApiKey(savedKey);

    // Test type
    const savedType = cacheLoadStr('type');
    if (savedType === 'scorer' || savedType === 'commenter') setTestTypeRaw(savedType);

    // Temperature
    const savedTemp = cacheLoadStr('temperature');
    if (savedTemp) {
      const val = parseFloat(savedTemp);
      if (!isNaN(val)) setTemperature(val);
    }

    // Thresholds
    const savedThresh = cacheLoad<{ like: number; comment: number; share: number; save: number }>('thresholds');
    if (savedThresh) {
      setThresholdLike(savedThresh.like);
      setThresholdComment(savedThresh.comment);
      setThresholdShare(savedThresh.share);
      setThresholdSave(savedThresh.save);
    }

    // Posts
    const savedPosts = cacheLoad<ManualPost[]>('posts');
    if (savedPosts && savedPosts.length > 0) setPosts(savedPosts);

    // Custom models
    const savedCustom = cacheLoad<string[]>('customModels');
    if (savedCustom && savedCustom.length > 0) setCustomModels(savedCustom);

    // Selected models
    const savedSelection = cacheLoad<string[]>('models');
    if (savedSelection && savedSelection.length > 0) {
      setSelectedModels(savedSelection);
    } else {
      setSelectedModels(DEFAULT_MODELS);
    }

    // Fetch available models + pricing from OpenRouter
    fetch('https://openrouter.ai/api/v1/models')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.data) return;
        const models: string[] = [];
        const pricing: Record<string, { prompt: number; completion: number }> = {};
        for (const m of data.data) {
          if (m.id) {
            models.push(m.id);
            if (m.pricing) {
              pricing[m.id] = {
                prompt: parseFloat(m.pricing.prompt ?? '0'),
                completion: parseFloat(m.pricing.completion ?? '0'),
              };
            }
          }
        }
        setAvailableModels(models);
        setModelPricing(pricing);
      })
      .catch(() => {});
  }, []);

  // Load variants when testType changes
  const isLoadingVariants = useRef(false);
  useEffect(() => {
    isLoadingVariants.current = true;
    const loaded = cacheLoad<PromptVariant[]>(`variants:${testType}`);
    if (loaded && loaded.length > 0) {
      setVariants(loaded);
      setActiveVariantId(loaded[0]!.id);
      const maxNum = loaded.reduce((max, v) => {
        const match = v.id.match(/^v(\d+)$/);
        return match ? Math.max(max, parseInt(match[1]!, 10)) : max;
      }, 0);
      nextVariantNum.current = maxNum + 1;
    } else {
      setVariants([makeDefaultVariant()]);
      setActiveVariantId('v1');
      nextVariantNum.current = 2;
    }
  }, [testType]);

  // Auto-save variants
  useEffect(() => {
    if (isLoadingVariants.current) {
      isLoadingVariants.current = false;
      return;
    }
    cacheSave(`variants:${testType}`, variants);
  }, [variants, testType]);

  // Auto-save settings
  const isLoadingSettings = useRef(true);
  useEffect(() => {
    if (isLoadingSettings.current) {
      isLoadingSettings.current = false;
      return;
    }
    cacheSaveStr('temperature', String(temperature));
    cacheSave('thresholds', {
      like: thresholdLike, comment: thresholdComment,
      share: thresholdShare, save: thresholdSave,
    });
  }, [temperature, thresholdLike, thresholdComment, thresholdShare, thresholdSave]);

  // Auto-save posts
  useEffect(() => {
    cacheSave('posts', posts);
  }, [posts]);

  // Auto-save API key
  useEffect(() => {
    if (apiKey) cacheSaveStr('apiKey', apiKey);
  }, [apiKey]);

  // Set initial activeModelId when models are loaded
  useEffect(() => {
    if (selectedModels.length > 0 && !selectedModels.includes(activeModelId)) {
      setActiveModelId(selectedModels[0]!);
    }
  }, [selectedModels, activeModelId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { evalAbortRef.current?.abort(); };
  }, []);

  // ─── Post Management ──────────────────────────────────────

  const updatePostLabel = (id: string, label: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, label } : p));
  };

  const updatePostContent = (id: string, content: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p));
  };

  const addPost = () => {
    setPosts(prev => [...prev, { id: genId(), label: '', content: '' }]);
  };

  const removePost = (id: string) => {
    if (posts.length <= 1) return;
    setPosts(prev => prev.filter(p => p.id !== id));
    setVariants(prev => prev.map(v => ({ ...v, results: {} })));
  };

  // ─── Variant Management ────────────────────────────────────

  const addVariant = useCallback(() => {
    const num = nextVariantNum.current++;
    const nv: PromptVariant = {
      id: `v${num}`,
      name: `v${num} Untitled`,
      prompt: '',
      results: {},
    };
    setVariants(prev => [...prev, nv]);
    setActiveVariantId(nv.id);
  }, []);

  const removeVariant = useCallback(
    (id: string) => {
      if (variants.length <= 1) return;
      setVariants(prev => prev.filter(v => v.id !== id));
      if (activeVariantId === id) {
        setActiveVariantId(variants.find(v => v.id !== id)?.id ?? variants[0]!.id);
      }
    },
    [variants, activeVariantId]
  );

  const renameVariant = useCallback((id: string, name: string) => {
    setVariants(prev => prev.map(v => (v.id === id ? { ...v, name } : v)));
  }, []);

  const updateVariantPrompt = useCallback(
    (text: string) => {
      setVariants(prev =>
        prev.map(v => (v.id === activeVariantId ? { ...v, prompt: text } : v))
      );
    },
    [activeVariantId]
  );

  // ─── Model Management ─────────────────────────────────────

  const toggleModel = (model: string) => {
    setSelectedModels(prev => {
      const next = prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model];
      cacheSave('models', next);
      return next;
    });
  };

  const addCustomModel = () => {
    const trimmed = customModel.trim();
    if (!trimmed) return;
    if (availableModels.includes(trimmed) || customModels.includes(trimmed)) {
      if (!selectedModels.includes(trimmed)) {
        setSelectedModels(prev => {
          const next = [...prev, trimmed];
          cacheSave('models', next);
          return next;
        });
      }
      setCustomModel('');
      return;
    }
    const nextCustom = [...customModels, trimmed];
    setCustomModels(nextCustom);
    setSelectedModels(prev => {
      const next = [...prev, trimmed];
      cacheSave('models', next);
      return next;
    });
    cacheSave('customModels', nextCustom);
    setCustomModel('');
  };

  const removeCustomModel = (model: string) => {
    const nextCustom = customModels.filter(m => m !== model);
    setCustomModels(nextCustom);
    setSelectedModels(prev => {
      const next = prev.filter(m => m !== model);
      cacheSave('models', next);
      return next;
    });
    cacheSave('customModels', nextCustom);
  };

  // ─── Expand/collapse cells ─────────────────────────────────

  const toggleCell = useCallback((cellKey: string) => {
    setExpandedCells(prev => {
      const next = new Set(prev);
      if (next.has(cellKey)) next.delete(cellKey);
      else next.add(cellKey);
      return next;
    });
  }, []);

  // ─── Run Evaluation ────────────────────────────────────────

  const postsForEval = posts.filter(p => p.content.trim().length > 0);
  const canEval = postsForEval.length > 0 && selectedModels.length > 0 && variants.some(v => v.prompt.trim().length > 0) && !evaluating && apiKey.trim().length > 0;

  const runEval = useCallback(async () => {
    const variantsToRun = variants.filter(v => v.prompt.trim().length > 0);
    const validPosts = posts.filter(p => p.content.trim().length > 0);
    if (variantsToRun.length === 0 || validPosts.length === 0 || selectedModels.length === 0) return;

    evalAbortRef.current?.abort();
    const controller = new AbortController();
    evalAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 300_000);

    setEvaluating(true);
    setEvalError(null);

    try {
      for (let i = 0; i < variantsToRun.length; i++) {
        if (controller.signal.aborted) break;
        const variant = variantsToRun[i]!;
        setEvalProgress(`Evaluating ${variant.name} (${i + 1}/${variantsToRun.length})...`);

        const res = await fetch('/api/evaluate', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            test_type: testType,
            prompt: variant.prompt.trim(),
            models: selectedModels,
            posts: validPosts.map(p => ({ post_id: p.id, source_text: p.content })),
            threshold_like: thresholdLike,
            threshold_comment: thresholdComment,
            threshold_share: thresholdShare,
            threshold_save: thresholdSave,
            temperature,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let errorMsg = `HTTP ${res.status}`;
          try {
            const parsed = JSON.parse(text);
            errorMsg = parsed.error || errorMsg;
          } catch {
            if (text.length > 0) errorMsg += `: ${text.slice(0, 200)}`;
          }
          throw new Error(`${variant.name}: ${errorMsg}`);
        }

        const data = await res.json();
        const results = data.results ?? {};

        setVariants(prev =>
          prev.map(v => (v.id === variant.id ? { ...v, results } : v))
        );
      }
    } catch (err) {
      if (controller.signal.aborted && evalAbortRef.current !== controller) return;
      if (err instanceof DOMException && err.name === 'AbortError') {
        setEvalError('Request timed out (5 min). Try fewer variants, posts, or models.');
      } else {
        setEvalError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      clearTimeout(timeoutId);
      evalAbortRef.current = null;
      setEvaluating(false);
      setEvalProgress('');
    }
  }, [variants, posts, selectedModels, testType, thresholdLike, thresholdComment, thresholdShare, thresholdSave, temperature, apiKey]);

  // ─── Derived state ─────────────────────────────────────────

  const promptListProps = {
    variants,
    activeId: activeVariantId,
    onSelect: setActiveVariantId,
    onAdd: addVariant,
    onRemove: removeVariant,
    onRename: renameVariant,
  };

  // ─── Model display list: default models + custom ──────────

  const displayModels = [...DEFAULT_MODELS, ...customModels.filter(m => !DEFAULT_MODELS.includes(m))];

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Prompt Tester</h1>
        <p className="text-sm text-muted-foreground">
          Test scorer and comment generator prompts across multiple models.
        </p>
      </div>

      {/* API Key + Test Type row */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>OpenRouter API Key</Label>
          <div className="flex items-center gap-2">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-[320px]"
            />
            <Button variant="ghost" size="sm" onClick={() => setShowKey(s => !s)} className="text-xs text-muted-foreground">
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Test Type</Label>
          <div className="flex rounded-md border border-border bg-muted/30">
            <button
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors rounded-l-md',
                testType === 'scorer' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setTestType('scorer')}
            >
              Scorer
            </button>
            <button
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors rounded-r-md',
                testType === 'commenter' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setTestType('commenter')}
            >
              Comment Generator
            </button>
          </div>
        </div>
      </div>

      {/* Posts Input */}
      <div className="w-full max-w-3xl space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            Posts ({postsForEval.length} with content)
          </h2>
          <Separator className="flex-1" />
        </div>
        {posts.map((post) => (
          <div key={post.id} className="group relative rounded-md border border-border bg-card p-3 space-y-2">
            {posts.length > 1 && (
              <button
                onClick={() => removePost(post.id)}
                className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-xs"
                title="Remove post"
              >
                &times;
              </button>
            )}
            <Input
              value={post.label}
              onChange={e => updatePostLabel(post.id, e.target.value)}
              placeholder="Post label (optional)"
              className="text-sm"
            />
            <textarea
              className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-y"
              value={post.content}
              onChange={e => updatePostContent(post.id, e.target.value)}
              placeholder="Paste post content here..."
            />
            {post.content.trim() && (
              <span className="text-[10px] text-muted-foreground/60">
                {post.content.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addPost}>
          + Add Post
        </Button>
      </div>

      {/* ═══ PROMPT VARIANTS (vertical list + textarea) ═══ */}
      <section className="w-full max-w-3xl space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            Prompt Variants
          </h2>
          <Separator className="flex-1" />
        </div>

        <div className="flex gap-4">
          <PromptList {...promptListProps} />

          <div className="flex-1 min-w-0 space-y-1.5">
            <textarea
              className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-y"
              value={activeVariant.prompt}
              onChange={e => updateVariantPrompt(e.target.value)}
              placeholder={testType === 'scorer'
                ? 'Enter your scorer prompt. The post content will be sent as the user message...'
                : 'Enter your comment generator prompt. The post content will be sent as the user message...'}
            />
          </div>
        </div>
      </section>

      {/* Thresholds (scorer) or Temperature (commenter) */}
      {testType === 'scorer' ? (
        <div className="space-y-1.5">
          <Label>Score Thresholds</Label>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Like', value: thresholdLike, set: setThresholdLike },
              { label: 'Comment', value: thresholdComment, set: setThresholdComment },
              { label: 'Share', value: thresholdShare, set: setThresholdShare },
              { label: 'Save', value: thresholdSave, set: setThresholdSave },
            ].map(t => (
              <div key={t.label} className="space-y-1">
                <span className="text-xs text-muted-foreground">{t.label}</span>
                <Input
                  type="number"
                  min={0} max={1} step={0.05}
                  value={t.value}
                  onChange={e => t.set(parseFloat(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>Temperature: {temperature.toFixed(2)}</Label>
          <input
            type="range"
            min={0} max={1} step={0.05}
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            className="w-64 accent-primary"
          />
        </div>
      )}

      {/* Model Selection */}
      <div className="space-y-2">
        <Label>Models</Label>
        <div className="flex flex-wrap gap-2">
          {displayModels.map(model => {
            const isCustom = customModels.includes(model);
            return isCustom ? (
              <div
                key={model}
                className={cn(
                  'group flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-mono transition-colors',
                  selectedModels.includes(model)
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-amber-500/20 text-amber-400/50 hover:border-amber-500/40 hover:text-amber-400/80'
                )}
              >
                <button onClick={() => toggleModel(model)} className="truncate max-w-[200px]">
                  {shortModelName(model)}
                </button>
                <button
                  onClick={() => removeCustomModel(model)}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 text-amber-400/60 hover:text-destructive transition-opacity"
                  title="Remove custom model"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                key={model}
                onClick={() => toggleModel(model)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs font-mono transition-colors',
                  selectedModels.includes(model)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                {shortModelName(model)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={customModel}
            onChange={e => setCustomModel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomModel()}
            placeholder="Add custom model ID (e.g., google/gemini-2.0-flash)"
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={addCustomModel} disabled={!customModel.trim()}>
            Add
          </Button>
        </div>
        {selectedModels.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
            {customModels.length > 0 && (
              <span className="text-amber-400/60"> ({customModels.filter(m => selectedModels.includes(m)).length} custom)</span>
            )}
          </div>
        )}
      </div>

      {/* Run Button */}
      <div className="flex items-center gap-3">
        <Button onClick={runEval} disabled={!canEval}>
          {evaluating ? evalProgress || 'Evaluating...' : 'Run All Variants'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {variants.filter(v => v.prompt.trim()).length} prompt{variants.filter(v => v.prompt.trim()).length !== 1 ? 's' : ''} &times; {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} &times; {postsForEval.length} post{postsForEval.length !== 1 ? 's' : ''}
        </span>
        {!apiKey.trim() && (
          <span className="text-xs text-amber-400">Enter your OpenRouter API key above</span>
        )}
        {evalError && <p className="text-sm text-destructive">{evalError}</p>}
      </div>

      {/* ═══ RESULTS (pivot toggle + sidebar + table) ═══ */}
      {hasAnyResults && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
              Results
            </h2>
            <Separator className="flex-1" />
            <div className="flex items-center rounded-md border border-border">
              {(['model-first', 'prompt-first'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-3 py-1 text-xs transition-colors',
                    mode === 'model-first' && 'rounded-l-md',
                    mode === 'prompt-first' && 'rounded-r-md',
                    viewMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {mode === 'model-first' ? 'Model first' : 'Prompt first'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {viewMode === 'model-first' ? (
              <PromptList {...promptListProps} />
            ) : (
              <ModelList
                models={selectedModels}
                activeId={activeModelId}
                onSelect={setActiveModelId}
              />
            )}

            <div className="flex-1 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[280px] min-w-[280px]">
                      Post
                    </th>
                    {viewMode === 'model-first'
                      ? selectedModels.map(model => (
                          <th key={model} className="px-3 py-2 text-left font-medium text-muted-foreground min-w-[250px]">
                            <span className="font-mono text-xs">{shortModelName(model)}</span>
                          </th>
                        ))
                      : variants.map(v => (
                          <th key={v.id} className="px-3 py-2 text-left font-medium text-muted-foreground min-w-[250px]">
                            <span className="text-xs">{v.name}</span>
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody>
                  {postsForEval.map(post => (
                    <tr key={post.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 align-top w-[280px] min-w-[280px]">
                        <div className="space-y-1">
                          {post.label && (
                            <span className="text-xs font-medium text-foreground">{post.label}</span>
                          )}
                          <pre className="max-h-[120px] overflow-y-auto rounded bg-muted/30 px-2 py-1 text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground scrollbar-thin">
                            {truncate(post.content, 500)}
                          </pre>
                          <span className="text-[10px] text-muted-foreground/60">
                            {post.content.trim().split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>
                      </td>
                      {viewMode === 'model-first'
                        ? selectedModels.map(model => {
                            const cell = activeVariant.results[model]?.[post.id];
                            const cellKey = `${activeVariantId}:${model}:${post.id}`;
                            return (
                              <ResultCell
                                key={model}
                                cell={cell}
                                cellKey={cellKey}
                                isExpanded={expandedCells.has(cellKey)}
                                onToggle={toggleCell}
                                testType={testType}
                              />
                            );
                          })
                        : variants.map(v => {
                            const cell = v.results[activeModelId]?.[post.id];
                            const cellKey = `${v.id}:${activeModelId}:${post.id}`;
                            return (
                              <ResultCell
                                key={v.id}
                                cell={cell}
                                cellKey={cellKey}
                                isExpanded={expandedCells.has(cellKey)}
                                onToggle={toggleCell}
                                testType={testType}
                              />
                            );
                          })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/20">
                    <td className="px-3 py-2 text-xs font-medium text-muted-foreground">Totals</td>
                    {viewMode === 'model-first'
                      ? selectedModels.map(model => {
                          let totalInput = 0;
                          let totalOutput = 0;
                          let successCount = 0;
                          let totalCost = 0;
                          const pricing = modelPricing[model];
                          for (const post of postsForEval) {
                            const cell = activeVariant.results[model]?.[post.id];
                            if (cell && !cell.error) {
                              const inp = cell.input_tokens ?? 0;
                              const out = cell.output_tokens ?? 0;
                              totalInput += inp;
                              totalOutput += out;
                              successCount++;
                              if (pricing) {
                                totalCost += inp * pricing.prompt + out * pricing.completion;
                              }
                            }
                          }
                          const monthlyVolume = testType === 'scorer' ? 10000 : 3000;
                          const monthlyCost = successCount > 0 ? (totalCost / successCount) * monthlyVolume : 0;
                          return (
                            <td key={model} className="px-3 py-2 text-xs text-muted-foreground">
                              <div className="space-y-0.5">
                                {totalInput + totalOutput > 0 && (
                                  <p>{totalInput}+{totalOutput} = {totalInput + totalOutput} tok</p>
                                )}
                                {monthlyCost > 0 && (
                                  <p className="text-primary/80 font-medium">
                                    ~${monthlyCost < 0.01 ? monthlyCost.toFixed(4) : monthlyCost.toFixed(2)}/mo
                                    <span className="font-normal text-muted-foreground/60"> ({monthlyVolume.toLocaleString()} runs)</span>
                                  </p>
                                )}
                                {totalInput + totalOutput === 0 && !monthlyCost && '-'}
                              </div>
                            </td>
                          );
                        })
                      : variants.map(v => {
                          let totalInput = 0;
                          let totalOutput = 0;
                          let successCount = 0;
                          let totalCost = 0;
                          const pricing = modelPricing[activeModelId];
                          for (const post of postsForEval) {
                            const cell = v.results[activeModelId]?.[post.id];
                            if (cell && !cell.error) {
                              const inp = cell.input_tokens ?? 0;
                              const out = cell.output_tokens ?? 0;
                              totalInput += inp;
                              totalOutput += out;
                              successCount++;
                              if (pricing) {
                                totalCost += inp * pricing.prompt + out * pricing.completion;
                              }
                            }
                          }
                          const monthlyVolume = testType === 'scorer' ? 10000 : 3000;
                          const monthlyCost = successCount > 0 ? (totalCost / successCount) * monthlyVolume : 0;
                          return (
                            <td key={v.id} className="px-3 py-2 text-xs text-muted-foreground">
                              <div className="space-y-0.5">
                                {totalInput + totalOutput > 0 && (
                                  <p>{totalInput}+{totalOutput} = {totalInput + totalOutput} tok</p>
                                )}
                                {monthlyCost > 0 && (
                                  <p className="text-primary/80 font-medium">
                                    ~${monthlyCost < 0.01 ? monthlyCost.toFixed(4) : monthlyCost.toFixed(2)}/mo
                                    <span className="font-normal text-muted-foreground/60"> ({monthlyVolume.toLocaleString()} runs)</span>
                                  </p>
                                )}
                                {totalInput + totalOutput === 0 && !monthlyCost && '-'}
                              </div>
                            </td>
                          );
                        })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
