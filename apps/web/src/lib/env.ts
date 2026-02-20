import { z } from "zod";

const EnvSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
});

type Env = z.infer<typeof EnvSchema>;

let _env: Env | undefined;

export function env(): Env {
  if (!_env) {
    _env = EnvSchema.parse(process.env);
  }
  return _env;
}
