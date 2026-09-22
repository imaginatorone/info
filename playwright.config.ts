import { defineConfig } from "@playwright/test";

const chrome = { browserName: "chromium" as const, channel: "chrome" };

export default defineConfig({
  expect: { timeout: 12000 },
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...chrome, viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...chrome, viewport: { width: 390, height: 844 }, isMobile: true },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
