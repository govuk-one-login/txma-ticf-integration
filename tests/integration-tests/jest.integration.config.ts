import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  coveragePathIgnorePatterns: ['/.yarn/', '/dist/'],
  globals: {
    AWS_REGION: 'eu-west-2',
    STACK_NAME: 'txma-ticf-integration',
    ZENDESK_ADMIN_EMAIL: 'txma-team2-ticf-admin-dev@test.gov.uk',
    ZENDESK_AGENT_EMAIL: 'txma-team2-ticf-approver-dev@test.gov.uk',
    ZENDESK_END_USER_EMAIL: 'txma-team2-ticf-analyst-dev@test.gov.uk',
    ZENDESK_END_USER_NAME: 'Txma-team2-ticf-analyst-dev',
    ZENDESK_RECIPIENT_NAME: 'Test User'
  },
  preset: 'ts-jest',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'TxMA data retrieval integration tests',
        outputDirectory: '<rootDir>/../reports/allure-results',
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
