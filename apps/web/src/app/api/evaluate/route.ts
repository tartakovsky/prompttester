import { NextResponse } from 'next/server';
import { withPublicBody } from '@/lib/api';
import { EvaluateRequestSchema } from '@prompttester/types';
import { callOpenRouter } from '@/services/openrouter';
import { env } from '@/lib/env';

interface CellResult {
  output: string | null;
  error: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

export const POST = withPublicBody(EvaluateRequestSchema, async (data, req) => {
  const apiKey = req.headers.get('x-api-key') || env().OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key provided' }, { status: 401 });
  }

  const { prompt, models, inputs, temperature } = data;

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
            input_tokens: null,
            output_tokens: null,
          };
        }
      })();

      tasks.push({ model, inputId: input.input_id, promise });
    }
  }

  const settled = await Promise.allSettled(tasks.map(t => t.promise));

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
          input_tokens: null,
          output_tokens: null,
        };
  }

  return NextResponse.json({ results });
});
