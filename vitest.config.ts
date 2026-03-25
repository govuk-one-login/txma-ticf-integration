import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'common/**/*.test.ts'],
    setupFiles: [
      'common/utils/tests/setup/testEnvVars.ts',
      'aws-sdk-client-mock-vitest/extend'
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'common/**/*.ts'],
      exclude: [
        '**/scripts/**',
        '**/interface/**',
        '**/interfaces/**',
        '**/type/**',
        '**/types/**',
        '**/logger.ts',
        '**/tests/**',
        '**/*.config.ts',
        '**/.*',
        'common/utils/tests/mocks/mockLambdaContext.ts'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: -10
      }
    }
  }
})
