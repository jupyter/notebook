import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import jestPlugin from 'eslint-plugin-jest';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';
import jupyterPlugin from '@jupyter/eslint-plugin';
import * as jsoncParser from 'jsonc-eslint-parser';

export default defineConfig([
  {
    ignores: [
      'node_modules/**',
      '**/build/**',
      '**/lib/**',
      '**/node_modules/**',
      '**/mock_packages/**',
      '**/static/**',
      '**/typings/**',
      '**/schemas/**',
      '**/themes/**',
      'coverage/**',
      '**/*.map.js',
      '**/*.bundle.js',
      'app/index.template.js',
      '.idea/**',
      '.history/**',
      '.vscode/**',
      '.venv/**',
      'docs/**',
      '**/*.js',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  reactPlugin.configs.flat.recommended,
  jestPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      jest: jestPlugin,
      react: reactPlugin,
      jupyter: jupyterPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2015,
        ...globals.commonjs,
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: 'tsconfig.eslint.json',
      },
    },
    rules: {
      'jupyter/command-described-by': 'error',
      'jupyter/command-id-convention': 'error',
      'jupyter/no-schema-enum': 'error',
      'jupyter/plugin-activation-args': 'error',
      'jupyter/plugin-description': 'error',
      'jupyter/plugin-id-convention': 'error',
      'jupyter/prefer-lazy-imports': [
        'error',
        {
          // The plugin defaults, plus the notebook packages that are always
          // loaded at startup.
          allowedPackages: [
            '@jupyterlab/*',
            '@lumino/*',
            '!@lumino/datagrid',
            '@jupyter/ydoc',
            '@jupyter/react-components',
            '@jupyter/web-components',
            '@codemirror/language',
            '@codemirror/state',
            '@codemirror/view',
            '@lezer/common',
            '@lezer/highlight',
            '@microsoft/fast-element',
            '@microsoft/fast-foundation',
            'react',
            'react-dom',
            'yjs',
            '@jupyter-notebook/*',
          ],
        },
      ],
      'jupyter/token-format': 'error',
      'jupyter/no-translation-concatenation': 'error',
      'jupyter/no-dynamic-translation': 'error',
      'jupyter/incorrect-translator-usage': 'error',
      'jupyter/no-untranslated-string': 'error',
      'jupyter/no-pageconfig-base-url': 'error',
      'jupyter/require-signal-cleanup': 'error',
      'jupyter/require-signal-this-arg': 'error',
      'jupyter/prefer-signal-this-arg': 'error',
      'jupyter/require-disposable-ownership': 'warn',
      'jupyter/require-disposable-transfer': 'warn',
      'jupyter/require-soft-assertions-before-snapshots': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'jest/no-done-callback': 'off',
      curly: ['error', 'all'],
      eqeqeq: 'error',
      'prefer-arrow-callback': 'error',
    },
  },
  {
    files: ['ui-tests/test/**/*.ts', 'ui-tests/test/**/*.tsx'],
    rules: {
      'jupyter/galata-prefer-context-menu-helper': 'error',
      'jupyter/galata-prefer-menu-helper': 'error',
    },
  },
  {
    files: ['**/schema/*.json'],
    languageOptions: { parser: jsoncParser },
    plugins: { jupyter: jupyterPlugin },
    rules: {
      'jupyter/no-schema-enum': 'error',
    },
  },
  eslintPluginPrettierRecommended,
]);
