import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load the gitignored test credentials from `.env.test` (if present).
config({ path: resolve(process.cwd(), '.env.test') });

export default defineConfig({
  test: {
    // Only run the integration tests in the `test/` directory.
    include: ['test/**/*.test.ts'],
    // Sandbox API calls can be slow; give each test a generous timeout.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Run test files in parallel but keep tests within a file sequential.
    fileParallelism: true,
    // Fail fast is off so a single sandbox hiccup doesn't hide other results.
    bail: 0,
    // Report skipped tests (e.g. when credentials are missing).
    passWithNoTests: false,
  },
});
