import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  coveragePathIgnorePatterns: [
    '/dist/',
    '/src/utils/tests/mocks/mockLambdaContext.ts'
  ],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/common/utils/tests/setup/testEnvVars.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/common/**/*.test.ts'],
  verbose: true
}

export default config
