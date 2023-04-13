import { handler } from './handler'
import * as initiateQueryImportWrapper from './initiateQuery'
import { testManualAthenaQueryEvent } from '../../utils/tests/events/initiateAthenaQueryEvent'
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

const mockPublishToSNS = publishToSNS as jest.Mock

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
