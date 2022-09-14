import { sendInitiateDataTransferMessage } from './sendInitiateDataTransferMessage'
import { getEnv } from '../../utils/helpers'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { sendSqsMessage } from './sendSqsMessage'
jest.mock('../../utils/helpers', () => ({
  getEnv: jest.fn()
}))
jest.mock('./sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

const mockGetEnv = getEnv as jest.Mock<string>
const mockSendSqsMessage = sendSqsMessage as jest.Mock

const MOCK_QUEUE_URL = 'https://my_queue_'
describe('sendInitiateDataTransferMessage', () => {
  const givenQueueUrlAvailable = () => {
    mockGetEnv.mockReturnValue(MOCK_QUEUE_URL)
  }
  it('sends message to correct queue', async () => {
    givenQueueUrlAvailable()

    await sendInitiateDataTransferMessage(testDataRequest)
    expect(mockGetEnv).toHaveBeenCalledWith('INITIATE_DATA_REQUEST_QUEUE_URL')
    expect(mockSendSqsMessage).toHaveBeenCalledWith(
      testDataRequest,
      MOCK_QUEUE_URL
    )
  })
})
