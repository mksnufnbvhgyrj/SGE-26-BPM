import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': a11y,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Regras explícitas de acessibilidade solicitadas
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'react/display-name': 'off',
      'react/no-direct-mutation-state': 'off',
      'react/require-render-return': 'off',
      'react/no-render-return-value': 'off',
      'react/no-is-mounted': 'off',
      'react/no-string-refs': 'off',
      'react/jsx-key': 'off',
      'react/no-unknown-property': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      'react/jsx-uses-vars': 'off',
      'react/jsx-uses-react': 'off',
      'react/no-unescaped-entities': 'off',
      'react/no-deprecated': 'off',
      'react/jsx-no-duplicate-props': 'off',
      'react/no-find-dom-node': 'off'
    },
    settings: { react: { version: 'detect' } },
  },
];
