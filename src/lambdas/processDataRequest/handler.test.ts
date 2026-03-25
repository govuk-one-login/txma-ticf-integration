import { vi } from 'vitest'
import { initiateDataTransfer } from './initiateDataTransfer'
import { handler } from './handler'
import { constructSqsEvent } from '../../../common/utils/tests/events/sqsEvent'
import { testDataRequest } from '../../../common/utils/tests/testDataRequest'
import { ZENDESK_TICKET_ID } from '../../../common/utils/tests/testConstants'
import { checkDataTransferStatus } from './checkDataTransferStatus'
import { mockLambdaContext } from '../../../common/utils/tests/mocks/mockLambdaContext'

vi.mock('./initiateDataTransfer', () => ({
  initiateDataTransfer: vi.fn()
}))

const initiateDataTransferMock = vi.mocked(initiateDataTransfer)

vi.mock('./checkDataTransferStatus', () => ({
  checkDataTransferStatus: vi.fn()
}))

describe('processDataRequest', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should handle a valid initiate data request event', async () => {
    await handler(
      constructSqsEvent(JSON.stringify(testDataRequest)),
      mockLambdaContext
    )

    expect(initiateDataTransferMock).toHaveBeenCalledWith(testDataRequest)
  })

  it('should handle a valid continue data transfer event', async () => {
    await handler(
      constructSqsEvent(JSON.stringify({ zendeskId: ZENDESK_TICKET_ID })),
      mockLambdaContext
    )
    expect(checkDataTransferStatus).toHaveBeenCalledWith(ZENDESK_TICKET_ID)
  })

  it('should throw an appropriate error if there is no data in the event', async () => {
    await expect(
      handler({ Records: [] }, mockLambdaContext)
    ).rejects.toThrowError('No data in event')
    expect(initiateDataTransferMock).not.toHaveBeenCalled()
  })

  it('should throw an appropriate error if the request includes data of the wrong shape', async () => {
    const initiateDataRequestEvent = constructSqsEvent(
      JSON.stringify({ someProperty: 'someValue' })
    )
    await expect(
      handler(initiateDataRequestEvent, mockLambdaContext)
    ).rejects.toThrowError('Event data was not of the correct type')
    expect(initiateDataTransferMock).not.toHaveBeenCalled()
  })

  it('should throw an appropriate error if the request includes non-JSON data', async () => {
    const initiateDataRequestEvent = constructSqsEvent('some message')
    await expect(
      handler(initiateDataRequestEvent, mockLambdaContext)
    ).rejects.toThrowError('Event data did not include a valid JSON body')
    expect(initiateDataTransferMock).not.toHaveBeenCalled()
  })
})
