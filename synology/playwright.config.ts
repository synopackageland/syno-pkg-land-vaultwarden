import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  outputDir: process.env.VW_E2E_OUTPUT_DIR || './.e2e/results',
  reporter: [['list']],
  use: {ignoreHTTPSErrors: false, trace: 'retain-on-failure', screenshot: 'only-on-failure'},
});
