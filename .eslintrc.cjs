/**
 * ESLint — Phase 1.5 debt repayment.
 *
 * Two jobs:
 *  1. catch plain bugs (unused vars, floating promises, sloppy equality)
 *  2. enforce the dependency arrows from the blueprint:
 *       shared ← world ← rp ← narrative ← game/ui
 *       server only imports shared
 *       core does not know React
 *     plus: no hard-coded paths that bypass the aliases.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', 'node_modules', 'src/legacy/**', 'coverage'],
  rules: {
    // ---- correctness ----
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'smart'],
    'no-var': 'error',
    'prefer-const': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

    // ---- architecture: the import arrows must not point backwards ----
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@game/*', '@server/*', '@rp/*', '@narrative/*'],
            message: 'shared/world must not import upwards. Arrows: shared ← world ← rp ← narrative ← game/ui',
          },
          {
            group: ['@game/*'],
            message: 'server may only import @shared. Server is headless.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/shared/**/*.ts', 'src/world/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              { group: ['@game/*', '@server/*', '@rp/*', '@narrative/*'], message: 'shared/world must not import upwards.' },
              { group: ['react', 'react-dom', 'three', '@react-three/*'], message: 'shared/world are engine-free. No React, no three.js.' },
            ],
          },
        ],
      },
    },
    {
      // Server is headless: it may read the engine-free world data/logic (there is one
      // source of truth for tiles and POIs — see PHASE1_REPORT §4.2), but it must never
      // touch the React/three render layer. See docs/adr/ADR-003-core-render-layering.md
      files: ['src/server/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              { group: ['@game/*', '@rp/*', '@narrative/*'], message: 'server must stay headless — only @shared and @world.' },
              { group: ['react', 'react-dom', 'three', '@react-three/*'], message: 'server must stay headless — no React, no three.js.' },
            ],
          },
        ],
      },
    },
    {
      files: ['src/server/index.ts'],
      rules: { 'no-console': 'off' },
    },
    {
      files: ['src/__tests__/**/*.{ts,tsx}', 'scripts/**/*.ts', '*.config.ts'],
      rules: {
        'no-console': 'off',
        'no-restricted-imports': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
}
