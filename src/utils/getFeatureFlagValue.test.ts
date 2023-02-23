import { getFeatureFlagValue } from './getFeatureFlagValue'

describe('getFeatureFlagValue', () => {
  it.each`
    environmentVariableValue | expectedResult
    ${'true'}                | ${true}
    ${'TRUE'}                | ${true}
    ${'True'}                | ${true}
    ${'false'}               | ${false}
    ${'something'}           | ${false}
  `(
    'should retrieve the correct boolean value of $expectedResult when the feature flag environment variable is set to $environmentVariableValue',
    ({ environmentVariableValue, expectedResult }) => {
      process.env.FEATURE_DECRYPT_DATA = environmentVariableValue
      expect(getFeatureFlagValue('DECRYPT_DATA')).toEqual(expectedResult)
    }
  )

  it('should return false if the required environment variable for the feature flag is not set', () => {
    delete process.env.FEATURE_DECRYPT_DATA
    expect(getFeatureFlagValue('DECRYPT_DATA')).toEqual(false)
  })
})
