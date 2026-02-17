import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────

interface EvaluateRequest {
  prompt: string;
  models: string[];
  inputs: Array<{ input_id: string; content: string }>;
  temperature: number;
}

interface CellResult {
  output: string | null;
  error: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

// ─── OpenRouter call ─────────────────────────────────────────

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number,
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const usage = data.usage ?? {};

  return {
    content: typeof content === 'string' ? content : JSON.stringify(content),
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
  };
}

// ─── Handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key provided' }, { status: 401 });
  }

  let body: EvaluateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, models, inputs, temperature } = body;

  if (!prompt || !models?.length || !inputs?.length) {
    return NextResponse.json({ error: 'Missing required fields: prompt, models, inputs' }, { status: 400 });
  }

  // Build all (model, input) evaluation promises
  const tasks: Array<{ model: string; inputId: string; promise: Promise<CellResult> }> = [];

  for (const model of models) {
    for (const input of inputs) {
      const promise = (async (): Promise<CellResult> => {
        try {
          const { content, inputTokens, outputTokens } = await callOpenRouter(
            apiKey,
            model,
            prompt,
            input.content,
            temperature ?? 0.7,
          );

          return { output: content, error: null, input_tokens: inputTokens, output_tokens: outputTokens };
        } catch (err) {
          return {
            output: null,
            error: err instanceof Error ? err.message : 'Unknown error',
            input_tokens: null, output_tokens: null,
          };
        }
      })();

      tasks.push({ model, inputId: input.input_id, promise });
    }
  }

  // Wait for all in parallel
  const settled = await Promise.allSettled(tasks.map(t => t.promise));

  // Build results map: model → inputId → CellResult
  const results: Record<string, Record<string, CellResult>> = {};
  for (let i = 0; i < tasks.length; i++) {
    const { model, inputId } = tasks[i]!;
    const outcome = settled[i]!;
    if (!results[model]) results[model] = {};
    results[model]![inputId] = outcome.status === 'fulfilled'
      ? outcome.value
      : {
          output: null,
          error: outcome.reason?.message ?? 'Promise rejected',
          input_tokens: null, output_tokens: null,
        };
  }

  return NextResponse.json({ results });
}
