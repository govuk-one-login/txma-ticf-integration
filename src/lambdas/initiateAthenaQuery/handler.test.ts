import { handler } from './handler'
import {
  testAthenaQueryEvent,
  testAthenaQueryEventNoRecords,
  testAthenaQueryEventSmallZendeskId,
  testManualAthenaQueryEvent
} from '../../utils/tests/events/initiateAthenaQueryEvent'
import { mockLambdaContext } from '../../utils/tests/mocks/mockLambdaContext'
import { publishToSNS } from '../../sharedServices/sns/publishToSNS'
import { logger } from '../../sharedServices/logger'
import { initiateQuery } from './initiateQuery'
import { when } from 'jest-when'

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
jest.mock('./initiateQuery', () => ({
  initiateQuery: jest.fn()
}))

const mockPublishToSNS = publishToSNS as jest.Mock
const mockInitiateQuery = initiateQuery as jest.Mock

describe('tests related to running manual queries', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(logger, 'info')
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
    expect(mockInitiateQuery).not.toHaveBeenCalled()
  })
})

describe('tests related to running automated queries', () => {
  it('checks that the lambda continues as normal as its an automated query', async () => {
    when(initiateQuery).mockResolvedValue()
    const testZendeskId = testAthenaQueryEvent.Records[0].body
    await handler(testAthenaQueryEvent, mockLambdaContext)
    expect(mockInitiateQuery).toHaveBeenCalledTimes(1)
    expect(mockInitiateQuery).toHaveBeenCalledWith(testZendeskId)
  })
})

describe('misc tests', () => {
  it('checks if error is thrown when sqs event has no records', async () => {
    expect(
      handler(testAthenaQueryEventNoRecords, mockLambdaContext)
    ).rejects.toThrow('No data in Athena Query event')
  })

  it('checks if error is thrown when zendeskID has length < 1', async () => {
    expect(
      handler(testAthenaQueryEventSmallZendeskId, mockLambdaContext)
    ).rejects.toThrow('No zendeskId received from SQS')
  })
})
