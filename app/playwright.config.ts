// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    viewport: { width: 1600, height: 900 },
    slowMo: 100,
    video: 'on'
  },
  outputDir: 'test-results'
};
export default config;
