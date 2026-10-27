import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync, mkdirSync } from 'fs';
import os from 'os';
import path from 'path';

const python = process.env.NEAT_NOTEBOOK_PYTHON ?? 'python';
const sandbox = mkdtempSync(path.join(os.tmpdir(), 'neat-notebook-ui-'));
const hosts = ['notebook', 'lab'];
const browsers = ['chromium', 'firefox'] as const;
const variants = hosts.flatMap((host) =>
  browsers.map((browser) => ({ host, browser }))
);

export default defineConfig({
  testDir: './ui-tests',
  retries: 0,
  workers: 4,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/report.json' }],
    ['html', { open: 'never' }],
  ],
  use: {
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: variants.map(({ host, browser }, index) => ({
    name: `${host}-${browser}`,
    use: {
      ...devices[browser === 'chromium' ? 'Desktop Chrome' : 'Desktop Firefox'],
      baseURL: `http://127.0.0.1:${8910 + index}`,
    },
  })),
  webServer: variants.map((variant, index) => {
    const root = path.join(sandbox, String(index));
    const notebooks = path.join(root, 'notebooks');
    mkdirSync(notebooks, { recursive: true });
    const port = 8910 + index;
    return {
      command: `${JSON.stringify(
        python
      )} -m jupyterlab --config=${JSON.stringify(
        path.join(__dirname, 'ui-tests/jupyter_server_config.py')
      )} --ServerApp.port=${port} --ServerApp.port_retries=0`,
      cwd: root,
      url: `http://127.0.0.1:${port}/api/status`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: 'pipe' as const,
      env: {
        JUPYTER_CONFIG_DIR: path.join(root, 'config'),
        JUPYTER_DATA_DIR: path.join(root, 'data'),
        JUPYTER_RUNTIME_DIR: path.join(root, 'runtime'),
        JUPYTERLAB_GALATA_ROOT_DIR: notebooks,
      },
    };
  }),
});
