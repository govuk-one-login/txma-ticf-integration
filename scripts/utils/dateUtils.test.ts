import * as cliUtils from './cliUtils'
import {
  addDay,
  convertDateRangeToIndividualDateArray,
  isDateRange,
  isDateString,
  testDateArgs,
  testDateRangeArgs
} from './dateUtils'

const dateTestCases = [
  { date: '2020-01-01', expected: true },
  { date: '2020-01-011', expected: false },
  { date: '2020-01-af', expected: false },
  { date: '2020-01-1', expected: false },
  { date: '2020-1-01', expected: false },
  { date: '2020-1-1', expected: false },
  { date: '22-1-1', expected: false },
  { date: '', expected: false },
  { date: '-', expected: false },
  { date: '--', expected: false },
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
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  it.each(dateTestCases)('testing date string %p', ({ date, expected }) => {
    expect(isDateString(date)).toBe(expected)
  })

  it.each(daterangeTestCases)(
    'testing daterange string %p',
    ({ date, expected }) => {
      expect(isDateRange(date)).toBe(expected)
    }
  )

  it('testing func testDateArgs', async () => {
    const currentValue = '2023-01-01'
    const previousValue = '2023-01-02'
    jest.spyOn(cliUtils, 'testVariadicArgs')
    testDateArgs(currentValue, previousValue)
    expect(cliUtils.testVariadicArgs).toHaveBeenCalledWith(
      currentValue,
      previousValue,
      isDateString
    )
  })

  it('testing func testDateArgs', async () => {
    const currentValue = '2023/01/01-2023/02/01'
    const previousValue = '2024/01/01-2024/02/01'
    jest.spyOn(cliUtils, 'testVariadicArgs')
    testDateRangeArgs(currentValue, previousValue)
    expect(cliUtils.testVariadicArgs).toHaveBeenCalledWith(
      currentValue,
      previousValue,
      isDateRange
    )
  })

  it('testing convertDateRangeToIndividualDateArray', async () => {
    const daterange = '2023/01/01-2023/02/01'
    const expected = [
      '2023-01-01',
      '2023-01-02',
      '2023-01-03',
      '2023-01-04',
      '2023-01-05',
      '2023-01-06',
      '2023-01-07',
      '2023-01-08',
      '2023-01-09',
      '2023-01-10',
      '2023-01-11',
      '2023-01-12',
      '2023-01-13',
      '2023-01-14',
      '2023-01-15',
      '2023-01-16',
      '2023-01-17',
      '2023-01-18',
      '2023-01-19',
      '2023-01-20',
      '2023-01-21',
      '2023-01-22',
      '2023-01-23',
      '2023-01-24',
      '2023-01-25',
      '2023-01-26',
      '2023-01-27',
      '2023-01-28',
      '2023-01-29',
      '2023-01-30',
      '2023-01-31',
      '2023-02-01'
    ]
    const generatedDateArray = convertDateRangeToIndividualDateArray([
      daterange
    ])
    expect(generatedDateArray).toEqual(expect.arrayContaining(expected))
  })

  it('testing addDay', async () => {
    const startingDate = new Date('2023-01-01')
    const nextDay = new Date('2023-01-02')
    expect(addDay(startingDate).valueOf()).toBe(nextDay.valueOf())
  })

  it('date range validation', () => {
    expect(
      convertDateRangeToIndividualDateArray(['2024/01/01-2024/01/05'])
    ).toEqual(
      expect.arrayContaining([
        '2024-01-01',
        '2024-01-02',
        '2024-01-03',
        '2024-01-04',
        '2024-01-05'
      ])
    )

    expect(() =>
      convertDateRangeToIndividualDateArray(['2024/01/01-2022/01/05'])
    ).toThrow('Start date of range must be before end date')
    expect(() =>
      convertDateRangeToIndividualDateArray(['2024/01/06-2024/01/05'])
    ).toThrow('Start date of range must be before end date')
    expect(() =>
      convertDateRangeToIndividualDateArray(['2024/01/05-2024/01/05'])
    ).toThrow('Start date of range must be before end date')
  })
})
