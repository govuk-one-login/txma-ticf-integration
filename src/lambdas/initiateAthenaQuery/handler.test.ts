import { handler } from './handler'
import * as initiateQueryImportWrapper from './handler'
import { confirmAthenaTable } from './confirmAthenaTable'
import { startQueryExecution } from './startQueryExecution'
import {
  testAthenaQueryEvent,
  testManualAthenaQueryEvent
} from '../../utils/tests/events/initiateAthenaQueryEvent'
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
import { publishToSNS } from '../../sharedServices/sns/publishToSNS'
import { logger } from '../../sharedServices/logger'

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
const mockPublishToSNS = publishToSNS as jest.Mock

describe('initiate athena query handler', () => {
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

    const testZendeskId = testAthenaQueryEvent.Records[0].body
    await handler(testAthenaQueryEvent, mockLambdaContext)
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockCreateQuerySql).toHaveBeenCalledWith(dataPathsTestDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['123']
    })
    expect(mockUpdateQueryByZendeskId).toHaveBeenCalledWith(
      testZendeskId,
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
    const testZendeskId = testAthenaQueryEvent.Records[0].body
    await expect(
      handler(testAthenaQueryEvent, mockLambdaContext)
    ).rejects.toThrow('test error message')
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      testZendeskId,
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
    const testZendeskId = testAthenaQueryEvent.Records[0].body

    await expect(
      handler(testAthenaQueryEvent, mockLambdaContext)
    ).rejects.toThrow('sql error message')
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(testZendeskId)
    expect(mockCreateQuerySql).toHaveBeenCalledWith(noIdTestDataRequest)
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      testZendeskId,
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

    const testZendeskId = testAthenaQueryEvent.Records[0].body

    await expect(
      handler(testAthenaQueryEvent, mockLambdaContext)
    ).rejects.toThrow('test athena error')
    expect(mockConfirmAthenaTable).toHaveBeenCalled()
    expect(mockGetDatabaseEntryByZendeskId).toHaveBeenCalledWith(testZendeskId)
    expect(mockCreateQuerySql).toHaveBeenCalledWith(dataPathsTestDataRequest)
    expect(mockStartQueryExecution).toHaveBeenCalledWith({
      sqlGenerated: true,
      sql: 'test sql string',
      queryParameters: ['123']
    })
    expect(mockUpdateZendeskTicket).toHaveBeenCalledWith(
      testZendeskId,
      'test athena error',
      'closed'
    )
    expect(mockUpdateQueryByZendeskId).not.toHaveBeenCalled()
  })
})

describe('tests related to running manual queries', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(logger, 'info')
    jest.spyOn(initiateQueryImportWrapper, 'initiateQuery')
  })

  it('checks that the lambda exits early and does not run an athena query as it is a manual query', async () => {
    const testZendeskId = testManualAthenaQueryEvent.Records[0].body
    mockPublishToSNS.mockResolvedValue('messageID')
    await handler(testManualAthenaQueryEvent, mockLambdaContext)
    expect(mockPublishToSNS).toHaveBeenCalledWith(
      'arn:aws:sns:eu-west-2:123456789012:email-to-slack-topic',
      `Retrieved data for zendeskID: ${testZendeskId}`
    )
    expect(logger.info).toHaveBeenCalledWith(
      'Manual query detected, no need to run athena query'
    )
    expect(initiateQueryImportWrapper.initiateQuery).not.toHaveBeenCalled()
  })
})
