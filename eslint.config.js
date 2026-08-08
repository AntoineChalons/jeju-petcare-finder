// ESLint flat config. Keeps the rule set narrow on purpose: this is a
// small vanilla-JS app, so the most valuable rules are the ones that
// catch dead imports and obvious bugs (unused vars, undeclared globals,
// duplicate keys) rather than opinionated style rules. Formatting stays
// human-controlled.
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'coverage/**'],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // sql.js exposes an `initSqlJs` global at runtime via a <script>
        // tag in index.html.
        initSqlJs: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
