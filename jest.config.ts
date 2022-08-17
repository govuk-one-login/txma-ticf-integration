import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  preset: 'ts-jest',
  verbose: true
}

export default config
