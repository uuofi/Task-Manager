import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // shadcn/ui components co-locate `cva` variant constants with the
      // component; allow those constant exports without breaking fast refresh.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      // Syncing async query data into local editable state is a valid pattern
      // here; the React-Compiler rule is overly strict for it.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Node-context config files.
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
