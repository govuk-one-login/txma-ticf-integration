import { vi, type MockedFunction } from 'vitest'
import { initiateQuery } from './initiateQuery'
import { startQueryExecution } from './startQueryExecution'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { getDatabaseEntryByZendeskId } from '../../../common/sharedServices/dynamoDB/dynamoDBGet'
import { createQuerySql } from './createQuerySql'
import { updateQueryByZendeskId } from '../../../common/sharedServices/dynamoDB/dynamoDBUpdate'
import {
  dataPathsTestDataRequest,
  noIdTestDataRequest,
  testDataRequest
} from '../../../common/utils/tests/testDataRequest'
import { ZENDESK_TICKET_ID } from '../../../common/utils/tests/testConstants'

vi.mock('../../../common/sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: vi.fn()
}))
vi.mock('../../../common/sharedServices/dynamoDB/dynamoDBGet', () => ({
  getDatabaseEntryByZendeskId: vi.fn()
}))
vi.mock('./createQuerySql', () => ({
  createQuerySql: vi.fn()
}))
vi.mock('../../../common/sharedServices/dynamoDB/dynamoDBUpdate', () => ({
  updateQueryByZendeskId: vi.fn()
}))
vi.mock('./startQueryExecution', () => ({
  startQueryExecution: vi.fn()
}))

const mockUpdateZendeskTicket = updateZendeskTicketById as MockedFunction<
  typeof updateZendeskTicketById
>
const mockGetDatabaseEntryByZendeskId =
  getDatabaseEntryByZendeskId as MockedFunction<
    typeof getDatabaseEntryByZendeskId
  >
const mockCreateQuerySql = createQuerySql as MockedFunction<
  typeof createQuerySql
>
const mockUpdateQueryByZendeskId = updateQueryByZendeskId as MockedFunction<
  typeof updateQueryByZendeskId
>
const mockStartQueryExecution = startQueryExecution as MockedFunction<
  typeof startQueryExecution
>

const testAthenaQueryParameters = ['test-query-parameter']
const testAthenaQueryExecutionId = 'test-query-execution-id'

describe('initiateQuery', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetDatabaseEntryByZendeskId.mockResolvedValue({
      requestInfo: testDataRequest
    })
  })

  it('updates the database when the athena query is initiated', async () => {
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: testAthenaQueryParameters
    })
    mockStartQueryExecution.mockResolvedValue({
      queryExecuted: true,
      queryExecutionId: testAthenaQueryExecutionId
    })

    await initiateQuery(ZENDESK_TICKET_ID)
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockCreateQuerySql).toHaveBeenCalledWith(testDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: testAthenaQueryParameters
    })
    expect(mockUpdateQueryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'athenaQueryId',
      testAthenaQueryExecutionId
    )
  })

  it('closes the zendesk ticket if the database update fails', async () => {
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: testAthenaQueryParameters
    })
    mockStartQueryExecution.mockResolvedValue({
      queryExecuted: true,
      queryExecutionId: testAthenaQueryExecutionId
    })
    mockUpdateQueryByZendeskId.mockRejectedValue(new Error('test error'))

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrowError(
      `Error updating database for zendesk ticket: ${ZENDESK_TICKET_ID}`
    )
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockCreateQuerySql).toHaveBeenCalledWith(testDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: testAthenaQueryParameters
    })
    expect(mockUpdateQueryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'athenaQueryId',
      testAthenaQueryExecutionId
    )
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      `Error updating database for zendesk ticket: ${ZENDESK_TICKET_ID}`,
      'closed'
    )
  })

  it('updates zendesk and throws an error if the request data cannot be retrived from the database', async () => {
    mockGetDatabaseEntryByZendeskId.mockRejectedValue(
      new Error('test error message')
    )

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrowError(
      `Error retrieving request details from database for zendesk ticket: ${ZENDESK_TICKET_ID}`
    )
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      `Error retrieving request details from database for zendesk ticket: ${ZENDESK_TICKET_ID}`,
      'closed'
    )
    expect(mockCreateQuerySql).not.toHaveBeenCalled()
    expect(mockStartQueryExecution).not.toHaveBeenCalled()
  })

  it('updates zendesk and throws an error if no query sql is generated', async () => {
    mockGetDatabaseEntryByZendeskId.mockResolvedValue({
      requestInfo: noIdTestDataRequest
    })
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: false,
      error: 'sql error message'
    })

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrowError(
      'sql error message'
    )
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
    mockGetDatabaseEntryByZendeskId.mockResolvedValue({
      requestInfo: dataPathsTestDataRequest
    })
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: testAthenaQueryParameters
    })
    mockStartQueryExecution.mockResolvedValue({
      queryExecuted: false,
      error: new Error('test athena error')
    })

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrowError(
      'test athena error'
    )
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockCreateQuerySql).toHaveBeenCalledWith(dataPathsTestDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: testAthenaQueryParameters
    })
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      `Athena query execution failed for zendesk ticket: ${ZENDESK_TICKET_ID}`,
      'closed'
    )
    expect(mockUpdateQueryByZendeskId).not.toHaveBeenCalled()
  })
})
