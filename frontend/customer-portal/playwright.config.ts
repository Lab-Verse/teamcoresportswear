import { defineConfig } from "@playwright/test";
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3013";
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL))
  throw Error("Browser regression tests require a loopback review site");
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [["list"]],
  use: {
    baseURL,
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  outputDir: "test-results",
});
