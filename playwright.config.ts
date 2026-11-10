import { defineConfig } from '@playwright/test';

// P2-10: browser smoke tests for the public part of the app (e2e/*.spec.ts).
// The app is built and served locally with the PUBLIC Supabase URL and publishable key
// (the same values every visitor's browser receives); no secrets.
const SUPABASE_URL = 'https://pfwxbsucgjlnimvxbpyk.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_R3bb3reMeXTkdizB16ae-w_iRqtyOvd';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    // Local sandbox: a pre-installed Chromium (set PW_CHROMIUM_PATH); CI installs its own.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/login',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { VITE_SUPABASE_URL: SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY },
  },
});
