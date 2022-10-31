import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  testPathIgnorePatterns: ['/src/'],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/.integration.test.env'],
  verbose: true,
  reporters: ['default', 'jest-junit']
}

export default config
