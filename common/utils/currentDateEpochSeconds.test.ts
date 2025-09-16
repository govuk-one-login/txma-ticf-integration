import { currentDateEpochSeconds } from './currentDateEpochSeconds'

describe('currentDateEpochSeconds', () => {
  it('should return the current date in epoch seconds', () => {
    const mockDate = new Date('2025-01-01T00:00:00.000Z')
    const expectedEpochSeconds = Math.round(mockDate.getTime() / 1000)

    jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const result = currentDateEpochSeconds()

    expect(result).toBe(expectedEpochSeconds)
    expect(typeof result).toBe('number')
  })

  it('should return different values for different times', () => {
    const mockDate1 = new Date('2025-01-01T00:00:00.000Z')
    const mockDate2 = new Date('2025-01-01T00:00:01.000Z')

    jest.spyOn(Date, 'now').mockReturnValue(mockDate1.getTime())
    const result1 = currentDateEpochSeconds()

    jest.spyOn(Date, 'now').mockReturnValue(mockDate2.getTime())
    const result2 = currentDateEpochSeconds()

    expect(result2).toBe(result1 + 1)
  })
})
