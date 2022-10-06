import { handler } from './handler'
import { confirmAthenaTable } from '../../sharedServices/athena/confirmAthenaTable'
import { startQueryExecution } from '../../sharedServices/athena/startQueryExecution'
import { testAthenaQueryEvent } from '../../utils/tests/events/initiateAthenaQueryEvent'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { getQueryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { createQuerySql } from '../../sharedServices/athena/createQuerySql'
import { updateQueryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBUpdate'
import { ConfirmAthenaTableResult } from '../../types/athena/confirmAthenaTableResult'

jest.mock('../../sharedServices/athena/confirmAthenaTable', () => ({
  confirmAthenaTable: jest.fn()
}))
jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))
jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getQueryByZendeskId: jest.fn()
}))
jest.mock('../../sharedServices/athena/createQuerySql', () => ({
  createQuerySql: jest.fn()
}))
jest.mock('../../sharedServices/dynamoDB/dynamoDBUpdate', () => ({
  updateQueryByZendeskId: jest.fn()
}))
jest.mock('../../sharedServices/athena/startQueryExecution', () => ({
  startQueryExecution: jest.fn()
}))

const mockConfirmAthenaTable = confirmAthenaTable as jest.Mock<
  Promise<ConfirmAthenaTableResult>
>
const mockUpdateZendeskTicket = updateZendeskTicketById as jest.Mock
const mockGetQueryByZendeskId = getQueryByZendeskId as jest.Mock
const mockCreateQuerySql = createQuerySql as jest.Mock
const mockUpdateQueryByZendeskId = updateQueryByZendeskId as jest.Mock
const mockStartQueryExecution = startQueryExecution as jest.Mock

describe('initiate athena query handler', () => {
  beforeEach(() => {
    mockConfirmAthenaTable.mockReset()
    mockCreateQuerySql.mockReset()
    mockUpdateQueryByZendeskId.mockReset()
  })

  it('confirms whether the athena data source exists and whether query sql has been generated', async () => {
    mockConfirmAthenaTable.mockResolvedValue({
      tableAvailable: true,
      message: 'test message'
    })
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: true,
      sql: 'test sql string',
      idParameters: ['123']
    })
    mockUpdateQueryByZendeskId.mockResolvedValue('test')
    mockStartQueryExecution.mockResolvedValue({
      queryExecuted: true,
      queryExecutionId: 'test id'
    })

    await handler(testAthenaQueryEvent)
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockCreateQuerySql).toHaveBeenCalled()
    expect(mockUpdateQueryByZendeskId).toHaveBeenCalled()
    expect(mockStartQueryExecution).toHaveBeenCalled()
  })

  it('updates zendesk and throws an error if there is no athena data source', async () => {
    mockConfirmAthenaTable.mockResolvedValue({
      tableAvailable: false,
      message: 'test error message'
    })
    await expect(handler(testAthenaQueryEvent)).rejects.toThrow(
      'test error message'
    )
    expect(mockGetQueryByZendeskId).toHaveBeenCalled()
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockUpdateZendeskTicket).toHaveBeenCalled()
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
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: false,
      error: 'sql error message'
    })

    await expect(handler(testAthenaQueryEvent)).rejects.toThrow(
      'sql error message'
    )
    expect(mockGetQueryByZendeskId).toHaveBeenCalled()
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockUpdateZendeskTicket).toHaveBeenCalled()
    expect(mockCreateQuerySql).toHaveBeenCalled()
    expect(mockUpdateQueryByZendeskId).not.toHaveBeenCalled()
  })
})
