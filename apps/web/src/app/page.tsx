'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, SignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────

interface ListItem {
  id: string;
  name: string;
}

interface InputItem extends ListItem {
  content: string;
}

interface PromptItem extends ListItem {
  prompt: string;
  results: Record<string, Record<string, CellResult>>;
}

interface ModelItem extends ListItem {
  modelId: string;
}

interface CellResult {
  output: string | null;
  error: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

interface TestConfig {
  id: string;
  name: string;
  inputs: InputItem[];
  prompts: PromptItem[];
  models: ModelItem[];
  temperature: number;
}

// ─── Default Models ──────────────────────────────────────────

const DEFAULT_MODELS: ModelItem[] = [
  { id: 'm1', name: 'gemini-2.0-flash', modelId: 'google/gemini-2.0-flash' },
  { id: 'm2', name: 'deepseek-chat-v3', modelId: 'deepseek/deepseek-chat-v3' },
  { id: 'm3', name: 'llama-3.3-70b-instruct', modelId: 'meta-llama/llama-3.3-70b-instruct' },
  { id: 'm4', name: 'claude-3.5-haiku', modelId: 'anthropic/claude-3.5-haiku' },
  { id: 'm5', name: 'qwen-2.5-72b-instruct', modelId: 'qwen/qwen-2.5-72b-instruct' },
];

function makeDefaultTest(id: string, name: string): TestConfig {
  return {
    id,
    name,
    inputs: [{ id: 'i1', name: 'Input 1', content: '' }],
    prompts: [{ id: 'p1', name: 'Prompt 1', prompt: '', results: {} }],
    models: [...DEFAULT_MODELS],
    temperature: 0.7,
  };
}

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

let nextId = 1;
function genId(prefix: string): string {
  return `${prefix}${Date.now()}-${nextId++}`;
}

// ─── Item List (shared sidebar component) ────────────────────

function ItemList({
  items,
  activeId,
  onSelect,
  onAdd,
  onRemove,
  onRename,
  readOnly = false,
}: {
  items: ListItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  readOnly?: boolean;
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
      onRename?.(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex w-[170px] min-w-[170px] md:w-[200px] md:min-w-[200px] flex-col gap-0.5">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'group flex items-center rounded-md border px-2.5 py-1.5 text-sm cursor-pointer select-none transition-colors',
            item.id === activeId
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
          onClick={() => onSelect(item.id)}
          onDoubleClick={() => {
            if (readOnly) return;
            setEditingId(item.id);
            setEditName(item.name);
          }}
        >
          {editingId === item.id ? (
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
            <span className="flex-1 truncate">{item.name}</span>
          )}
          {!readOnly && items.length > 1 && editingId !== item.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(item.id);
              }}
              className="ml-1 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
            >
              &times;
            </button>
          )}
        </div>
      ))}
      {!readOnly && onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center justify-center rounded-md border border-dashed border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          +
        </button>
      )}
    </div>
  );
}

// ─── Result Cell ─────────────────────────────────────────────

function ResultCell({
  cell,
  cellKey,
  isExpanded,
  onToggle,
}: {
  cell: CellResult | undefined;
  cellKey: string;
  isExpanded: boolean;
  onToggle: (key: string) => void;
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
        <p className="text-xs text-destructive">{cell.error.length > 150 ? cell.error.slice(0, 150) + '...' : cell.error}</p>
      </td>
    );
  }

  return (
    <td className="px-3 py-2 align-top">
      <div className="space-y-1">
        {cell.output && (
          <button
            onClick={() => onToggle(cellKey)}
            className="text-left text-xs leading-relaxed hover:text-foreground transition-colors"
          >
            <span className={cn('block transition-all duration-200 whitespace-pre-wrap', !isExpanded && 'line-clamp-3')}>
              {cell.output}
            </span>
            {cell.output.length > 120 && (
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

// ─── Test Selector Bar ───────────────────────────────────────

function TestSelector({
  tests,
  activeTestId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
}: {
  tests: TestConfig[];
  activeTestId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
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
    <div className="flex items-center gap-1.5 flex-wrap">
      {tests.map((test) => (
        <div
          key={test.id}
          className={cn(
            'group flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm cursor-pointer select-none transition-colors',
            test.id === activeTestId
              ? 'border-primary bg-primary/10 text-foreground font-medium'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
          onClick={() => onSelect(test.id)}
          onDoubleClick={() => {
            setEditingId(test.id);
            setEditName(test.name);
          }}
        >
          {editingId === test.id ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={finish}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finish();
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-24 bg-transparent text-sm outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate max-w-[150px]">{test.name}</span>
          )}
          {tests.length > 1 && editingId !== test.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(test.id);
              }}
              className="ml-0.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
            >
              &times;
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center justify-center rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
      >
        + New Test
      </button>
    </div>
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
  // API key (global, not per-test)
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Tests
  const [tests, setTests] = useState<TestConfig[]>([makeDefaultTest('t1', 'Test 1')]);
  const [activeTestId, setActiveTestId] = useState('t1');
  const nextTestNum = useRef(2);

  // Per-test active selections
  const [activeInputId, setActiveInputId] = useState('i1');
  const [activePromptId, setActivePromptId] = useState('p1');
  const [activeModelId, setActiveModelId] = useState('m1');
  const [newModelId, setNewModelId] = useState('');

  // Counter refs for naming
  const nextInputNum = useRef(2);
  const nextPromptNum = useRef(2);
  const nextModelNum = useRef(DEFAULT_MODELS.length + 1);

  // Results view
  const [viewMode, setViewMode] = useState<'model-first' | 'prompt-first'>('model-first');
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  // Evaluate state
  const [evaluating, setEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState('');
  const [evalError, setEvalError] = useState<string | null>(null);
  const evalAbortRef = useRef<AbortController | null>(null);

  // Model pricing from OpenRouter
  const [modelPricing, setModelPricing] = useState<Record<string, { prompt: number; completion: number }>>({});

  // Current test
  const currentTest = tests.find(t => t.id === activeTestId) ?? tests[0]!;
  const { inputs, prompts, models, temperature } = currentTest;

  // Derived
  const activeInput = inputs.find(i => i.id === activeInputId) ?? inputs[0]!;
  const activePrompt = prompts.find(p => p.id === activePromptId) ?? prompts[0]!;
  const activeModel = models.find(m => m.id === activeModelId) ?? models[0]!;
  const hasAnyResults = prompts.some(p => Object.keys(p.results).length > 0);
  const validInputs = inputs.filter(i => i.content.trim().length > 0);

  // ─── Update current test helper ────────────────────────────

  const updateCurrentTest = useCallback((updater: (test: TestConfig) => TestConfig) => {
    setTests(prev => prev.map(t => t.id === activeTestId ? updater(t) : t));
  }, [activeTestId]);

  // ─── Load from cache on mount ─────────────────────────────

  useEffect(() => {
    const savedKey = cacheLoadStr('apiKey');
    if (savedKey) setApiKey(savedKey);

    const savedTests = cacheLoad<TestConfig[]>('tests');
    if (savedTests && savedTests.length > 0) {
      setTests(savedTests);
      const savedActiveId = cacheLoadStr('activeTestId');
      const activeId = savedActiveId && savedTests.some(t => t.id === savedActiveId) ? savedActiveId : savedTests[0]!.id;
      setActiveTestId(activeId);

      const active = savedTests.find(t => t.id === activeId) ?? savedTests[0]!;
      setActiveInputId(active.inputs[0]?.id ?? 'i1');
      setActivePromptId(active.prompts[0]?.id ?? 'p1');
      setActiveModelId(active.models[0]?.id ?? 'm1');

      // Restore counters
      const maxTestNum = savedTests.reduce((max, t) => {
        const match = t.name.match(/Test (\d+)/);
        return match ? Math.max(max, parseInt(match[1]!, 10)) : max;
      }, 0);
      nextTestNum.current = Math.max(maxTestNum + 1, savedTests.length + 1);

      syncCounters(active);
    }

    // Fetch pricing from OpenRouter
    fetch('https://openrouter.ai/api/v1/models')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.data) return;
        const pricing: Record<string, { prompt: number; completion: number }> = {};
        for (const m of data.data) {
          if (m.id && m.pricing) {
            pricing[m.id] = {
              prompt: parseFloat(m.pricing.prompt ?? '0'),
              completion: parseFloat(m.pricing.completion ?? '0'),
            };
          }
        }
        setModelPricing(pricing);
      })
      .catch(() => {});
  }, []);

  function syncCounters(test: TestConfig) {
    const maxInput = test.inputs.reduce((max, item) => {
      const match = item.name.match(/Input (\d+)/);
      return match ? Math.max(max, parseInt(match[1]!, 10)) : max;
    }, 0);
    nextInputNum.current = Math.max(maxInput + 1, test.inputs.length + 1);

    const maxPrompt = test.prompts.reduce((max, item) => {
      const match = item.name.match(/Prompt (\d+)/);
      return match ? Math.max(max, parseInt(match[1]!, 10)) : max;
    }, 0);
    nextPromptNum.current = Math.max(maxPrompt + 1, test.prompts.length + 1);

    nextModelNum.current = test.models.length + 1;
  }

  // Auto-save (each effect skips its first invocation to avoid overwriting cache with defaults)
  const testsFirstRun = useRef(true);
  useEffect(() => {
    if (testsFirstRun.current) { testsFirstRun.current = false; return; }
    cacheSave('tests', tests);
  }, [tests]);

  const activeTestFirstRun = useRef(true);
  useEffect(() => {
    if (activeTestFirstRun.current) { activeTestFirstRun.current = false; return; }
    cacheSaveStr('activeTestId', activeTestId);
  }, [activeTestId]);

  const apiKeyFirstRun = useRef(true);
  useEffect(() => {
    if (apiKeyFirstRun.current) { apiKeyFirstRun.current = false; return; }
    if (apiKey) cacheSaveStr('apiKey', apiKey);
  }, [apiKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { evalAbortRef.current?.abort(); };
  }, []);

  // ─── Test Management ───────────────────────────────────────

  const addTest = useCallback(() => {
    const num = nextTestNum.current++;
    const test = makeDefaultTest(genId('t'), `Test ${num}`);
    setTests(prev => [...prev, test]);
    setActiveTestId(test.id);
    setActiveInputId(test.inputs[0]!.id);
    setActivePromptId(test.prompts[0]!.id);
    setActiveModelId(test.models[0]!.id);
    syncCounters(test);
  }, []);

  const deleteTest = useCallback((id: string) => {
    if (tests.length <= 1) return;
    const test = tests.find(t => t.id === id);
    if (!confirm(`Delete "${test?.name ?? 'this test'}"? This cannot be undone.`)) return;
    setTests(prev => prev.filter(t => t.id !== id));
    if (activeTestId === id) {
      const remaining = tests.filter(t => t.id !== id);
      const newActive = remaining[0]!;
      setActiveTestId(newActive.id);
      setActiveInputId(newActive.inputs[0]?.id ?? 'i1');
      setActivePromptId(newActive.prompts[0]?.id ?? 'p1');
      setActiveModelId(newActive.models[0]?.id ?? 'm1');
      syncCounters(newActive);
    }
  }, [tests, activeTestId]);

  const renameTest = useCallback((id: string, name: string) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const selectTest = useCallback((id: string) => {
    setActiveTestId(id);
    const test = tests.find(t => t.id === id);
    if (test) {
      setActiveInputId(test.inputs[0]?.id ?? 'i1');
      setActivePromptId(test.prompts[0]?.id ?? 'p1');
      setActiveModelId(test.models[0]?.id ?? 'm1');
      syncCounters(test);
    }
    setExpandedCells(new Set());
  }, [tests]);

  // ─── Input Management ──────────────────────────────────────

  const addInput = useCallback(() => {
    const num = nextInputNum.current++;
    const item: InputItem = { id: genId('i'), name: `Input ${num}`, content: '' };
    updateCurrentTest(t => ({ ...t, inputs: [...t.inputs, item] }));
    setActiveInputId(item.id);
  }, [updateCurrentTest]);

  const removeInput = useCallback((id: string) => {
    if (inputs.length <= 1) return;
    updateCurrentTest(t => ({
      ...t,
      inputs: t.inputs.filter(i => i.id !== id),
    }));
    if (activeInputId === id) {
      setActiveInputId(inputs.find(i => i.id !== id)?.id ?? inputs[0]!.id);
    }
  }, [inputs, activeInputId, updateCurrentTest]);

  const renameInput = useCallback((id: string, name: string) => {
    updateCurrentTest(t => ({ ...t, inputs: t.inputs.map(i => i.id === id ? { ...i, name } : i) }));
  }, [updateCurrentTest]);

  const updateInputContent = useCallback((content: string) => {
    updateCurrentTest(t => ({
      ...t,
      inputs: t.inputs.map(i => i.id === activeInputId ? { ...i, content } : i),
    }));
  }, [activeInputId, updateCurrentTest]);

  // ─── Prompt Management ────────────────────────────────────

  const addPrompt = useCallback(() => {
    const num = nextPromptNum.current++;
    const item: PromptItem = { id: genId('p'), name: `Prompt ${num}`, prompt: '', results: {} };
    updateCurrentTest(t => ({ ...t, prompts: [...t.prompts, item] }));
    setActivePromptId(item.id);
  }, [updateCurrentTest]);

  const removePrompt = useCallback((id: string) => {
    if (prompts.length <= 1) return;
    updateCurrentTest(t => ({ ...t, prompts: t.prompts.filter(p => p.id !== id) }));
    if (activePromptId === id) {
      setActivePromptId(prompts.find(p => p.id !== id)?.id ?? prompts[0]!.id);
    }
  }, [prompts, activePromptId, updateCurrentTest]);

  const renamePrompt = useCallback((id: string, name: string) => {
    updateCurrentTest(t => ({ ...t, prompts: t.prompts.map(p => p.id === id ? { ...p, name } : p) }));
  }, [updateCurrentTest]);

  const updatePromptContent = useCallback((text: string) => {
    updateCurrentTest(t => ({
      ...t,
      prompts: t.prompts.map(p => p.id === activePromptId ? { ...p, prompt: text } : p),
    }));
  }, [activePromptId, updateCurrentTest]);

  // ─── Model Management ─────────────────────────────────────

  const addModel = useCallback(() => {
    const trimmed = newModelId.trim();
    if (!trimmed) return;
    if (models.some(m => m.modelId === trimmed)) {
      setNewModelId('');
      return;
    }
    const num = nextModelNum.current++;
    const parts = trimmed.split('/');
    const displayName = (parts.length > 1 ? parts[1]! : parts[0]!).replace(/:.*$/, '');
    const item: ModelItem = { id: genId('m'), name: displayName, modelId: trimmed };
    updateCurrentTest(t => ({ ...t, models: [...t.models, item] }));
    setActiveModelId(item.id);
    setNewModelId('');
  }, [newModelId, models, updateCurrentTest]);

  const addEmptyModel = useCallback(() => {
    const num = nextModelNum.current++;
    const item: ModelItem = { id: genId('m'), name: `Model ${num}`, modelId: '' };
    updateCurrentTest(t => ({ ...t, models: [...t.models, item] }));
    setActiveModelId(item.id);
  }, [updateCurrentTest]);

  const removeModel = useCallback((id: string) => {
    if (models.length <= 1) return;
    updateCurrentTest(t => ({
      ...t,
      models: t.models.filter(m => m.id !== id),
    }));
    if (activeModelId === id) {
      setActiveModelId(models.find(m => m.id !== id)?.id ?? models[0]!.id);
    }
  }, [models, activeModelId, updateCurrentTest]);

  const renameModel = useCallback((id: string, name: string) => {
    updateCurrentTest(t => ({ ...t, models: t.models.map(m => m.id === id ? { ...m, name } : m) }));
  }, [updateCurrentTest]);


  const setTemperature = useCallback((temp: number) => {
    updateCurrentTest(t => ({ ...t, temperature: temp }));
  }, [updateCurrentTest]);

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

  const promptsToRun = prompts.filter(p => p.prompt.trim().length > 0);
  const canEval = validInputs.length > 0 && models.length > 0 && promptsToRun.length > 0 && !evaluating && apiKey.trim().length > 0;

  const runEval = useCallback(async () => {
    const toRun = prompts.filter(p => p.prompt.trim().length > 0);
    const validIns = inputs.filter(i => i.content.trim().length > 0);
    const modelIds = models.map(m => m.modelId);
    if (toRun.length === 0 || validIns.length === 0 || modelIds.length === 0) return;

    evalAbortRef.current?.abort();
    const controller = new AbortController();
    evalAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 300_000);

    setEvaluating(true);
    setEvalError(null);

    const testId = activeTestId;

    try {
      for (let i = 0; i < toRun.length; i++) {
        if (controller.signal.aborted) break;
        const prompt = toRun[i]!;
        setEvalProgress(`Evaluating ${prompt.name} (${i + 1}/${toRun.length})...`);

        const res = await fetch('/api/evaluate', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            prompt: prompt.prompt.trim(),
            models: modelIds,
            inputs: validIns.map(inp => ({ input_id: inp.id, content: inp.content })),
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
          throw new Error(`${prompt.name}: ${errorMsg}`);
        }

        const data = await res.json();
        const results = data.results ?? {};

        setTests(prev =>
          prev.map(t =>
            t.id === testId
              ? { ...t, prompts: t.prompts.map(p => p.id === prompt.id ? { ...p, results } : p) }
              : t
          )
        );
      }
    } catch (err) {
      if (controller.signal.aborted && evalAbortRef.current !== controller) return;
      if (err instanceof DOMException && err.name === 'AbortError') {
        setEvalError('Request timed out (5 min). Try fewer prompts, inputs, or models.');
      } else {
        setEvalError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      clearTimeout(timeoutId);
      evalAbortRef.current = null;
      setEvaluating(false);
      setEvalProgress('');
    }
  }, [prompts, inputs, models, temperature, apiKey, activeTestId]);

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Prompt Tester</h1>
        <p className="text-sm text-muted-foreground">
          Test prompts across multiple inputs and models.
        </p>
      </div>

      {/* Test Selector */}
      <TestSelector
        tests={tests}
        activeTestId={activeTestId}
        onSelect={selectTest}
        onAdd={addTest}
        onDelete={deleteTest}
        onRename={renameTest}
      />

      {/* API Key + Temperature */}
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
          <Label>Temperature: {temperature.toFixed(2)}</Label>
          <input
            type="range"
            min={0} max={1} step={0.05}
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            className="w-48 accent-primary"
          />
        </div>
      </div>

      {/* ═══ INPUTS ═══ */}
      <section className="w-full max-w-3xl space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            Inputs ({validInputs.length} with content)
          </h2>
          <Separator className="flex-1" />
        </div>

        <div className="flex gap-4">
          <ItemList
            items={inputs}
            activeId={activeInputId}
            onSelect={setActiveInputId}
            onAdd={addInput}
            onRemove={removeInput}
            onRename={renameInput}
          />
          <div className="flex-1 min-w-0">
            <textarea
              className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-y"
              value={activeInput.content}
              onChange={e => updateInputContent(e.target.value)}
              placeholder="Enter input content..."
            />
            {activeInput.content.trim() && (
              <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                {activeInput.content.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ═══ PROMPTS ═══ */}
      <section className="w-full max-w-3xl space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            Prompts
          </h2>
          <Separator className="flex-1" />
        </div>

        <div className="flex gap-4">
          <ItemList
            items={prompts}
            activeId={activePromptId}
            onSelect={setActivePromptId}
            onAdd={addPrompt}
            onRemove={removePrompt}
            onRename={renamePrompt}
          />
          <div className="flex-1 min-w-0">
            <textarea
              className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-y"
              value={activePrompt.prompt}
              onChange={e => updatePromptContent(e.target.value)}
              placeholder="Enter system prompt..."
            />
          </div>
        </div>
      </section>

      {/* ═══ MODELS ═══ */}
      <section className="w-full max-w-3xl space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            Models ({models.length})
          </h2>
          <Separator className="flex-1" />
        </div>

        <div className="flex gap-4">
          <ItemList
            items={models}
            activeId={activeModelId}
            onSelect={setActiveModelId}
            onAdd={addEmptyModel}
            onRemove={removeModel}
            onRename={renameModel}
          />
          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-mono text-foreground">{activeModel.modelId || '(no model ID)'}</span>
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={newModelId}
                onChange={e => setNewModelId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addModel()}
                placeholder="Add model by ID..."
                className="max-w-sm font-mono text-xs"
              />
              <Button variant="outline" size="sm" onClick={addModel} disabled={!newModelId.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Run Button */}
      <div className="flex items-center gap-3">
        <Button onClick={runEval} disabled={!canEval}>
          {evaluating ? evalProgress || 'Evaluating...' : 'Run All Prompts'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {promptsToRun.length} prompt{promptsToRun.length !== 1 ? 's' : ''} &times; {models.length} model{models.length !== 1 ? 's' : ''} &times; {validInputs.length} input{validInputs.length !== 1 ? 's' : ''}
        </span>
        {!apiKey.trim() && (
          <span className="text-xs text-amber-500 dark:text-amber-400">Enter your OpenRouter API key above</span>
        )}
        {evalError && <p className="text-sm text-destructive">{evalError}</p>}
      </div>

      {/* ═══ RESULTS ═══ */}
      {evaluating && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
              Results
            </h2>
            <Separator className="flex-1" />
          </div>
          <div className="flex items-center gap-3 py-8 justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">{evalProgress || 'Evaluating...'}</span>
          </div>
        </section>
      )}

      {!evaluating && hasAnyResults && (
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
              <ItemList
                items={prompts}
                activeId={activePromptId}
                onSelect={setActivePromptId}
                readOnly
              />
            ) : (
              <ItemList
                items={models}
                activeId={activeModelId}
                onSelect={setActiveModelId}
                readOnly
              />
            )}

            <div className="flex-1 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[200px] min-w-[200px]">
                      Input
                    </th>
                    {viewMode === 'model-first'
                      ? models.map(model => (
                          <th key={model.id} className="px-3 py-2 text-left font-medium text-muted-foreground min-w-[250px]">
                            <span className="font-mono text-xs">{model.name}</span>
                          </th>
                        ))
                      : prompts.map(p => (
                          <th key={p.id} className="px-3 py-2 text-left font-medium text-muted-foreground min-w-[250px]">
                            <span className="text-xs">{p.name}</span>
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody>
                  {validInputs.map(input => (
                    <tr key={input.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 align-top w-[200px] min-w-[200px]">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-foreground">{input.name}</span>
                          <pre className="max-h-[120px] overflow-y-auto rounded bg-muted/30 px-2 py-1 text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground">
                            {input.content.length > 500 ? input.content.slice(0, 500) + '...' : input.content}
                          </pre>
                        </div>
                      </td>
                      {viewMode === 'model-first'
                        ? models.map(model => {
                            const cell = activePrompt.results[model.modelId]?.[input.id];
                            const cellKey = `${activePromptId}:${model.id}:${input.id}`;
                            return (
                              <ResultCell
                                key={model.id}
                                cell={cell}
                                cellKey={cellKey}
                                isExpanded={expandedCells.has(cellKey)}
                                onToggle={toggleCell}
                              />
                            );
                          })
                        : prompts.map(p => {
                            const cell = p.results[activeModel.modelId]?.[input.id];
                            const cellKey = `${p.id}:${activeModelId}:${input.id}`;
                            return (
                              <ResultCell
                                key={p.id}
                                cell={cell}
                                cellKey={cellKey}
                                isExpanded={expandedCells.has(cellKey)}
                                onToggle={toggleCell}
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
                      ? models.map(model => {
                          let totalInput = 0;
                          let totalOutput = 0;
                          let totalCost = 0;
                          const pricing = modelPricing[model.modelId];
                          for (const input of validInputs) {
                            const cell = activePrompt.results[model.modelId]?.[input.id];
                            if (cell && !cell.error) {
                              const inp = cell.input_tokens ?? 0;
                              const out = cell.output_tokens ?? 0;
                              totalInput += inp;
                              totalOutput += out;
                              if (pricing) {
                                totalCost += inp * pricing.prompt + out * pricing.completion;
                              }
                            }
                          }
                          return (
                            <td key={model.id} className="px-3 py-2 text-xs text-muted-foreground">
                              <div className="space-y-0.5">
                                {totalInput + totalOutput > 0 && (
                                  <p>{totalInput}+{totalOutput} = {totalInput + totalOutput} tok</p>
                                )}
                                {totalCost > 0 && (
                                  <p className="text-primary/80 font-medium">
                                    ${totalCost < 0.0001 ? totalCost.toFixed(6) : totalCost < 0.01 ? totalCost.toFixed(4) : totalCost.toFixed(2)} total
                                  </p>
                                )}
                                {totalInput + totalOutput === 0 && '-'}
                              </div>
                            </td>
                          );
                        })
                      : prompts.map(p => {
                          let totalInput = 0;
                          let totalOutput = 0;
                          let totalCost = 0;
                          const pricing = modelPricing[activeModel.modelId];
                          for (const input of validInputs) {
                            const cell = p.results[activeModel.modelId]?.[input.id];
                            if (cell && !cell.error) {
                              const inp = cell.input_tokens ?? 0;
                              const out = cell.output_tokens ?? 0;
                              totalInput += inp;
                              totalOutput += out;
                              if (pricing) {
                                totalCost += inp * pricing.prompt + out * pricing.completion;
                              }
                            }
                          }
                          return (
                            <td key={p.id} className="px-3 py-2 text-xs text-muted-foreground">
                              <div className="space-y-0.5">
                                {totalInput + totalOutput > 0 && (
                                  <p>{totalInput}+{totalOutput} = {totalInput + totalOutput} tok</p>
                                )}
                                {totalCost > 0 && (
                                  <p className="text-primary/80 font-medium">
                                    ${totalCost < 0.0001 ? totalCost.toFixed(6) : totalCost < 0.01 ? totalCost.toFixed(4) : totalCost.toFixed(2)} total
                                  </p>
                                )}
                                {totalInput + totalOutput === 0 && '-'}
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
