import globals from 'globals'
import pluginJs from '@eslint/js'
import tsEslint from 'typescript-eslint'
import tsEslintParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginJest from 'eslint-plugin-jest'

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
  eslintConfigPrettier
]
