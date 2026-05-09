import { defineConfig } from '@playwright/test';
import * as fs from 'fs';

const authStateFile = 'e2e/.auth-state.json';
const storageState = fs.existsSync(authStateFile) ? authStateFile : undefined;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'https://mandarindb.com',
    headless: true,
    screenshot: 'only-on-failure',
    storageState,
  },
  timeout: 30000,
});
