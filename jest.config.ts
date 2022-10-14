import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  testPathIgnorePatterns: ['/integration-tests/'],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/src/utils/tests/setup/testEnvVars.ts'],
  verbose: true,
  setupFilesAfterEnv: ['jest-extended/all']
}

export default config
