import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Ignore patterns replace .eslintignore
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '*.min.js',
      'coverage/',
      'jest.config.js',
      '.vscode/',
      '.idea/',
      '.DS_Store',
      'Thumbs.db',
      'logs/',
      '*.log',
      'tests/fixtures/',
      '__tests__/fixtures/',
      'tmp/',
      'temp/',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Default rule overrides for all files
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': ['warn', { accessibility: 'no-public' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Files included in the main tsconfig.json
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Files NOT included in the main tsconfig.json
    files: ['examples/**/*.ts', 'tests/**/*.ts', '*.ts', '*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      // More lenient rules for tests and examples
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
);
