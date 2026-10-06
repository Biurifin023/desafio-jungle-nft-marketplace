import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'public/mockServiceWorker.js',
      'src/routeTree.gen.ts',
      'playwright-report',
      'test-results',
      '.lighthouseci',
      'docs',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'axios', message: 'Use o cliente em @/lib/http.' }],
          patterns: [{ group: ['@/mocks/*'], message: 'A UI não pode importar mocks.' }],
        },
      ],
    },
  },
  {
    files: ['src/lib/http.ts', 'src/mocks/**', 'src/main.tsx', 'e2e/**', 'scripts/**'],
    rules: { 'no-restricted-imports': 'off', 'react-hooks/rules-of-hooks': 'off' },
  },
)
