/* Playwright settings for the system test: a phone-sized Chromium window pointed at the local test server. */

const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests/system",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:4173",
    viewport: { width: 375, height: 812 },
    browserName: "chromium",
  },
  webServer: {
    command: "node tests/system/serve.js",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
});
