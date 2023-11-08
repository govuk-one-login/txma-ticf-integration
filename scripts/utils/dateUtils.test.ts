import { isDateRange, isDateString } from './dateUtils'

const dateTestCases = [
  { date: '2020-01-01', expected: true },
  { date: '2020-01-011', expected: false },
  { date: '2020-01-af', expected: false },
  { date: '2020-01-1', expected: false },
  { date: '2020-1-01', expected: false },
  { date: '2020-1-1', expected: false },
  { date: '22-1-1', expected: false },
  { date: '', expected: false },
  { date: '2020/01/01', expected: false },
  { date: '2020/01/1', expected: false },
  { date: '2020/1/01', expected: false },
  { date: '2020/1/1', expected: false },
  { date: '200020/1/1', expected: false },
  { date: '2022/11111/1', expected: false },
  { date: '22/1/111111', expected: false }
]

const daterangeTestCases = [
  { date: '2020/01/01-2020/01/09', expected: true },
  { date: '2020/01/01-2020/01/af', expected: false },
  { date: '2020/01/01-2020/01/099', expected: false },
  { date: '2020/01/01-2020/019/09', expected: false },
  { date: '2020/01/01-20209/01/09', expected: false },
  { date: '2020/01/019-2020/01/09', expected: false },
  { date: '2020/019/01-2020/01/09', expected: false },
  { date: '20209/01/01-2020/01/09', expected: false },
  { date: '2020/01/019-2020/01/099', expected: false },
  { date: '2020/019/01-2020/019/09', expected: false },
  { date: '20209/01/01-20209/01/09', expected: false },
  { date: '2020/01/1-2020/01/09', expected: false },
  { date: '2020/1/01-2020/01/09', expected: false },
  { date: '2020/1/1-2020/01/09', expected: false },
  { date: '2020/01/01-2020/01/9', expected: false },
  { date: '2020/01/01-2020/1/09', expected: false },
  { date: '2020/01/01-2020/1/9', expected: false },
  { date: '2020/01/01-2020/01-09', expected: false },
  { date: '2020/01/01-2020-01/09', expected: false },
  { date: '2020/01/01-2020-01-09', expected: false },
  { date: '2020/01-01-2020/01/09', expected: false },
  { date: '2020-01/01-2020/01/09', expected: false },
  { date: '2020-01-01-2020/01/09', expected: false }
]

describe('testing date utility code', () => {
  it.each(dateTestCases)('testing date string %p', ({ date, expected }) => {
    expect(isDateString(date)).toBe(expected)
  })

  it.each(daterangeTestCases)(
    'testing daterange string %p',
    ({ date, expected }) => {
      expect(isDateRange(date)).toBe(expected)
    }
  )
})
