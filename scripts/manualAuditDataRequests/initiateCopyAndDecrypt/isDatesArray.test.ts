import { isDatesArray } from './isDatesArray'

describe('isDatesArray', () => {
  it('should return true if the array is an array of dates', () => {
    expect(isDatesArray(['2020-01-01', '2020-01-02'])).toBe(true)
  })

  it('should return false if the array is not an array of dates', () => {
    expect(isDatesArray(['2020-01-01', '2020-01-02', '2020-01-0'])).toBe(false)
  })

  it('should return false if the array is not an array', () => {
    expect(isDatesArray('2020-01-01')).toBe(false)
  })

  it('should return false if the array is empty', () => {
    expect(isDatesArray([])).toBe(false)
  })

  it('should return false if the array is not an array of strings', () => {
    expect(isDatesArray([2020, 2021])).toBe(false)
  })

  it('should return false if not every value in the array is a string', () => {
    expect(isDatesArray(['2020-01-01', 2021])).toBe(false)
  })

  it('should return false if the array is an array of dates in the wrong format - DD-MM-YYYY', () => {
    expect(isDatesArray(['01-02-2023', '12-11-2023'])).toBe(false)
  })

  it('should return false if the array is an array of dates in the wrong format - YYYY/MM/DD', () => {
    expect(isDatesArray(['2020/01/01', '2020/01/02'])).toBe(false)
  })

  it('should return false if the array is undefined', () => {
    expect(isDatesArray(undefined)).toBe(false)
  })
})
