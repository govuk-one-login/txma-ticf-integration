import type { JestConfigWithTsJest } from 'ts-jest'

const baseCoverage = [
  // scan all files
  '<rootDir>/**/*.ts',
  '!**/scripts/**',
  // types can be ignored
  '!**/interface/**',
  '!**/interfaces/**',
  '!**/type/**',
  '!**/types/**',
  '!**/logger.ts',
  '!**/tests/**',
  '!**/*.config.ts',
  // ignore dotfiles
  '!**/.*'
]

const config: JestConfigWithTsJest = {
  collectCoverageFrom: baseCoverage,
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/src/utils/tests/mocks/mockLambdaContext.ts'
  ],
  moduleDirectories: ['node_modules', '<rootDir>'],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/common/utils/tests/setup/testEnvVars.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/common/**/*.test.ts'],
  verbose: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10
    },
    '**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10
    }
  }
}

export default config
