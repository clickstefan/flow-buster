module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Allow console.log for development
    'no-undef': 'off', // TypeScript handles this
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '*.config.js',
    '*.config.ts',
    'jest.setup.js'
  ]
};