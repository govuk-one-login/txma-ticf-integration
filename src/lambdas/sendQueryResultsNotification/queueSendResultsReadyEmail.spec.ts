import { queueSendResultsReadyEmail } from './queueSendResultsReadyEmail'
import { sendSqsMessage } from '../../sharedServices/queue/sendSqsMessage'
import { createSecureDownloadLink } from './createSecureDownloadLink'
import { when } from 'jest-when'
import {
  MOCK_SEND_EMAIL_QUEUE_URL,
  TEST_DOWNLOAD_HASH,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'

jest.mock('../../sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

jest.mock('./createSecureDownloadLink', () => ({
  createSecureDownloadLink: jest.fn()
}))

const MOCK_SECURE_DOWNLOAD_URL = 'http://secure-download-link/123'
describe('queueSendResultsReadyEmail', () => {
  const givenSecureDownloadLinkAvailable = () => {
    when(createSecureDownloadLink).mockReturnValue(MOCK_SECURE_DOWNLOAD_URL)
  }

  it('should queue send email with link', async () => {
    givenSecureDownloadLinkAvailable()
    await queueSendResultsReadyEmail({
      downloadHash: TEST_DOWNLOAD_HASH,
      zendeskTicketId: ZENDESK_TICKET_ID,
      recipientEmail: TEST_RECIPIENT_EMAIL,
      recipientName: TEST_RECIPIENT_NAME
    })
    expect(createSecureDownloadLink).toHaveBeenCalledWith(TEST_DOWNLOAD_HASH)
    expect(sendSqsMessage).toHaveBeenCalledWith(
      {
        firstName: TEST_RECIPIENT_NAME,
        zendeskId: ZENDESK_TICKET_ID,
        secureDownloadUrl: MOCK_SECURE_DOWNLOAD_URL,
        email: TEST_RECIPIENT_EMAIL
      },
      MOCK_SEND_EMAIL_QUEUE_URL
    )
  })
})
