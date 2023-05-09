import { handler } from './handler'
import { initiateQuery } from './initiateQuery'
import { confirmAthenaTable } from './confirmAthenaTable'
import { startQueryExecution } from './startQueryExecution'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { createQuerySql } from './createQuerySql'
import { updateQueryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBUpdate'
import { ConfirmAthenaTableResult } from '../../types/athena/confirmAthenaTableResult'
import {
  dataPathsTestDataRequest,
  noIdTestDataRequest,
  testDataRequest
} from '../../utils/tests/testDataRequest'
import { mockLambdaContext } from '../../utils/tests/mocks/mockLambdaContext'
import { logger } from '../../sharedServices/logger'
import { ZENDESK_TICKET_ID } from '../../utils/tests/testConstants'

jest.mock('./confirmAthenaTable', () => ({
  confirmAthenaTable: jest.fn()
}))
jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))
jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getDatabaseEntryByZendeskId: jest.fn()
}))
jest.mock('./createQuerySql', () => ({
  createQuerySql: jest.fn()
}))
jest.mock('../../sharedServices/dynamoDB/dynamoDBUpdate', () => ({
  updateQueryByZendeskId: jest.fn()
}))
jest.mock('./startQueryExecution', () => ({
  startQueryExecution: jest.fn()
}))
jest.mock('../../sharedServices/sns/publishToSNS', () => ({
  publishToSNS: jest.fn()
}))

const mockConfirmAthenaTable = confirmAthenaTable as jest.Mock<
  Promise<ConfirmAthenaTableResult>
>
const mockUpdateZendeskTicket = updateZendeskTicketById as jest.Mock
const mockGetDatabaseEntryByZendeskId = getDatabaseEntryByZendeskId as jest.Mock
const mockCreateQuerySql = createQuerySql as jest.Mock
const mockUpdateQueryByZendeskId = updateQueryByZendeskId as jest.Mock
const mockStartQueryExecution = startQueryExecution as jest.Mock

describe('initiateQuery', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockGetDatabaseEntryByZendeskId.mockResolvedValue({
      requestInfo: testDataRequest
    })
    jest.spyOn(logger, 'info')
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
      queryParameters: ['123']
    })
    mockUpdateQueryByZendeskId.mockResolvedValue('test db return object')
    mockStartQueryExecution.mockResolvedValue({
      queryExecuted: true,
      queryExecutionId: 'test_id'
    })

    await initiateQuery(ZENDESK_TICKET_ID)
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockCreateQuerySql).toHaveBeenCalledWith(dataPathsTestDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['123']
    })
    expect(mockUpdateQueryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'athenaQueryId',
      'test_id'
    )
  })

  it('throws an error if there is no data in the SQS Event', async () => {
    expect(handler({ Records: [] }, mockLambdaContext)).rejects.toThrow(
      'No data in Athena Query event'
    )
    expect(mockConfirmAthenaTable).not.toHaveBeenCalled()
  })

  it('updates zendesk and throws an error if there is no athena data source', async () => {
    mockConfirmAthenaTable.mockResolvedValue({
      tableAvailable: false,
      message: 'test error message'
    })
    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrow(
      'test error message'
    )
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'test error message',
      'closed'
    )
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

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrow(
      'sql error message'
    )
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockCreateQuerySql).toHaveBeenCalledWith(noIdTestDataRequest)
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'sql error message',
      'closed'
    )
    expect(mockUpdateQueryByZendeskId).not.toHaveBeenCalled()
  })

  it('updates zendesk and throws an error if it is unable to initiate an athena query', async () => {
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
      queryParameters: ['123']
    })
    mockStartQueryExecution.mockResolvedValue({
      queryExecuted: false,
      error: 'test athena error'
    })

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrow(
      'test athena error'
    )
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockCreateQuerySql).toHaveBeenCalledWith(dataPathsTestDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['123']
    })
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'test athena error',
      'closed'
    )
    expect(mockUpdateQueryByZendeskId).not.toHaveBeenCalled()
  })
})
