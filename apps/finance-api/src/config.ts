import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  POSTHOG_HOST: z.url().default("https://eu.posthog.com"),
  AGGREGATES_DB_CLIENT: z
    .enum(["postgres", "kurrent", "dynamo"])
    .default("postgres"),
  POSTGRES_DB_URL: z.url().optional(),
  KURRENT_DB_URL: z.url().optional(),
});

export const env = Env.parse(process.env);
