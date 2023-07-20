import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  coveragePathIgnorePatterns: [
    '/.yarn/',
    '/dist/',
    '/src/utils/tests/mocks/mockLambdaContext.ts'
  ],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/src/utils/tests/setup/testEnvVars.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/scripts/**/*.test.ts'],
  verbose: true
}

export default config
