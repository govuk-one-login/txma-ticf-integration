import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/e2e-tests/**/*.spec.ts'],
    globalSetup: ['tests/shared-test-code/setup/setup.ts'],
    testTimeout: 120000,
    reporters: [
      'verbose',
      [
        'junit',
        {
          suiteName: 'TxMA data retrieval end to end tests',
          outputFile: 'tests/reports/results/e2e-results.xml',
          includeConsoleOutput: true
        }
      ]
    ]
  }
})
