import { EnvironmentVar } from '../types/environmentVar'
import { FeatureFlagEnvironmentVariable } from '../types/featureFlagEnvironmentVariable'

export const generateRandomNumberString = (max = 100) => {
  return Math.floor(Math.random() * max).toString()
}

export const generateCurrentDateWithOffset = (offset: number): string => {
  const today = new Date()
  today.setDate(today.getDate() + offset)

  return today.toISOString().split('T')[0]
}

export const getEnv = (name: EnvironmentVar['name']) => {
  const env = process.env[name]

  if (env === undefined || env === null)
    throw Error(`Missing environment variable: ${name}`)

  return env
}

export const getFeatureFlagValue = (
  name: FeatureFlagEnvironmentVariable['name']
): boolean => {
  const environmentVariableName = `FEATURE_${name}`
  const env = process.env[environmentVariableName]

  return !!env && env.toLowerCase() === 'true'
}

export const pause = (delay: number): Promise<unknown> => {
  return new Promise((r) => setTimeout(r, delay))
}

export const currentDateEpochSeconds = (): number => {
  return Math.round(Date.now() / 1000)
}
