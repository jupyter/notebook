import baseConfig from '@jupyterlab/galata/lib/playwright-config';

module.exports = {
  ...baseConfig,
  use: {
    appPath: ''
  },
  retries: 1
};
