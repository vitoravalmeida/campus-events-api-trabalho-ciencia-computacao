import * as dotenv from 'dotenv';
import { z } from 'zod/v4';

export const Config = z.object({
  port: z.coerce.number().int().positive(),
  databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
});
export type Config = z.infer<typeof Config>;

function readFromEnv(name: string, prefix?: string): string | undefined {
  return process.env[`${prefix ?? ''}${name}`];
}

export const getConfig = (prefix?: string): Config => {
  dotenv.config();

  const result = Config.safeParse({
    port: readFromEnv('PORT', prefix),
    databaseUrl: readFromEnv('DATABASE_URL', prefix),
  });

  if (!result.success) {
    console.error('Invalid environment configuration:');

    for (const issue of result.error.issues) {
      console.error(`- ${issue.path.join('.')}: ${issue.message}`);
    }

    process.exit(1);
  }

  return result.data;
};