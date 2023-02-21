import { FeatureFlagEnvironmentVariable } from '../types/featureFlagEnvironmentVariable'

export const getFeatureFlagValue = (
  name: FeatureFlagEnvironmentVariable['name']
): boolean => {
  const environmentVariableName = `FEATURE_${name}`
  const env = process.env[environmentVariableName]

  return !!env && env.toLowerCase() === 'true'
}
