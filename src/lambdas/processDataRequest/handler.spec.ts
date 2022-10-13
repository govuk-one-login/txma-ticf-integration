import { initiateDataTransfer } from './initiateDataTransfer'
import { handler } from './handler'
import { constructSqsEvent } from '../../utils/tests/events/sqsEvent'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { ZENDESK_TICKET_ID } from '../../utils/tests/testConstants'
import { checkDataTransferStatus } from './checkDataTransferStatus'
jest.mock('./initiateDataTransfer', () => ({
  initiateDataTransfer: jest.fn()
}))

const initiateDataTransferMock = initiateDataTransfer as jest.Mock

jest.mock('./checkDataTransferStatus', () => ({
  checkDataTransferStatus: jest.fn()
}))

describe('processDataRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should handle a valid initiate data request event', async () => {
    await handler(constructSqsEvent(JSON.stringify(testDataRequest)))

    expect(initiateDataTransferMock).toHaveBeenCalledWith(testDataRequest)
  })

  it('should handle a valid continue data transfer event', async () => {
    await handler(
      constructSqsEvent(JSON.stringify({ zendeskId: ZENDESK_TICKET_ID }))
    )
    expect(checkDataTransferStatus).toHaveBeenCalledWith(ZENDESK_TICKET_ID)
  })

  it('should throw an appropriate error if there is no data in the event', async () => {
    await expect(handler({ Records: [] })).rejects.toThrow('No data in event')
    expect(initiateDataTransferMock).not.toHaveBeenCalled()
  })

  it('should throw an appropriate error if the request includes data of the wrong shape', async () => {
    const initiateDataRequestEvent = constructSqsEvent(
      JSON.stringify({ someProperty: 'someValue' })
    )
    await expect(handler(initiateDataRequestEvent)).rejects.toThrow(
      'Event data was not of the correct type'
    )
    expect(initiateDataTransferMock).not.toHaveBeenCalled()
  })

  it('should throw an appropriate error if the request includes non-JSON data', async () => {
    const initiateDataRequestEvent = constructSqsEvent('some message')
    await expect(handler(initiateDataRequestEvent)).rejects.toThrow(
      'Event data did not include a valid JSON body'
    )
    expect(initiateDataTransferMock).not.toHaveBeenCalled()
  })
})
