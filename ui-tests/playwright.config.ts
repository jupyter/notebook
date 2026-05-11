import baseConfig from '@jupyterlab/galata/lib/playwright-config';

const blobOptions = process.env.BLOB_FILENAME
  ? { fileName: process.env.BLOB_FILENAME }
  : {};

module.exports = {
  ...baseConfig,
  tag: process.env.PLAYWRIGHT_TEST_TAG,
  reporter: process.env.CI
    ? [
        ['blob', blobOptions],
        ['json', { outputFile: 'test-results/report.json' }],
      ]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    appPath: '',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  retries: 1,
  webServer: [
    {
      command: 'jlpm start',
      port: 8888,
      timeout: 120 * 1000,
      reuseExistingServer: true,
      stdout: 'pipe',
    },
  ],
};
