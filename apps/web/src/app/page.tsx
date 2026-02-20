'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, SignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { cacheLoad, cacheSave, cacheLoadStr, cacheSaveStr } from '@/lib/cache';
import {
  type InputItem,
  type PromptItem,
  type ModelItem,
  type TestConfig,
  type ResultSnapshot,
  accentStyles,
  genId,
  makeDefaultTest,
} from '@/types';
import { ItemList } from '@/components/item-list';
import { ResultCellContent } from '@/components/result-cell';
import { CopyButton } from '@/components/copy-button';
import { TestSelector } from '@/components/test-selector';

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
  // ─── Initialize state from localStorage synchronously ───
  const [initialState] = useState(() => {
    const savedTests = cacheLoad<TestConfig[]>('tests');
    const hasSaved = savedTests && savedTests.length > 0;

    if (hasSaved) {
      for (const test of savedTests) {
        for (const m of test.models) {
          if (m.enabled === undefined) m.enabled = true;
        }
      }
    }

    const tests = hasSaved ? savedTests : [makeDefaultTest('t1', 'Test 1')];
    const savedActiveId = cacheLoadStr('activeTestId');
    const activeTestId = hasSaved && savedActiveId && savedTests.some(t => t.id === savedActiveId)
      ? savedActiveId
      : tests[0]!.id;

    const activeTest = tests.find(t => t.id === activeTestId) ?? tests[0]!;
    const snapshot = cacheLoad<ResultSnapshot>(`snapshot:${activeTestId}`);

    return {
      apiKey: cacheLoadStr('apiKey') ?? '',
      tests,
      activeTestId,
      activeInputId: activeTest.inputs[0]?.id ?? 'i1',
      activePromptId: activeTest.prompts[0]?.id ?? 'p1',
      activeModelId: activeTest.models[0]?.id ?? 'm1',
      snapshot,
      activeTest,
    };
  });

  const [apiKey, setApiKey] = useState(initialState.apiKey);
  const [showKey, setShowKey] = useState(false);

  const [tests, setTests] = useState<TestConfig[]>(initialState.tests);
  const [activeTestId, setActiveTestId] = useState(initialState.activeTestId);
  const nextTestNum = useRef(2);

  const [activeInputId, setActiveInputId] = useState(initialState.activeInputId);
  const [activePromptId, setActivePromptId] = useState(initialState.activePromptId);
  const [activeModelId, setActiveModelId] = useState(initialState.activeModelId);
  const [newModelId, setNewModelId] = useState('');

  const nextInputNum = useRef(2);
  const nextPromptNum = useRef(2);
  const nextModelNum = useRef(7);

  const [viewMode, setViewMode] = useState<'model-first' | 'prompt-first'>('model-first');
  const [resultsUnfolded, setResultsUnfolded] = useState(false);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  const [evaluating, setEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState('');
  const [evalError, setEvalError] = useState<string | null>(null);
  const evalAbortRef = useRef<AbortController | null>(null);

  const [modelPricing, setModelPricing] = useState<Record<string, { prompt: number; completion: number }>>({});
  const [resultSnapshot, setResultSnapshot] = useState<ResultSnapshot | null>(initialState.snapshot);

  const currentTest = tests.find(t => t.id === activeTestId) ?? tests[0]!;
  const { inputs, prompts, models, temperature } = currentTest;

  const activeInput = inputs.find(i => i.id === activeInputId) ?? inputs[0]!;
  const activePrompt = prompts.find(p => p.id === activePromptId) ?? prompts[0]!;
  const activeModel = models.find(m => m.id === activeModelId) ?? models[0]!;
  const hasAnyResults = resultSnapshot !== null && resultSnapshot.prompts.some(p => Object.keys(p.results).length > 0);
  const enabledModels = models.filter(m => m.enabled !== false);
  const inputsWithContent = inputs.filter(i => i.content.trim().length > 0);

  const updateCurrentTest = useCallback((updater: (test: TestConfig) => TestConfig) => {
    setTests(prev => prev.map(t => t.id === activeTestId ? updater(t) : t));
  }, [activeTestId]);

  // ─── Sync counters from initial state ────────────────────

  const cacheLoaded = useRef(true); // Already loaded via lazy initializers

  useEffect(() => {
    const maxTestNum = tests.reduce((max, t) => {
      const match = t.name.match(/Test (\d+)/);
      return match ? Math.max(max, parseInt(match[1]!, 10)) : max;
    }, 0);
    nextTestNum.current = Math.max(maxTestNum + 1, tests.length + 1);
    syncCounters(currentTest);

    void fetch('https://openrouter.ai/api/v1/models')
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
      .catch(() => { /* pricing fetch failed — non-critical */ });
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

  // ─── Auto-save ────────────────────────────────────────────

  useEffect(() => {
    if (!cacheLoaded.current) return;
    cacheSave('tests', tests);
  }, [tests]);

  useEffect(() => {
    if (!cacheLoaded.current) return;
    cacheSaveStr('activeTestId', activeTestId);
  }, [activeTestId]);

  useEffect(() => {
    if (!cacheLoaded.current) return;
    cacheSaveStr('apiKey', apiKey);
  }, [apiKey]);

  const snapshotTestIdRef = useRef(activeTestId);
  snapshotTestIdRef.current = activeTestId;

  useEffect(() => {
    if (resultSnapshot) cacheSave(`snapshot:${snapshotTestIdRef.current}`, resultSnapshot);
  }, [resultSnapshot]);

  useEffect(() => {
    return () => { evalAbortRef.current?.abort(); };
  }, []);

  // ─── Test Management ──────────────────────────────────────

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

      const savedSnapshot = cacheLoad<ResultSnapshot>(`snapshot:${id}`);
      setResultSnapshot(savedSnapshot);
    }
    setExpandedCells(new Set());
  }, [tests]);

  // ─── Input Management ─────────────────────────────────────

  const addInput = useCallback(() => {
    const num = nextInputNum.current++;
    const item: InputItem = { id: genId('i'), name: `Input ${num}`, content: '' };
    updateCurrentTest(t => ({ ...t, inputs: [...t.inputs, item] }));
    setActiveInputId(item.id);
  }, [updateCurrentTest]);

  const removeInput = useCallback((id: string) => {
    if (inputs.length <= 1) return;
    updateCurrentTest(t => ({ ...t, inputs: t.inputs.filter(i => i.id !== id) }));
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
    nextModelNum.current++;
    const parts = trimmed.split('/');
    const displayName = (parts.length > 1 ? parts[1]! : parts[0]!).replace(/:.*$/, '');
    const item: ModelItem = { id: genId('m'), name: displayName, modelId: trimmed, enabled: true };
    updateCurrentTest(t => ({ ...t, models: [...t.models, item] }));
    setActiveModelId(item.id);
    setNewModelId('');
  }, [newModelId, models, updateCurrentTest]);

  const toggleModel = useCallback((id: string) => {
    updateCurrentTest(t => ({
      ...t,
      models: t.models.map(m => m.id === id ? { ...m, enabled: m.enabled === false ? true : false } : m),
    }));
  }, [updateCurrentTest]);

  const setTemperature = useCallback((temp: number) => {
    updateCurrentTest(t => ({ ...t, temperature: temp }));
  }, [updateCurrentTest]);

  const toggleCell = useCallback((cellKey: string) => {
    setExpandedCells(prev => {
      const next = new Set(prev);
      if (next.has(cellKey)) next.delete(cellKey);
      else next.add(cellKey);
      return next;
    });
  }, []);

  // ─── Run Evaluation ───────────────────────────────────────

  const promptsWithContent = prompts.filter(p => p.prompt.trim().length > 0);
  const hasContent = inputsWithContent.length > 0 || promptsWithContent.length > 0;
  const canEval = hasContent && enabledModels.length > 0 && prompts.length > 0 && inputs.length > 0 && !evaluating && apiKey.trim().length > 0;

  const runEval = useCallback(async () => {
    const toRun = prompts;
    const validIns = inputs;
    const activeModels = models.filter(m => m.enabled !== false);
    const modelIds = activeModels.map(m => m.modelId);
    const anyContent = toRun.some(p => p.prompt.trim().length > 0) || validIns.some(i => i.content.trim().length > 0);
    if (!anyContent || modelIds.length === 0) return;

    evalAbortRef.current?.abort();
    const controller = new AbortController();
    evalAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 300_000);

    setEvaluating(true);
    setEvalError(null);

    const testId = activeTestId;
    const snapshotInputs = validIns.map(i => ({ ...i }));
    const snapshotModels = activeModels.map(m => ({ ...m }));
    const snapshotPrompts: PromptItem[] = toRun.map(p => ({ ...p, results: {} }));

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

        const sp = snapshotPrompts.find(p => p.id === prompt.id);
        if (sp) sp.results = results;
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

      setResultSnapshot({
        inputs: snapshotInputs,
        prompts: snapshotPrompts,
        models: snapshotModels,
      });
    }
  }, [prompts, inputs, models, temperature, apiKey, activeTestId]);

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <TestSelector
        tests={tests}
        activeTestId={activeTestId}
        onSelect={selectTest}
        onAdd={addTest}
        onDelete={deleteTest}
        onRename={renameTest}
      />

      {/* Settings Bar */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-6 py-4 px-1">
        <div className="flex items-center gap-2 w-full sm:flex-1 sm:max-w-md">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-fit">
            API Key
          </div>
          <div className="relative flex-1">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-or-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-14 h-9 font-mono text-sm"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:flex-1 sm:max-w-xs">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-fit">
            Temp: {temperature.toFixed(2)}
          </div>
          <input
            type="range"
            value={temperature}
            min={0}
            max={1}
            step={0.01}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            className="flex-1 min-w-[100px] accent-primary"
          />
        </div>
      </div>

      {/* Inputs */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden max-w-4xl">
        <div className="px-4 py-3 border-b bg-muted">
          <h2 className={cn('text-sm font-medium uppercase tracking-wider', accentStyles.teal.title)}>
            Inputs ({inputsWithContent.length} with content)
          </h2>
        </div>
        <div className="flex flex-col md:flex-row" style={{ height: '280px' }}>
          <div className="flex-shrink-0 bg-secondary overflow-y-auto border-b md:border-b-0 md:border-r border-border max-h-24 md:max-h-none p-2">
            <ItemList
              items={inputs}
              activeId={activeInputId}
              onSelect={setActiveInputId}
              onAdd={addInput}
              onRemove={removeInput}
              onRename={renameInput}
              accent="teal"
            />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <textarea
              className="flex-1 resize-none border-0 rounded-none p-4 font-mono text-sm bg-transparent outline-none focus:ring-0"
              value={activeInput.content}
              onChange={e => updateInputContent(e.target.value)}
              placeholder="Enter input content here..."
            />
            {activeInput.content.trim() && (
              <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{activeInput.content.trim().split(/\s+/).filter(Boolean).length} words</span>
                <CopyButton value={activeInput.content} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prompts */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden max-w-4xl">
        <div className="px-4 py-3 border-b bg-muted">
          <h2 className={cn('text-sm font-medium uppercase tracking-wider', accentStyles.blue.title)}>
            Prompts
          </h2>
        </div>
        <div className="flex flex-col md:flex-row" style={{ height: '280px' }}>
          <div className="flex-shrink-0 bg-secondary overflow-y-auto border-b md:border-b-0 md:border-r border-border max-h-24 md:max-h-none p-2">
            <ItemList
              items={prompts}
              activeId={activePromptId}
              onSelect={setActivePromptId}
              onAdd={addPrompt}
              onRemove={removePrompt}
              onRename={renamePrompt}
              accent="blue"
            />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <textarea
              className="flex-1 resize-none border-0 rounded-none p-4 font-mono text-sm bg-transparent outline-none focus:ring-0"
              value={activePrompt.prompt}
              onChange={e => updatePromptContent(e.target.value)}
              placeholder="Enter system prompt here..."
            />
            {activePrompt.prompt.trim() && (
              <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{activePrompt.prompt.trim().split(/\s+/).filter(Boolean).length} words</span>
                <CopyButton value={activePrompt.prompt} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Models */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden h-full flex flex-col max-w-4xl">
        <div className="px-4 py-3 border-b bg-muted">
          <h2 className={cn('text-sm font-medium uppercase tracking-wider', accentStyles.violet.title)}>
            Models ({enabledModels.length} of {models.length} enabled)
          </h2>
        </div>
        <div className="flex flex-col" style={{ height: '300px' }}>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <span
                  className={cn(
                    'text-sm font-mono truncate mr-4',
                    model.enabled !== false ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {model.name}
                </span>
                <button
                  role="switch"
                  aria-checked={model.enabled !== false}
                  onClick={() => toggleModel(model.id)}
                  className={cn(
                    'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
                    model.enabled !== false ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                      model.enabled !== false ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="p-3 border-t bg-secondary">
            <div className="flex gap-2">
              <Input
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                placeholder="Add model by ID..."
                className="h-8 text-sm font-mono"
                onKeyDown={(e) => { if (e.key === 'Enter') addModel(); }}
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-3"
                onClick={addModel}
                disabled={!newModelId.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4 py-4">
        <Button
          onClick={() => void runEval()}
          disabled={!canEval}
          className="gap-2"
        >
          {evaluating ? evalProgress || 'Evaluating...' : 'Run All Prompts'}
        </Button>
        <span className="text-sm text-muted-foreground">
          {prompts.length} prompts &times; {enabledModels.length} models &times; {inputs.length} inputs ={' '}
          {prompts.length * enabledModels.length * inputs.length} runs
        </span>
        {!apiKey.trim() && (
          <span className="text-xs text-amber-500 dark:text-amber-400">Enter your OpenRouter API key above</span>
        )}
        {evalError && <p className="text-sm text-destructive">{evalError}</p>}
      </div>

      {/* Results */}
      {evaluating && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="flex items-center gap-3 justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">{evalProgress || 'Evaluating...'}</span>
          </div>
        </div>
      )}

      {!evaluating && hasAnyResults && resultSnapshot && (() => {
        const snap = resultSnapshot;
        const snapInputs = snap.inputs;
        const snapPrompts = snap.prompts;
        const snapModels = snap.models;

        const snapActivePrompt = snapPrompts.find(p => p.id === activePromptId) ?? snapPrompts[0]!;
        const snapActiveModel = snapModels.find(m => m.id === activeModelId) ?? snapModels[0]!;

        const isModelFirst = viewMode === 'model-first';
        const cols = isModelFirst ? snapModels : snapPrompts;
        const selector = isModelFirst ? snapPrompts : snapModels;
        const selectedFilterId = isModelFirst ? snapActivePrompt.id : snapActiveModel.id;
        const setSelectedFilterId = isModelFirst ? setActivePromptId : setActiveModelId;

        function getTotals(colItem: ModelItem | PromptItem) {
          let tIn = 0, tOut = 0, tCost = 0;
          const mId = isModelFirst ? (colItem as ModelItem).modelId : snapActiveModel.modelId;
          const pItem = isModelFirst ? snapActivePrompt : (colItem as PromptItem);
          const pricing = modelPricing[mId];
          for (const inp of snapInputs) {
            const cell = pItem.results[mId]?.[inp.id];
            if (cell && !cell.error) {
              const inTok = cell.input_tokens ?? 0, outTok = cell.output_tokens ?? 0;
              tIn += inTok; tOut += outTok;
              if (pricing) tCost += inTok * pricing.prompt + outTok * pricing.completion;
            }
          }
          return { tIn, tOut, tCost };
        }

        return (
        <div className="space-y-4 border-t pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Results
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setResultsUnfolded(u => !u)}
                className="text-xs text-primary hover:underline font-medium"
              >
                {resultsUnfolded ? 'Fold' : 'Unfold'}
              </button>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button
                  variant={isModelFirst ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0 h-8 px-3"
                  onClick={() => setViewMode('model-first')}
                >
                  Model first
                </Button>
                <Button
                  variant={!isModelFirst ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0 h-8 px-3"
                  onClick={() => setViewMode('prompt-first')}
                >
                  Prompt first
                </Button>
              </div>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2">
            {selector.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedFilterId(item.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap',
                  selectedFilterId === item.id
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="border-collapse" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th
                    className="text-left p-3 text-xs font-medium text-muted-foreground uppercase border-b border-border bg-background sticky left-0 z-10 border-r"
                    style={{ width: '250px', maxWidth: '250px' }}
                  >
                    Input
                  </th>
                  {cols.map((col) => (
                    <th
                      key={col.id}
                      className={cn(
                        'text-left p-3 border-b border-border text-xs font-mono font-semibold uppercase',
                        isModelFirst ? accentStyles.violet.title : accentStyles.blue.title
                      )}
                      style={{ minWidth: '420px' }}
                    >
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapInputs.map((input) => (
                  <tr key={input.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 align-top border-r border-border bg-background sticky left-0 z-10" style={{ maxWidth: '250px' }}>
                      <div className={cn('text-sm font-semibold truncate', accentStyles.teal.title)}>{input.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                        {input.content}
                      </div>
                    </td>
                    {cols.map((colItem) => {
                      const mId = isModelFirst ? (colItem as ModelItem).modelId : snapActiveModel.modelId;
                      const pItem = isModelFirst ? snapActivePrompt : (colItem as PromptItem);
                      const cell = pItem.results[mId]?.[input.id];
                      const cKey = `${pItem.id}:${colItem.id}:${input.id}`;

                      return (
                        <td key={colItem.id} className="p-1.5 align-top">
                          <ResultCellContent
                            cell={cell}
                            cellKey={cKey}
                            isExpanded={expandedCells.has(cKey)}
                            onToggle={toggleCell}
                            unfolded={resultsUnfolded}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="p-3 text-xs font-medium text-muted-foreground sticky left-0 bg-background border-r border-border" style={{ maxWidth: '250px' }}>
                    Totals
                  </td>
                  {cols.map(colItem => {
                    const { tIn, tOut, tCost } = getTotals(colItem);
                    return (
                      <td key={colItem.id} className="p-3 border-t border-border/50">
                        <div className="space-y-0.5 text-xs text-muted-foreground font-mono">
                          {tIn + tOut > 0 && <p>{tIn}+{tOut} = {tIn + tOut} tok</p>}
                          {tCost > 0 && (() => {
                            const cost1k = tCost * 1000;
                            return (
                              <p className="text-primary/80 font-medium">
                                ${cost1k < 0.01 ? cost1k.toFixed(4) : cost1k.toFixed(2)}/1K runs
                              </p>
                            );
                          })()}
                          {tIn + tOut === 0 && <span>-</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
