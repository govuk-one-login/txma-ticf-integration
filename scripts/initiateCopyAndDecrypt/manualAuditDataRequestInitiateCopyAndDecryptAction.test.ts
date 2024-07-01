import { initiateCopyAndDecryptAction } from './manualAuditDataRequestInitiateCopyAndDecryptAction'
import * as sendManualAuditDataRequestPayloadToInitiateQueueImportHelper from './sendManualAuditDataRequestPayloadToInitiateQueue'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './sendManualAuditDataRequestPayloadToInitiateQueue'

const zendeskId = 'zendeskID123'
const generateInitiateCopyAndDecryptPayloadBasePayload = {
  zendeskId: `MR${zendeskId}`,
  dates: ['2020-01-01'],
  requesterEmail: 'manualquery@example.com',
  requesterName: 'txma',
  recipientEmail: 'manualquery@example.com',
  recipientName: '',
  identifierType: 'event_id',
  sessionIds: [],
  journeyIds: [],
  eventIds: [],
  userIds: [],
  piiTypes: [],
  dataPaths: []
}
const testCaseDatesOnly = [
  { dates: ['2023-01-01'] },
  { dates: ['2023-01-01', '2023-02-01'] }
]

const testCaseDateRangeOnly = [
  {
    dateRange: ['2023/01/01-2023/01/05'],
    individualDates: [
      '2023-01-01',
      '2023-01-02',
      '2023-01-03',
      '2023-01-04',
      '2023-01-05'
    ]
  },
  {
    dateRange: ['2023/01/01-2023/01/05', '2023/02/01-2023/02/05'],
    individualDates: [
      '2023-01-01',
      '2023-01-02',
      '2023-01-03',
      '2023-01-04',
      '2023-01-05',
      '2023-02-01',
      '2023-02-02',
      '2023-02-03',
      '2023-02-04',
      '2023-02-05'
    ]
  }
]

const testCaseDateAndDateRange = [
  {
    date: ['2022-01-01'],
    dateRange: ['2023/01/01-2023/01/05'],
    individualDates: [
      '2022-01-01',
      '2023-01-01',
      '2023-01-02',
      '2023-01-03',
      '2023-01-04',
      '2023-01-05'
    ]
  },
  {
    date: ['2022-01-01'],
    dateRange: ['2023/01/01-2023/01/05', '2023/02/01-2023/02/05'],
    individualDates: [
      '2022-01-01',
      '2023-01-01',
      '2023-01-02',
      '2023-01-03',
      '2023-01-04',
      '2023-01-05',
      '2023-02-01',
      '2023-02-02',
      '2023-02-03',
      '2023-02-04',
      '2023-02-05'
    ]
  },
  {
    date: ['2022-01-01', '2022-02-01'],
    dateRange: ['2023/01/01-2023/01/05'],
    individualDates: [
      '2022-01-01',
      '2022-02-01',
      '2023-01-01',
      '2023-01-02',
      '2023-01-03',
      '2023-01-04',
      '2023-01-05'
    ]
  },
  {
    date: ['2022-01-01', '2022-02-01'],
    dateRange: ['2023/01/01-2023/01/05', '2023/02/01-2023/02/05'],
    individualDates: [
      '2022-01-01',
      '2022-02-01',
      '2023-01-01',
      '2023-01-02',
      '2023-01-03',
      '2023-01-04',
      '2023-01-05',
      '2023-02-01',
      '2023-02-02',
      '2023-02-03',
      '2023-02-04',
      '2023-02-05'
    ]
  }
]

jest.mock('./sendManualAuditDataRequestPayloadToInitiateQueue', () => ({
  sendManualAuditDataRequestPayloadToInitiateQueue: jest.fn()
}))

describe('testing CLI action: initiateCopyAndDecryptAction', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()

    jest.spyOn(
      sendManualAuditDataRequestPayloadToInitiateQueueImportHelper,
      'sendManualAuditDataRequestPayloadToInitiateQueue'
    )
  })

  it.each(testCaseDatesOnly)(
    'Test case $#: providing dates only',
    async ({ dates }) => {
      await initiateCopyAndDecryptAction({
        zendeskId: zendeskId,
        dates: dates
      })

      expect(
        sendManualAuditDataRequestPayloadToInitiateQueue
      ).toHaveBeenCalledWith({
        ...generateInitiateCopyAndDecryptPayloadBasePayload,
        dates: expect.arrayContaining(dates)
      })
    }
  )

  it.each(testCaseDateRangeOnly)(
    'Test case $#: providing dateranges only',
    async (testCaseDateRange) => {
      await initiateCopyAndDecryptAction({
        zendeskId: zendeskId,
        daterange: testCaseDateRange.dateRange
      })

      expect(
        sendManualAuditDataRequestPayloadToInitiateQueue
      ).toHaveBeenCalledWith({
        ...generateInitiateCopyAndDecryptPayloadBasePayload,
        dates: expect.arrayContaining(testCaseDateRange.individualDates)
      })
    }
  )

  it.each(testCaseDateAndDateRange)(
    'Test case $#: providing date and dateranges ',
    async (testCaseDateRange) => {
      await initiateCopyAndDecryptAction({
        zendeskId: zendeskId,
        daterange: testCaseDateRange.dateRange,
        dates: testCaseDateRange.date
      })

      expect(
        sendManualAuditDataRequestPayloadToInitiateQueue
      ).toHaveBeenCalledWith({
        ...generateInitiateCopyAndDecryptPayloadBasePayload,
        dates: expect.arrayContaining(testCaseDateRange.individualDates)
      })
    }
  )

  it('testing date deduplication', async () => {
    const testCaseDateAndDateRange = {
      // note that date and dateRange have overlapping date
      // note that individualDates is deduplicated
      date: ['2023-01-01'],
      dateRange: ['2023/01/01-2023/01/05'],
      individualDates: [
        '2023-01-01',
        '2023-01-02',
        '2023-01-03',
        '2023-01-04',
        '2023-01-05'
      ]
    }

    await initiateCopyAndDecryptAction({
      zendeskId: zendeskId,
      daterange: testCaseDateAndDateRange.dateRange,
      dates: testCaseDateAndDateRange.date
    })

    expect(
      sendManualAuditDataRequestPayloadToInitiateQueue
    ).toHaveBeenCalledWith({
      ...generateInitiateCopyAndDecryptPayloadBasePayload,
      dates: expect.arrayContaining(testCaseDateAndDateRange.individualDates)
    })
  })
})
