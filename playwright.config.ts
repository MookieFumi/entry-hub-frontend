import { defineConfig, devices } from '@playwright/test'

// The API is always simulated in the browser (see e2e/fake-api.ts), so the app runs without a backend.
// `VITE_API_URL` is empty on purpose: requests go to the app's own origin and Playwright intercepts them.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_URL: '', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
})
