import { when } from 'jest-when'
import { sendSqsMessage } from '../../../src/sharedServices/queue/sendSqsMessage'
import { getAwsAccountNumber } from '../../sharedServices/aws/sts/getAwsAccountNumber'
import { ManualAuditDataRequestPayload } from '../../types/manualAuditDataRequestPayload'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './sendManualAuditDataRequestPayloadToInitiateQueue'

jest.mock('../../../src/sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

jest.mock('../../sharedServices/aws/sts/getAwsAccountNumber', () => ({
  getAwsAccountNumber: jest.fn()
}))

describe('sendManualAuditDataRequestPayloadToInitiateQueue', () => {
  it('should send the payload to the initiate queue', async () => {
    const mockAccountNumber = '123456789012'
    const queueUrl = `https://sqs.eu-west-2.amazonaws.com/${mockAccountNumber}/txma-ticf-integration-initiate-data-request-queue`
    const testPayload = {
      zendeskId: 'MR123456789',
      dates: ['2020-01-01']
    }

    when(getAwsAccountNumber).mockResolvedValue(mockAccountNumber)

    await sendManualAuditDataRequestPayloadToInitiateQueue(
      testPayload as ManualAuditDataRequestPayload
    )

    expect(sendSqsMessage).toHaveBeenCalledWith(testPayload, queueUrl)
  })
})
