import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────

interface EvaluateRequest {
  test_type: 'scorer' | 'commenter';
  prompt: string;
  models: string[];
  posts: Array<{ post_id: string; source_text: string }>;
  threshold_like: number;
  threshold_comment: number;
  threshold_share: number;
  threshold_save: number;
  temperature: number;
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

// ─── JSON Schemas for OpenRouter ─────────────────────────────

const SCORER_SCHEMA = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'ScoredPostLLMResult',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        reasoning: { type: 'string' },
        post_recap: { type: 'string' },
      },
      required: ['score', 'reasoning', 'post_recap'],
      additionalProperties: false,
    },
  },
};

const COMMENT_SCHEMA = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'CommentLLMResult',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        comment: { type: 'string' },
      },
      required: ['comment'],
      additionalProperties: false,
    },
  },
};

// ─── OpenRouter call ─────────────────────────────────────────

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number,
  maxTokens: number,
  responseFormat: typeof SCORER_SCHEMA | typeof COMMENT_SCHEMA,
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
      max_tokens: maxTokens,
      response_format: responseFormat,
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

// ─── Parse LLM response ─────────────────────────────────────

function parseJson(raw: string): Record<string, unknown> | null {
  // Try direct parse
  try { return JSON.parse(raw); } catch { /* continue */ }

  // Strip code fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]!); } catch { /* continue */ }
  }

  // Extract first JSON object
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* continue */ }
  }

  return null;
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

  const { test_type, prompt, models, posts, threshold_like, threshold_comment, threshold_share, threshold_save, temperature } = body;

  if (!prompt || !models?.length || !posts?.length) {
    return NextResponse.json({ error: 'Missing required fields: prompt, models, posts' }, { status: 400 });
  }

  // Build all (model, post) evaluation promises
  const tasks: Array<{ model: string; postId: string; promise: Promise<CellResult> }> = [];

  for (const model of models) {
    for (const post of posts) {
      const promise = (async (): Promise<CellResult> => {
        try {
          const isScorer = test_type === 'scorer';
          const { content, inputTokens, outputTokens } = await callOpenRouter(
            apiKey,
            model,
            prompt,
            post.source_text,
            isScorer ? 0.0 : (temperature ?? 0.7),
            isScorer ? 1024 : 256,
            isScorer ? SCORER_SCHEMA : COMMENT_SCHEMA,
          );

          const parsed = parseJson(content);

          if (isScorer) {
            const score = Math.max(0, Math.min(1, Number(parsed?.score ?? 0)));
            const reasoning = String(parsed?.reasoning ?? '');
            const post_recap = String(parsed?.post_recap ?? '');
            const actions: string[] = [];
            if (score >= (threshold_like ?? 0.5)) actions.push('LIKE');
            if (score >= (threshold_comment ?? 0.7)) actions.push('COMMENT');
            if (score >= (threshold_share ?? 0.9)) actions.push('SHARE');
            if (score >= (threshold_save ?? 0.8)) actions.push('SAVE');

            return { score, reasoning, post_recap, actions, comment: null, error: null, input_tokens: inputTokens, output_tokens: outputTokens };
          } else {
            const comment = String(parsed?.comment ?? content).trim();
            return { score: null, reasoning: null, post_recap: null, actions: null, comment, error: null, input_tokens: inputTokens, output_tokens: outputTokens };
          }
        } catch (err) {
          return {
            score: null, reasoning: null, post_recap: null, actions: null, comment: null,
            error: err instanceof Error ? err.message : 'Unknown error',
            input_tokens: null, output_tokens: null,
          };
        }
      })();

      tasks.push({ model, postId: post.post_id, promise });
    }
  }

  // Wait for all in parallel
  const settled = await Promise.allSettled(tasks.map(t => t.promise));

  // Build results map: model → postId → CellResult
  const results: Record<string, Record<string, CellResult>> = {};
  for (let i = 0; i < tasks.length; i++) {
    const { model, postId } = tasks[i]!;
    const outcome = settled[i]!;
    if (!results[model]) results[model] = {};
    results[model]![postId] = outcome.status === 'fulfilled'
      ? outcome.value
      : {
          score: null, reasoning: null, post_recap: null, actions: null, comment: null,
          error: outcome.reason?.message ?? 'Promise rejected',
          input_tokens: null, output_tokens: null,
        };
  }

  return NextResponse.json({ results });
}
