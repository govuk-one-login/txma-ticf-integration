import { sendSqsMessage } from '../../../src/sharedServices/queue/sendSqsMessage'
import { MOCK_INITIATE_DATA_REQUEST_QUEUE_URL } from '../../../src/utils/tests/testConstants'
import { ManualAuditDataRequestPayload } from '../../types/manualAuditDataRequestPayload'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './sendManualAuditDataRequestPayloadToInitiateQueue'

jest.mock('../../../src/sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

describe('sendManualAuditDataRequestPayloadToInitiateQueue', () => {
  it('should send the payload to the initiate queue', async () => {
    const testPayload = {
      zendeskId: 'MR123456789',
      dates: ['2020-01-01']
    }
    await sendManualAuditDataRequestPayloadToInitiateQueue(
      testPayload as ManualAuditDataRequestPayload
    )
    expect(sendSqsMessage).toHaveBeenCalledWith(
      testPayload,
      MOCK_INITIATE_DATA_REQUEST_QUEUE_URL
    )
  })
})
