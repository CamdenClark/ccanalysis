import { defineConfig } from 'drizzle-kit';
import { homedir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
  schema: './schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: join(homedir(), '.ccanalysis', 'data.sqlite'),
  },
});
