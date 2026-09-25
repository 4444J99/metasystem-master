import tsParser from '@typescript-eslint/parser';

// A syntax/correctness baseline; strict TypeScript checks run independently.
// Do not treat this configuration as a formatting or complete security audit.
export default [{
  files: ['**/*.{ts,tsx,js,mjs}'],
  ignores: ['**/node_modules/**', '**/dist/**'],
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  },
  rules: {
    'constructor-super': 'error',
    'for-direction': 'error',
    'getter-return': 'error',
    'no-async-promise-executor': 'error',
    'no-class-assign': 'error',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': ['error', 'except-parens'],
    'no-constant-binary-expression': 'error',
    'no-debugger': 'error',
    'no-dupe-args': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-func-assign': 'error',
    'no-import-assign': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-self-assign': 'error',
    'no-setter-return': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
  },
}];
