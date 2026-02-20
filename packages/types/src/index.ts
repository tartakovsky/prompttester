import { z } from "zod";

// --- Domain Schemas ---

export const CellResultSchema = z.object({
  output: z.string().nullable(),
  error: z.string().nullable(),
  input_tokens: z.number().nullable(),
  output_tokens: z.number().nullable(),
});

export const EvaluateRequestSchema = z.object({
  prompt: z.string().min(1),
  models: z.array(z.string().min(1)).min(1),
  inputs: z.array(
    z.object({
      input_id: z.string().min(1),
      content: z.string().min(1),
    })
  ).min(1),
  temperature: z.number().min(0).max(2).default(0.7),
});

export const EvaluateResponseSchema = z.object({
  results: z.record(z.string(), z.record(z.string(), CellResultSchema)),
});

// --- Generic API Schemas ---

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({ data: dataSchema });

export const ApiErrorSchema = z.object({
  error: z.union([z.string(), z.record(z.array(z.string()))]),
});

// --- TypeScript Types ---

export type CellResult = z.infer<typeof CellResultSchema>;
export type EvaluateRequest = z.infer<typeof EvaluateRequestSchema>;
export type EvaluateResponse = z.infer<typeof EvaluateResponseSchema>;
export type ApiResponse<T> = { data: T };
export type ApiError = z.infer<typeof ApiErrorSchema>;
