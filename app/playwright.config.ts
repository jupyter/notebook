import process from 'process';

import { PlaywrightTestConfig } from '@playwright/test';

import { BrowserName } from './test/utils';

const browserName = (process.env.BROWSER ?? 'chromium') as BrowserName;

const config: PlaywrightTestConfig = {
  projects: [
    {
      name: 'Retro',
      use: {
        viewport: { width: 1600, height: 900 },
        slowMo: 100,
        video: 'on',
        browserName
      },
      outputDir: 'test-results'
    }
  ]
};
export default config;
