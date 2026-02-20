import { z } from "zod";

const EnvSchema = z.object({});

type Env = z.infer<typeof EnvSchema>;
let _env: Env | undefined;

export function env(): Env {
  if (!_env) {
    _env = EnvSchema.parse(process.env);
  }
  return _env;
}
