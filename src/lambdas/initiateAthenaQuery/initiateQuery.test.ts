import { initiateQuery } from './initiateQuery'
import { startQueryExecution } from './startQueryExecution'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { createQuerySql } from './createQuerySql'
import { updateQueryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBUpdate'
import {
  dataPathsTestDataRequest,
  noIdTestDataRequest,
  testDataRequest
} from '../../utils/tests/testDataRequest'
import { ZENDESK_TICKET_ID } from '../../utils/tests/testConstants'

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
  })

  it('updates the database when the athena query is initiated', async () => {
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['123']
    })
    mockStartQueryExecution.mockReturnValue({
      queryExecuted: true,
      queryExecutionId: '123'
    })

    await initiateQuery(ZENDESK_TICKET_ID)
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockCreateQuerySql).toHaveBeenCalledWith(testDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['123']
    })
    expect(mockUpdateQueryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'athenaQueryId',
      '123'
    )
  })

  it('closes the zendesk ticket if the database update fails', async () => {
    mockCreateQuerySql.mockReturnValue({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['234']
    })
    mockStartQueryExecution.mockReturnValue({
      queryExecuted: true,
      queryExecutionId: '123'
    })
    mockUpdateQueryByZendeskId.mockRejectedValue(new Error('test error'))

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrow(
      `Error updating database for zendesk ticket: ${ZENDESK_TICKET_ID}`
    )
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockCreateQuerySql).toHaveBeenCalledWith(testDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['234']
    })
    expect(mockUpdateQueryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'athenaQueryId',
      '123'
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

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrow(
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

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrow(
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
      queryParameters: ['234']
    })
    mockStartQueryExecution.mockResolvedValue({
      queryExecuted: false,
      error: new Error('test athena error')
    })

    await expect(initiateQuery(ZENDESK_TICKET_ID)).rejects.toThrow(
      'test athena error'
    )
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockCreateQuerySql).toHaveBeenCalledWith(dataPathsTestDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['234']
    })
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      `Athena query execution failed for zendesk ticket: ${ZENDESK_TICKET_ID}`,
      'closed'
    )
    expect(mockUpdateQueryByZendeskId).not.toHaveBeenCalled()
  })
})
