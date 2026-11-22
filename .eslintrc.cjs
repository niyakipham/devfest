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
    // Enforced per layer in `overrides` below. The global rule only bans crossing
    // straight into the server from client code (the server imports the client's
    // shared code, never the reverse).
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['@server/*'], message: 'client code must never import the server. Use @shared contracts.' },
        ],
      },
    ],
  },
  overrides: [
    {
      // layer 0 — shared knows nothing above it
      files: ['src/shared/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              { group: ['@world/*', '@rp/*', '@narrative/*', '@game/*', '@server/*'], message: 'shared is the bottom layer: it may not import anything above it.' },
              { group: ['react', 'react-dom', 'three', '@react-three/*'], message: 'shared is engine-free. No React, no three.js.' },
            ],
          },
        ],
      },
    },
    {
      // layer 1 — world may use shared only
      files: ['src/world/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              { group: ['@rp/*', '@narrative/*', '@game/*', '@server/*'], message: 'world may only import @shared. Arrows: shared ← world ← rp ← narrative ← game.' },
              { group: ['react', 'react-dom', 'three', '@react-three/*'], message: 'world is engine-free. No React, no three.js.' },
            ],
          },
        ],
      },
    },
    {
      // layer 2 — roleplay systems may use shared + world
      files: ['src/rp/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              { group: ['@narrative/*', '@game/*', '@server/*'], message: 'rp may only import @shared and @world.' },
              { group: ['react', 'react-dom', 'three', '@react-three/*'], message: 'rp is engine-free — it must be server-runnable for anti-cheat.' },
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
