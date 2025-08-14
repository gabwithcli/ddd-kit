import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  POSTHOG_HOST: z.string().url().default("https://eu.posthog.com"),
});

export const env = Env.parse(process.env);
