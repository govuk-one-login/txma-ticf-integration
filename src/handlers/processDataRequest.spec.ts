import { initiateDataTransfer } from '../services/initiateDataTransfer'
import { InitiateDataTransferResult } from '../types/initiateDataTransferResult'
import { handler } from './processDataRequest'
import { constructInitiateDataRequestEvent } from '../utils/tests/events/initiateDataRequestEvent'
import { testDataRequest } from '../utils/tests/testDataRequest'
jest.mock('../services/initiateDataTransfer', () => ({
  initiateDataTransfer: jest.fn()
}))

const initiateDataTransferMock = initiateDataTransfer as jest.Mock<
  Promise<InitiateDataTransferResult>
>

describe('processDataRequest', () => {
  beforeEach(() => {
    initiateDataTransferMock.mockReset()
  })

  it('should handle a valid data request event', async () => {
    const initiateDataRequestEvent = constructInitiateDataRequestEvent(
      JSON.stringify(testDataRequest)
    )
    await handler(initiateDataRequestEvent)
    expect(initiateDataTransferMock).toHaveBeenCalledWith(testDataRequest)
  })

  it('should throw an appropriate error if there is no data in the event', () => {
    expect(handler({ Records: [] })).rejects.toThrow('No data in event')
    expect(initiateDataTransferMock).not.toHaveBeenCalled()
  })

  it('should throw an appropriate error if the request includes data of the wrong shape', async () => {
    const initiateDataRequestEvent = constructInitiateDataRequestEvent(
      JSON.stringify({ someProperty: 'someValue' })
    )
    expect(handler(initiateDataRequestEvent)).rejects.toThrow(
      'Request data was not of the correct type'
    )
    expect(initiateDataTransferMock).not.toHaveBeenCalled()
  })
})
