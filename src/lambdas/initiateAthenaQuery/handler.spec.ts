import { handler } from './handler'
import { confirmAthenaTable } from '../../sharedServices/athena/confirmAthenaTable'
import { ConfirmAthenaTableResult } from '../../types/confirmAthenaTableResult'
import { testAthenaQueryEvent } from '../../utils/tests/events/initiateAthenaQueryEvent'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import {
  dataPathsTestDataRequest,
  noIdTestDataRequest,
  testDataRequest
} from '../../utils/tests/testDataRequest'
import { createQuerySql } from '../../sharedServices/athena/createQuerySql'
jest.mock('../../sharedServices/athena/confirmAthenaTable', () => ({
  confirmAthenaTable: jest.fn()
}))
jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))
jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getDatabaseEntryByZendeskId: jest.fn()
}))
jest.mock('../../sharedServices/athena/createQuerySql', () => ({
  createQuerySql: jest.fn()
}))

const mockConfirmAthenaTable = confirmAthenaTable as jest.Mock<
  Promise<ConfirmAthenaTableResult>
>
const mockUpdateZendeskTicket = updateZendeskTicketById as jest.Mock
const mockGetDatabaseEntryByZendeskId = getDatabaseEntryByZendeskId as jest.Mock
const mockCreateQuerySql = createQuerySql as jest.Mock

describe('initiate athena query handler', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockGetDatabaseEntryByZendeskId.mockResolvedValue({
      requestInfo: testDataRequest
    })
  })

  it('confirms whether the athena data source exists and whether query sql has been generated', async () => {
    mockConfirmAthenaTable.mockResolvedValue({
      tableAvailable: true,
      message: 'test message'
    })
    mockGetDatabaseEntryByZendeskId.mockResolvedValue({
      requestInfo: dataPathsTestDataRequest
    })
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: true,
      sql: 'test sql string',
      idParameters: ['123']
    })

    await handler(testAthenaQueryEvent)
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockCreateQuerySql).toHaveBeenCalledWith(dataPathsTestDataRequest)
  })

  it('updates zendesk and throws an error if there is no athena data source', async () => {
    mockConfirmAthenaTable.mockResolvedValue({
      tableAvailable: false,
      message: 'test error message'
    })
    const testId = testAthenaQueryEvent.Records[0].body
    await expect(handler(testAthenaQueryEvent)).rejects.toThrow(
      'test error message'
    )
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      testId,
      'test error message',
      'closed'
    )
  })

  it('throws an error if there is no data in the SQS Event', async () => {
    expect(handler({ Records: [] })).rejects.toThrow(
      'No data in Athena Query event'
    )
    expect(mockConfirmAthenaTable).not.toHaveBeenCalled()
  })

  it('updates zendesk and throws an error if no query sql is generated', async () => {
    mockConfirmAthenaTable.mockResolvedValue({
      tableAvailable: true,
      message: 'test message'
    })
    mockGetDatabaseEntryByZendeskId.mockResolvedValue({
      requestInfo: noIdTestDataRequest
    })
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: false,
      error: 'sql error message'
    })

    const testId = testAthenaQueryEvent.Records[0].body

    await expect(handler(testAthenaQueryEvent)).rejects.toThrow(
      'sql error message'
    )

    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(testId)
    expect(mockCreateQuerySql).toHaveBeenCalledWith(noIdTestDataRequest)
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      testId,
      'sql error message',
      'closed'
    )
  })
})
