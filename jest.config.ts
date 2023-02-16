import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  coveragePathIgnorePatterns: ['/.yarn/', '/dist/'],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/src/utils/tests/setup/testEnvVars.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
  testMatch: ['src/**/*.test.ts'],
  verbose: true
}

export default config
