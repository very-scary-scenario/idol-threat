/* globals module */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'indent': ['error', 2],
    'no-trailing-spaces': 'error',
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'spaced-comment': 'error',
  },
}
