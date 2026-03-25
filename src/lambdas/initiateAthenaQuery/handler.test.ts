import { vi, type MockedFunction } from 'vitest'
import { handler } from './handler'
import {
  testAthenaQueryEvent,
  testAthenaQueryEventNoRecords,
  testAthenaQueryEventSmallZendeskId,
  testManualAthenaQueryEvent
} from '../../../common/utils/tests/events/initiateAthenaQueryEvent'
import { mockLambdaContext } from '../../../common/utils/tests/mocks/mockLambdaContext'
import { logger } from '../../../common/sharedServices/logger'
import { initiateQuery } from './initiateQuery'

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
vi.mock('./initiateQuery', () => ({
  initiateQuery: vi.fn()
}))

const mockInitiateQuery = initiateQuery as MockedFunction<typeof initiateQuery>

describe('tests related to running manual queries', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(logger, 'info')
  })

  it('checks that the lambda exits early and does not run an athena query as it is a manual query', async () => {
    await handler(testManualAthenaQueryEvent, mockLambdaContext)
    expect(logger.info).toHaveBeenCalledWith(
      'Manual query detected, no need to run athena query'
    )
    expect(mockInitiateQuery).not.toHaveBeenCalled()
  })
})

describe('tests related to running automated queries', () => {
  it('checks that the lambda continues as normal as its an automated query', async () => {
    vi.mocked(initiateQuery).mockResolvedValue()
    const testZendeskId = testAthenaQueryEvent.Records[0].body
    await handler(testAthenaQueryEvent, mockLambdaContext)
    expect(mockInitiateQuery).toHaveBeenCalledTimes(1)
    expect(mockInitiateQuery).toHaveBeenCalledWith(testZendeskId)
  })
})

describe('misc tests', () => {
  it('checks if error is thrown when sqs event has no records', async () => {
    await expect(
      handler(testAthenaQueryEventNoRecords, mockLambdaContext)
    ).rejects.toThrowError('No data in Athena Query event')
  })

  it('checks if error is thrown when zendeskID has length < 1', async () => {
    await expect(
      handler(testAthenaQueryEventSmallZendeskId, mockLambdaContext)
    ).rejects.toThrowError('No zendeskId received from SQS')
  })
})
