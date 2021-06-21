module.exports = {
  plugins: ['simple-import-sort'],
  extends: ['standard-with-typescript', 'eslint-config-prettier'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'sort-imports': 'off',
    'import/order': 'off',
    'simple-import-sort/imports': 'error',
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/indent': 'off',
  },
}
