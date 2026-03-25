import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import jestPlugin from 'eslint-plugin-jest';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

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
      '.pixi/**',
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
  eslintPluginPrettierRecommended,
]);
