import { isDatesArray } from './isDatesArray'

describe('isDatesArray', () => {
  it('should return true if the array is an array of dates', () => {
    const testArray = ['2020-01-01', '2020-01-02']
    expect(isDatesArray(testArray)).toBe(true)
  })

  it('should return false if the array is not an array of dates', () => {
    const testArray = ['2020-01-01', '2020-01-02', '2020-01-0']
    expect(isDatesArray(testArray)).toBe(false)
  })

  it('should return false if the array is not an array', () => {
    const testArray = '2020-01-01'
    expect(isDatesArray(testArray)).toBe(false)
  })

  it('should return false if the array is empty', () => {
    const testArray: unknown[] = []
    expect(isDatesArray(testArray)).toBe(false)
  })

  it('should return false if the array is not an array of strings', () => {
    const testArray = [2020, 2021]
    expect(isDatesArray(testArray)).toBe(false)
  })

  it('should return false if not every value in the array is a string', () => {
    const testArray = ['2020-01-01', 2021]
    expect(isDatesArray(testArray)).toBe(false)
  })

  it('should return false if the array is an array of dates in the wrong format - DD-MM-YYYY', () => {
    const testArray = ['01-02-2023', '12-11-2023']
    expect(isDatesArray(testArray)).toBe(false)
  })

  it('should return false if the array is an array of dates in the wrong format - YYYY/MM/DD', () => {
    const testArray = ['2020/01/01', '2020/01/02']
    expect(isDatesArray(testArray)).toBe(false)
  })

  it('should return false if the array is undefined', () => {
    const testArray = undefined
    expect(isDatesArray(testArray)).toBe(false)
  })
})
