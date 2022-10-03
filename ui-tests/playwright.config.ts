import baseConfig from '@jupyterlab/galata/lib/playwright-config';

module.exports = {
  ...baseConfig,
  use: {
    appPath: '',
    video: 'retain-on-failure'
  },
  retries: 1
};
