import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  coveragePathIgnorePatterns: ['/.yarn/', '/dist/'],
  globals: {
    AWS_REGION: 'eu-west-2',
    STACK_NAME: 'txma-ticf-integration',
    ZENDESK_ADMIN_EMAIL: 'txma-team2-ticf-admin-dev@example.com',
    ZENDESK_AGENT_EMAIL: 'txma-team2-ticf-approver-dev@example.com',
    ZENDESK_END_USER_EMAIL: 'txma-team2-ticf-analyst-dev@example.com',
    ZENDESK_END_USER_NAME: 'Txma-team2-ticf-analyst-dev'
  },
  preset: 'ts-jest',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'TxMA data retrieval end to end tests',
        outputDirectory: '<rootDir>/../reports/results',
        ancestorSeparator: ',',
        includeConsoleOutput: true
      }
    ]
  ],
  setupFiles: ['<rootDir>/../shared-test-code/setup/setup.ts'],
  testMatch: ['<rootDir>/**/*.spec.ts'],
  testTimeout: 120000,
  verbose: true
}

export default config
