import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  testPathIgnorePatterns: ['/src/'],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/.integration.test.env'],
  verbose: true,
  setupFilesAfterEnv: ['jest-allure/dist/setup'],
  testRunner: 'jest-jasmine2',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'TxMA PII Data Tests',
        outputDirectory: './junit-results',
        ancestorSeparator: ',',
        includeConsoleOutput: true
      }
    ]
  ]
}

export default config
