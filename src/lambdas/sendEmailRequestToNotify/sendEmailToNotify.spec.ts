import { sendEmailToNotify } from './sendEmailToNotify'
import { NotifyClient } from 'notifications-node-client'
import { retrieveNotifySecrets } from '../../sharedServices/secrets/retrieveNotifyApiSecrets'
import {
  ALL_NOTIFY_SECRETS,
  TEST_NOTIFY_EMAIL,
  TEST_NOTIFY_NAME,
  TEST_SECURE_DOWNLOAD_URL,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { testSuccessfulNotifyResponse } from '../../utils/tests/testNotifyResponses'

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => {
    return { sendEmail: mockSendEmail }
  })
}))
jest.mock('../../sharedServices/secrets/retrieveNotifyApiSecrets', () => ({
  retrieveNotifySecrets: jest.fn()
}))

const mockRetrieveNotifySecrets = retrieveNotifySecrets as jest.Mock
const mockSendEmail = jest.fn()

const givenNotifySecretsAvailable = () => {
  mockRetrieveNotifySecrets.mockResolvedValue(ALL_NOTIFY_SECRETS)
}
const givenNotifySecretsUnavailable = () => {
  mockRetrieveNotifySecrets.mockImplementation(() => {
    throw Error('Notify secrets not available')
  })
}
const givenSuccessfulSendEmailRequest = () => {
  mockSendEmail.mockResolvedValue(testSuccessfulNotifyResponse)
}
const givenUnsuccessfulSendEmailRequest = () => {
  mockSendEmail.mockImplementation(() => {
    throw new Error('A Notify related error')
  })
}
const requestDetails = {
  email: TEST_NOTIFY_EMAIL,
  firstName: TEST_NOTIFY_NAME,
  zendeskId: ZENDESK_TICKET_ID,
  secureDownloadUrl: TEST_SECURE_DOWNLOAD_URL
}

describe('sendEmailToNotify', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('given correct parameters, sends an email and logs the response information', async () => {
    jest.spyOn(global.console, 'log')
    givenNotifySecretsAvailable()
    givenSuccessfulSendEmailRequest()

    await sendEmailToNotify(requestDetails)

    expect(NotifyClient).toHaveBeenCalledWith(ALL_NOTIFY_SECRETS.notifyApiKey)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledWith(
      ALL_NOTIFY_SECRETS.notifyTemplateId,
      TEST_NOTIFY_EMAIL,
      {
        personalisation: {
          firstName: TEST_NOTIFY_NAME,
          zendeskId: ZENDESK_TICKET_ID,
          secureDownloadUrl: TEST_SECURE_DOWNLOAD_URL
        }
      }
    )
    expect(console.log).toHaveBeenLastCalledWith({
      status: 201,
      emailSentTo: TEST_NOTIFY_EMAIL,
      subjectLine: 'Your data query has completed'
    })
  })
  it('given correct parameters and send email fails an error is thrown', async () => {
    givenNotifySecretsAvailable()
    givenUnsuccessfulSendEmailRequest()

    await expect(sendEmailToNotify(requestDetails)).rejects.toThrow(
      'A Notify related error'
    )
  })
  it('given correct parameters and no secrets are available, an error is thrown', async () => {
    givenNotifySecretsUnavailable()

    await expect(sendEmailToNotify(requestDetails)).rejects.toThrow(
      'Notify secrets not available'
    )
  })
})
