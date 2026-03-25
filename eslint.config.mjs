import globals from 'globals'
import pluginJs from '@eslint/js'
import tsEslint from 'typescript-eslint'
import tsEslintParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import vitestPlugin from '@vitest/eslint-plugin'

export default [
  { files: ['**/*.{js,ts}'] },
  { languageOptions: { globals: globals.node, parser: tsEslintParser } },
  pluginJs.configs.recommended,
  // ...tsEslint.configs.strictTypeChecked,
  // ...tsEslint.configs.stylisticTypeChecked,
  ...tsEslint.configs.recommended,
  ...tsEslint.configs.stylistic,
  {
    ignores: ['.env', 'coverage', 'dist', 'reports', 'eslint.config.mjs']
  },
  {
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          caughtErrors: 'none'
        }
      ]
    }
  },
  {
    files: ['tests/**/*.ts', 'scripts/**/*.ts', 'src/**/*.test.ts'],
    plugins: { vitest: vitestPlugin },
    languageOptions: {
      globals: vitestPlugin.environments.env.globals
    },
    rules: {
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/prefer-to-have-length': 'warn',
      'vitest/valid-expect': 'error',
      'vitest/no-alias-methods': 'error',
      'no-console': ['off']
    }
  },
  eslintConfigPrettier
]
