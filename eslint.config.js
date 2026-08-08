const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');

module.exports = tseslint.config(
  { ignores: ['node_modules/**', '.expo/**', 'coverage/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.jest } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { files: ['babel.config.js', 'jest.setup.js', 'metro.config.js', 'tailwind.config.js', 'eslint.config.js'], languageOptions: { globals: { ...globals.node, ...globals.jest } }, rules: { '@typescript-eslint/no-require-imports': 'off' } },
);
