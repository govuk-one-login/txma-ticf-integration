import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  testPathIgnorePatterns: ['/src/'],
  preset: 'ts-jest',
  verbose: true,
  setupFilesAfterEnv: ['jest-allure/dist/setup'],
  testRunner: 'jest-jasmine2',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'TxMA PII Data Tests',
        outputDirectory: './jest-junit-results',
        ancestorSeparator: ',',
        includeConsoleOutput: true
      }
    ]
  ]
}

export default config
