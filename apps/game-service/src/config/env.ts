import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3002),
  SERVICE_NAME: z.string().default("game-service"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Must match auth-service exactly to decode JWTs securely
  JWT_ACCESS_SECRET: z.string().min(32),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
