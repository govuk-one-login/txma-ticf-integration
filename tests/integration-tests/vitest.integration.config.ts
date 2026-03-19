import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration-tests/**/*.spec.ts'],
    globalSetup: ['tests/shared-test-code/setup/setup.ts'],
    testTimeout: 120000,
    reporters: [
      'verbose',
      [
        'junit',
        {
          suiteName: 'TxMA data retrieval integration tests',
          outputFile: 'tests/reports/results/integration-results.xml',
          includeConsoleOutput: true
        }
      ]
    ]
  }
})
