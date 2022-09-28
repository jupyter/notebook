import baseConfig from '@jupyterlab/galata/lib/playwright-config';

export default {
  ...baseConfig,
  timeout: 240000,
  use: {
    appPath: ''
  },
  retries: 1
};
